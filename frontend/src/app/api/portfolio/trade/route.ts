import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
  const userId = session.user.id;

  try {
    const body = await req.json();
    const {
      assetType,
      symbol,
      name,
      quantity,
      pricePerUnit,
      transactionType,
      metadata,
      purchaseDate,
    } = body;

    const qty = parseFloat(quantity || '0');
    const price = parseFloat(pricePerUnit || '1');
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata || '{}') : (metadata || {});
    const effectivePurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();

    let resultHolding: any;

    await db.transaction(async (tx) => {
      // 1. Automatic Cash Sweep for market trades (stock, mutual_fund, crypto)
      if (assetType === 'stock' || assetType === 'mutual_fund' || assetType === 'crypto') {
        const totalTradeCost = qty * price;
        const [cashHolding] = await tx
          .select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), eq(holdings.symbol, 'CASH')))
          .limit(1);

        if (cashHolding) {
          const currentCash = parseFloat(cashHolding.quantity?.toString() || '0');
          if (transactionType === 'buy') {
            const newCash = Math.max(0, currentCash - totalTradeCost);
            await tx
              .update(holdings)
              .set({ quantity: newCash.toString(), updatedAt: new Date() })
              .where(eq(holdings.id, cashHolding.id));
          } else if (transactionType === 'sell') {
            const newCash = currentCash + totalTradeCost;
            await tx
              .update(holdings)
              .set({ quantity: newCash.toString(), updatedAt: new Date() })
              .where(eq(holdings.id, cashHolding.id));
          }
        }
      }

      // 2. Find existing holding by symbol
      let existingHolding: any = null;
      if (symbol) {
        const matches = await tx
          .select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), eq(holdings.symbol, symbol)))
          .limit(1);
        if (matches.length > 0) existingHolding = matches[0];
      }

      if (transactionType === 'buy' || transactionType === 'deposit') {
        if (existingHolding) {
          const oldQty = parseFloat(existingHolding.quantity?.toString() || '0');
          const oldAvgCost = parseFloat(existingHolding.avgCost?.toString() || '0');
          const newQty = oldQty + qty;
          const newAvgCost = newQty > 0 ? ((oldQty * oldAvgCost) + (qty * price)) / newQty : price;

          const [updated] = await tx
            .update(holdings)
            .set({
              quantity: newQty.toString(),
              avgCost: newAvgCost.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(holdings.id, existingHolding.id))
            .returning();
          resultHolding = updated;
        } else {
          const [inserted] = await tx
            .insert(holdings)
            .values({
              userId,
              assetType,
              symbol: symbol || null,
              name,
              quantity: qty.toString(),
              avgCost: price.toString(),
              metadata: parsedMetadata,
              purchaseDate: effectivePurchaseDate,
            })
            .returning();
          resultHolding = inserted;
        }
      } else if (transactionType === 'sell' || transactionType === 'withdraw') {
        if (!existingHolding) {
          throw new Error('Cannot sell an asset you do not own.');
        }
        const oldQty = parseFloat(existingHolding.quantity?.toString() || '0');
        if (oldQty < qty) {
          throw new Error('Insufficient quantity to sell.');
        }
        const newQty = oldQty - qty;
        const [updated] = await tx
          .update(holdings)
          .set({
            quantity: newQty.toString(),
            updatedAt: new Date(),
          })
          .where(eq(holdings.id, existingHolding.id))
          .returning();
        resultHolding = updated;
      }

      // 3. Record transaction audit log
      if (resultHolding) {
        await tx.insert(assetTransactions).values({
          holdingId: resultHolding.id,
          type: transactionType || 'buy',
          quantity: qty.toString(),
          pricePerUnit: price.toString(),
          amount: (qty * price).toString(),
          executedAt: effectivePurchaseDate,
        });
      }
    });

    return NextResponse.json(resultHolding);
  } catch (err: any) {
    console.error('Trade execution error:', err);
    return NextResponse.json({ error: err.message || 'Transaction failed' }, { status: 400 });
  }
}
