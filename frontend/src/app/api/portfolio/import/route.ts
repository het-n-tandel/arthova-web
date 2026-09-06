import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { holdings, assetTransactions, type assetTypeEnum } from '@/lib/db/schema';

type AssetType = 'stock' | 'mutual_fund' | 'gold' | 'silver' | 'fd' | 'property' | 'crypto' | 'cash' | 'bond' | 'liability';

// Helper to parse standard CSV line taking quotes into account
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or missing data rows' }, { status: 400 });
    }

    // Identify header row (could be first non-empty line)
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));

    // Heuristics to find column indices
    const symbolIdx = headers.findIndex((h) =>
      h.includes('symbol') || h.includes('ticker') || h.includes('instrument') || h.includes('script')
    );
    const nameIdx = headers.findIndex((h) =>
      h.includes('name') || h.includes('company') || h.includes('scheme') || h.includes('security')
    );
    const qtyIdx = headers.findIndex((h) =>
      h.includes('qty') || h.includes('quantity') || h.includes('shares') || h.includes('units')
    );
    const priceIdx = headers.findIndex((h) =>
      h.includes('avgcost') || h.includes('buyprice') || h.includes('price') || h.includes('avgprice') || h.includes('rate') || h.includes('nav') || h.includes('cost')
    );
    const dateIdx = headers.findIndex((h) =>
      h.includes('date') || h.includes('tradedate') || h.includes('purchasedate')
    );
    const typeIdx = headers.findIndex((h) =>
      h.includes('type') || h.includes('assettype') || h.includes('segment')
    );

    const parsedHoldings: Array<{
      assetType: AssetType;
      symbol: string;
      name: string;
      quantity: string;
      avgCost: string;
      purchaseDate: Date;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length <= 1) continue;

      let symbol = symbolIdx >= 0 ? row[symbolIdx] : '';
      let name = nameIdx >= 0 ? row[nameIdx] : '';
      const rawQty = qtyIdx >= 0 ? row[qtyIdx]?.replace(/,/g, '') : '0';
      const rawPrice = priceIdx >= 0 ? row[priceIdx]?.replace(/,/g, '') : '0';
      const rawDate = dateIdx >= 0 ? row[dateIdx] : null;
      const rawType = typeIdx >= 0 ? row[typeIdx]?.toLowerCase() : '';

      const quantity = parseFloat(rawQty) || 0;
      const avgCost = parseFloat(rawPrice) || 0;

      if (quantity <= 0) continue;

      if (!symbol && name) {
        symbol = name.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
      } else if (!name && symbol) {
        name = symbol;
      }

      if (!symbol && !name) continue;

      // Determine asset type
      let assetType: AssetType = 'stock';
      if (rawType.includes('fund') || rawType.includes('mf') || name.toLowerCase().includes('fund') || name.toLowerCase().includes('etf')) {
        assetType = 'mutual_fund';
      } else if (rawType.includes('gold') || name.toLowerCase().includes('gold')) {
        assetType = 'gold';
      } else if (rawType.includes('crypto') || name.toLowerCase().includes('crypto') || symbol.endsWith('USDT')) {
        assetType = 'crypto';
      } else if (rawType.includes('bond') || name.toLowerCase().includes('bond')) {
        assetType = 'bond';
      }

      // Add NSE ticker suffix if stock and doesn't have it
      if (assetType === 'stock' && !symbol.includes('.') && !symbol.includes(':')) {
        symbol = `${symbol.toUpperCase()}.NS`;
      }

      let parsedDate = new Date();
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      parsedHoldings.push({
        assetType,
        symbol: symbol.trim(),
        name: name.trim(),
        quantity: quantity.toString(),
        avgCost: avgCost.toString(),
        purchaseDate: parsedDate,
      });
    }

    if (parsedHoldings.length === 0) {
      return NextResponse.json(
        { error: 'No valid holdings rows could be parsed from the CSV. Please check columns.' },
        { status: 400 }
      );
    }

    // Insert into database
    let insertedCount = 0;
    let totalImportedValue = 0;

    for (const h of parsedHoldings) {
      const qtyNum = parseFloat(h.quantity);
      const priceNum = parseFloat(h.avgCost);
      totalImportedValue += qtyNum * priceNum;

      const [newHolding] = await db
        .insert(holdings)
        .values({
          userId,
          assetType: h.assetType,
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          avgCost: h.avgCost,
          purchaseDate: h.purchaseDate,
          metadata: {
            importedFromCsv: true,
            importedAt: new Date().toISOString(),
            fileName: file.name,
          },
        })
        .returning();

      await db.insert(assetTransactions).values({
        holdingId: newHolding.id,
        type: 'buy',
        quantity: h.quantity,
        pricePerUnit: h.avgCost,
        amount: (qtyNum * priceNum).toString(),
        executedAt: h.purchaseDate,
      });

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount: insertedCount,
      totalImportedValue,
      message: `Successfully imported ${insertedCount} holdings from ${file.name}`,
    });
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
