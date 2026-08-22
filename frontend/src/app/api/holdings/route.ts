import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions, latestPrices } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
  const userId = session.user.id;

  // Use raw SQL for the join to get holdings with their latest prices
  const result = await db.execute(sql`
    SELECT 
      h.*, 
      COALESCE(p.latest_price, h.avg_cost) as current_price
    FROM holdings h
    LEFT JOIN latest_prices p ON p.symbol = h.symbol
    WHERE h.user_id = ${userId} AND h.quantity > 0;
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
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
}
