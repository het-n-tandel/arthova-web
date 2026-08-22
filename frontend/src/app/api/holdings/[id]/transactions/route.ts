import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();
  const txQuantity = Number(body.quantity);
  const txPrice = Number(body.pricePerUnit);
  const isAddition = body.type === 'buy' || body.type === 'deposit';

  let updatedHolding;
  const resolvedParams = await params;
  const holdingId = resolvedParams.id;
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    const [holding] = await tx.select().from(holdings).where(and(eq(holdings.id, holdingId), eq(holdings.userId, userId)));
    if (!holding) throw new Error('Holding not found');

    const currentQty = Number(holding.quantity);
    const currentCost = Number(holding.avgCost);
    
    let newQty = currentQty;
    let newCost = currentCost;

    if (isAddition) {
      newQty = currentQty + txQuantity;
      // Recalculate weighted average
      newCost = ((currentQty * currentCost) + (txQuantity * txPrice)) / newQty;
    } else {
      newQty = currentQty - txQuantity;
      // Cost basis doesn't change on sell
    }

    if (newQty < 0) throw new Error('Cannot sell more than owned');

    [updatedHolding] = await tx.update(holdings)
      .set({ quantity: newQty.toString(), avgCost: newCost.toString(), updatedAt: new Date() })
      .where(eq(holdings.id, holdingId))
      .returning();

    await tx.insert(assetTransactions).values({
      holdingId: holdingId,
      type: body.type,
      quantity: txQuantity.toString(),
      pricePerUnit: txPrice.toString(),
      amount: (txQuantity * txPrice).toString(),
    });
  });

  return NextResponse.json(updatedHolding);
}
