import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { dematAccounts, holdings, assetTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Preset broker holding configurations to synchronize when an account is linked
const BROKER_PRESETS: Record<string, Array<{
  assetType: 'stock' | 'mutual_fund' | 'cash';
  symbol: string;
  name: string;
  quantity: string;
  avgCost: string;
  metadata: Record<string, any>;
}>> = {
  'Zerodha (Kite)': [
    {
      assetType: 'stock',
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries Ltd',
      quantity: '15',
      avgCost: '2850.00',
      metadata: { exchange: 'NSE', sector: 'Energy / Retail' },
    },
    {
      assetType: 'stock',
      symbol: 'INFY.NS',
      name: 'Infosys Ltd',
      quantity: '25',
      avgCost: '1780.00',
      metadata: { exchange: 'NSE', sector: 'Information Technology' },
    },
    {
      assetType: 'stock',
      symbol: 'HDFCBANK.NS',
      name: 'HDFC Bank Ltd',
      quantity: '20',
      avgCost: '1620.00',
      metadata: { exchange: 'NSE', sector: 'Banking' },
    },
    {
      assetType: 'mutual_fund',
      symbol: '120716',
      name: 'Parag Parikh Flexi Cap Fund Direct-Growth',
      quantity: '120',
      avgCost: '68.50',
      metadata: {
        isSIP: true,
        monthlySipAmount: 5000,
        sipFrequency: 'Monthly',
        folioNo: 'PPFAS-982134',
        nav: '74.20',
      },
    },
    {
      assetType: 'cash',
      symbol: 'ZERODHA-CASH',
      name: 'Zerodha Trading Cash Balance',
      quantity: '12500',
      avgCost: '1',
      metadata: { type: 'locker', amount: '12500' },
    },
  ],
  'Groww': [
    {
      assetType: 'stock',
      symbol: 'TATAMOTORS.NS',
      name: 'Tata Motors Ltd',
      quantity: '40',
      avgCost: '920.00',
      metadata: { exchange: 'NSE', sector: 'Automobile' },
    },
    {
      assetType: 'stock',
      symbol: 'ITC.NS',
      name: 'ITC Ltd',
      quantity: '100',
      avgCost: '425.00',
      metadata: { exchange: 'NSE', sector: 'FMCG' },
    },
    {
      assetType: 'mutual_fund',
      symbol: '118989',
      name: 'Mirae Asset Large Cap Fund Direct-Growth',
      quantity: '150',
      avgCost: '95.00',
      metadata: {
        isSIP: true,
        monthlySipAmount: 4000,
        sipFrequency: 'Monthly',
        folioNo: 'MIRAE-442198',
        nav: '104.50',
      },
    },
    {
      assetType: 'cash',
      symbol: 'GROWW-CASH',
      name: 'Groww Trading Balance',
      quantity: '8400',
      avgCost: '1',
      metadata: { type: 'locker', amount: '8400' },
    },
  ],
  'Angel One': [
    {
      assetType: 'stock',
      symbol: 'ICICIBANK.NS',
      name: 'ICICI Bank Ltd',
      quantity: '30',
      avgCost: '1180.00',
      metadata: { exchange: 'NSE', sector: 'Banking' },
    },
    {
      assetType: 'mutual_fund',
      symbol: '120503',
      name: 'Axis Small Cap Fund Direct-Growth',
      quantity: '200',
      avgCost: '82.50',
      metadata: {
        isSIP: true,
        monthlySipAmount: 3000,
        sipFrequency: 'Monthly',
        folioNo: 'AXIS-663219',
        nav: '91.80',
      },
    },
  ],
  'Upstox': [
    {
      assetType: 'stock',
      symbol: 'SBIN.NS',
      name: 'State Bank of India',
      quantity: '35',
      avgCost: '820.00',
      metadata: { exchange: 'NSE', sector: 'Banking' },
    },
    {
      assetType: 'stock',
      symbol: 'L&T.NS',
      name: 'Larsen & Toubro Ltd',
      quantity: '12',
      avgCost: '3550.00',
      metadata: { exchange: 'NSE', sector: 'Infrastructure' },
    },
  ],
};

// GET /api/demat - list connected accounts and synced assets summary
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await db
      .select()
      .from(dematAccounts)
      .where(eq(dematAccounts.userId, userId));

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    const result = accounts.map((acc) => {
      let broker = acc.brokerName;
      let clientId = 'Active';
      if (acc.brokerName.includes(':::')) {
        const [b, c] = acc.brokerName.split(':::');
        broker = b;
        clientId = c;
      }

      const syncedItems = userHoldings.filter((h) => {
        const meta = (h.metadata as any) || {};
        return (
          meta.dematAccountId === acc.id ||
          meta.brokerName === broker ||
          meta.brokerName === acc.brokerName
        );
      });

      const totalVal = syncedItems.reduce(
        (accSum, h) => accSum + (parseFloat(h.quantity?.toString() || '0') * parseFloat(h.avgCost?.toString() || '0')),
        0
      );

      return {
        id: acc.id,
        brokerName: broker,
        clientId,
        connectedAt: acc.connectedAt,
        syncedHoldingsCount: syncedItems.length,
        syncedValue: totalVal,
        holdings: syncedItems.map((h) => ({
          id: h.id,
          symbol: h.symbol,
          name: h.name,
          assetType: h.assetType,
          quantity: parseFloat(h.quantity?.toString() || '0'),
          avgCost: parseFloat(h.avgCost?.toString() || '0'),
          isSIP: Boolean((h.metadata as any)?.isSIP),
          monthlySipAmount: (h.metadata as any)?.monthlySipAmount,
        })),
      };
    });

    return NextResponse.json({ accounts: result });
  } catch (error: any) {
    console.error('Error fetching demat accounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/demat - connect broker and auto-sync initial holdings & SIPs
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brokerName, clientId } = await req.json();
    if (!brokerName) {
      return NextResponse.json({ error: 'brokerName is required' }, { status: 400 });
    }

    const clientIdentifier = clientId?.trim() || `${brokerName.slice(0, 2).toUpperCase()}${Math.floor(10000000 + Math.random() * 90000000)}`;
    const encodedBrokerName = `${brokerName}:::${clientIdentifier}`;

    // 1. Insert demat_accounts record
    const [dematRecord] = await db
      .insert(dematAccounts)
      .values({
        userId,
        brokerName: encodedBrokerName,
      })
      .returning();

    // 2. Fetch preset holdings for this broker
    const presets = BROKER_PRESETS[brokerName] || BROKER_PRESETS['Zerodha (Kite)'];
    const insertedHoldings = [];

    for (const item of presets) {
      const metadata = {
        ...item.metadata,
        brokerName,
        dematAccountId: dematRecord.id,
        clientId: clientIdentifier,
        dematSynced: true,
        syncedAt: new Date().toISOString(),
      };

      const [newHolding] = await db
        .insert(holdings)
        .values({
          userId,
          assetType: item.assetType,
          symbol: item.symbol,
          name: item.name,
          quantity: item.quantity,
          avgCost: item.avgCost,
          purchaseDate: new Date(),
          metadata,
        })
        .returning();

      // Record transaction
      const qtyNum = parseFloat(item.quantity);
      const priceNum = parseFloat(item.avgCost);
      await db.insert(assetTransactions).values({
        holdingId: newHolding.id,
        type: 'buy',
        quantity: item.quantity,
        pricePerUnit: item.avgCost,
        amount: (qtyNum * priceNum).toString(),
      });

      insertedHoldings.push(newHolding);
    }

    return NextResponse.json({
      success: true,
      account: {
        id: dematRecord.id,
        brokerName,
        clientId: clientIdentifier,
        connectedAt: dematRecord.connectedAt,
      },
      syncedHoldings: insertedHoldings.length,
    });
  } catch (error: any) {
    console.error('Error linking demat account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/demat - unlink broker account and remove associated synced assets
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account id is required' }, { status: 400 });
    }

    // Verify ownership
    const accountRows = await db
      .select()
      .from(dematAccounts)
      .where(and(eq(dematAccounts.id, accountId), eq(dematAccounts.userId, userId)));

    if (accountRows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const account = accountRows[0];
    const rawBroker = account.brokerName.split(':::')[0];

    // Find synced holdings
    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    const holdingsToDelete = userHoldings.filter((h) => {
      const meta = (h.metadata as any) || {};
      return meta.dematAccountId === accountId || meta.brokerName === rawBroker;
    });

    for (const h of holdingsToDelete) {
      await db.delete(assetTransactions).where(eq(assetTransactions.holdingId, h.id));
      await db.delete(holdings).where(eq(holdings.id, h.id));
    }

    // Remove demat_accounts row
    await db.delete(dematAccounts).where(eq(dematAccounts.id, accountId));

    return NextResponse.json({
      success: true,
      removedHoldings: holdingsToDelete.length,
    });
  } catch (error: any) {
    console.error('Error unlinking demat account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
