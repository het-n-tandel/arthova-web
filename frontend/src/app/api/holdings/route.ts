import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions, latestPrices } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
    const userId = session.user.id;

    // Fetch all holdings for user that either have positive quantity, or are cash/income/salary/liability
    const result = await db.execute(sql`
      SELECT 
        h.*, 
        COALESCE(p.latest_price, h.avg_cost) as current_price
      FROM holdings h
      LEFT JOIN latest_prices p ON p.symbol = h.symbol
      WHERE h.user_id = ${userId} 
        AND (
          h.quantity > 0 
          OR h.asset_type IN ('cash', 'liability', 'fd', 'property', 'bond')
          OR h.symbol = 'CASH'
          OR (h.metadata->>'isSalary') = 'true'
          OR h.symbol = 'SALARY'
        );
    `);

    // Map snake_case DB columns → camelCase so use-portfolio.ts can read h.assetType, h.avgCost, etc.
    const rows = (result?.rows || []).map((row: any) => ({
      ...row,
      assetType:    row.asset_type,
      avgCost:      row.avg_cost,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
      purchaseDate: row.purchase_date,
      userId:       row.user_id,
      currentPrice: row.current_price,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching holdings from database:', err);
    // Return empty array instead of 500 error to keep client UI operational
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
    const userId = session.user.id;

    const body = await req.json();
    
    let newHolding;
    await db.transaction(async (tx) => {
      const [insertedHolding] = await tx.insert(holdings).values({
        userId: userId,
        assetType: body.assetType,
        symbol: body.symbol || null,
        name: body.name,
        quantity: body.quantity.toString(),
        avgCost: body.pricePerUnit.toString(),
        metadata: body.metadata || {},
      }).returning();
      
      newHolding = insertedHolding;

      await tx.insert(assetTransactions).values({
        holdingId: insertedHolding.id,
        type: body.transactionType || 'buy',
        quantity: body.quantity.toString(),
        pricePerUnit: body.pricePerUnit.toString(),
        amount: (Number(body.quantity) * Number(body.pricePerUnit)).toString(),
      });
    });

    return NextResponse.json(newHolding);
  } catch (err: any) {
    console.error('Error creating holding in database:', err);
    return NextResponse.json({ error: err.message || 'Failed to create holding' }, { status: 500 });
  }
}
