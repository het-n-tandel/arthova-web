import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { holdings, assetTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
      .select({
        id: assetTransactions.id,
        type: assetTransactions.type,
        quantity: assetTransactions.quantity,
        pricePerUnit: assetTransactions.pricePerUnit,
        amount: assetTransactions.amount,
        executedAt: assetTransactions.executedAt,
        holdingName: holdings.name,
        holdingSymbol: holdings.symbol,
        assetType: holdings.assetType,
      })
      .from(assetTransactions)
      .innerJoin(holdings, eq(assetTransactions.holdingId, holdings.id))
      .where(eq(holdings.userId, userId))
      .orderBy(desc(assetTransactions.executedAt))
      .limit(10);

    const activities = rows.map((r) => {
      const isOutflow = r.type === 'buy' || r.type === 'withdraw';
      const numAmount = parseFloat(r.amount?.toString() || '0');
      const signedAmount = isOutflow ? -numAmount : numAmount;

      const sym = r.holdingSymbol ? ` (${r.holdingSymbol.replace('.NS', '')})` : '';
      const actionLabel = r.type === 'buy' ? 'Bought' : r.type === 'sell' ? 'Sold' : r.type === 'deposit' ? 'Deposited' : 'Withdrew';
      const description = `${actionLabel} ${r.holdingName}${sym}`;

      return {
        id: r.id,
        description,
        amount: signedAmount,
        date: r.executedAt ? new Date(r.executedAt).toISOString() : new Date().toISOString(),
        type: r.type,
        quantity: parseFloat(r.quantity?.toString() || '0'),
        price: parseFloat(r.pricePerUnit?.toString() || '0'),
      };
    });

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ activities: [] });
  }
}
