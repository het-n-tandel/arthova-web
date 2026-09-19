import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, holdings, assetTransactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userList.length === 0) {
      return NextResponse.json({ activePlan: null });
    }

    const profileMeta = (userList[0].profileMetadata as any) || {};
    const activePlan = profileMeta.rebalancePlan || null;

    if (activePlan) {
      // Verify holdings still exist in database
      const userHoldings = await db.select().from(holdings).where(eq(holdings.userId, userId));
      const hasPlanHoldings = userHoldings.some(h => 
        (h.metadata as any)?.source === 'smart_rebalance' ||
        activePlan.trades?.some((t: any) => t.symbol === h.symbol)
      );

      if (!hasPlanHoldings) {
        return NextResponse.json({ activePlan: null });
      }
    }

    return NextResponse.json({ activePlan });
  } catch (err: any) {
    console.error('Error fetching rebalance plan:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, amount, trades } = body; // action: 'deploy' | 'reset'

    if (action !== 'deploy' && action !== 'reset') {
      return NextResponse.json({ error: 'Invalid action. Must be deploy or reset.' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const result = await db.transaction(async (tx) => {
      // 1. Fetch user and current metadata
      const [userRow] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userRow) throw new Error('User not found');

      const profileMeta = (userRow.profileMetadata as any) || {};
      const previousPlan = profileMeta.rebalancePlan;

      // 2. REVERT PREVIOUS REBALANCE PLAN (if any)
      if (previousPlan && Array.isArray(previousPlan.trades)) {
        for (const prevTrade of previousPlan.trades) {
          // EXPLICIT GUARD: Never delete or touch Cash or Income
          if (
            prevTrade.assetType === 'cash' || 
            prevTrade.symbol === 'CASH' ||
            prevTrade.symbol?.toLowerCase().includes('salary') ||
            prevTrade.symbol?.toLowerCase().includes('saving')
          ) {
            continue;
          }

          const [existingHolding] = await tx.select()
            .from(holdings)
            .where(and(eq(holdings.userId, userId), eq(holdings.symbol, prevTrade.symbol)))
            .limit(1);

          if (existingHolding) {
            // EXPLICIT GUARD: Never delete or alter Cash, Savings, Salary, or Income
            const isCashOrIncome = existingHolding.assetType === 'cash' ||
              (existingHolding.metadata as any)?.type === 'income' ||
              (existingHolding.metadata as any)?.type === 'locker' ||
              existingHolding.symbol === 'CASH' ||
              existingHolding.name?.toLowerCase().includes('salary') ||
              existingHolding.name?.toLowerCase().includes('income') ||
              existingHolding.name?.toLowerCase().includes('saving');

            if (isCashOrIncome) {
              continue;
            }

            const isPureRebalance = (existingHolding.metadata as any)?.source === 'smart_rebalance' ||
              (existingHolding.metadata as any)?.category === 'Equity Rebalance' ||
              (existingHolding.metadata as any)?.category === 'Precious Metals Hedge' ||
              existingHolding.symbol === 'FD-HDFC-SEC';

            const curQty = Number(existingHolding.quantity);
            const planQty = Number(prevTrade.quantity);

            if (isPureRebalance || curQty <= planQty) {
              // Delete transactions and delete holding completely
              await tx.delete(assetTransactions).where(eq(assetTransactions.holdingId, existingHolding.id));
              await tx.delete(holdings).where(eq(holdings.id, existingHolding.id));
            } else {
              // Subtract plan quantity
              const newQty = curQty - planQty;
              await tx.update(holdings)
                .set({ quantity: newQty.toString(), updatedAt: new Date() })
                .where(eq(holdings.id, existingHolding.id));
            }
          }
        }
      }

      // Also clean up any orphan rebalance holdings (strictly protecting Cash & Income)
      const orphanRebalanceHoldings = await tx.select()
        .from(holdings)
        .where(and(
          eq(holdings.userId, userId),
          sql`(metadata->>'source' = 'smart_rebalance')`,
          sql`asset_type != 'cash'`,
          sql`symbol NOT IN ('CASH', 'SAVING', 'SAVINGS', 'SALARY', 'SALARY-')`,
          sql`(metadata->>'type') IS DISTINCT FROM 'income'`
        ));

      for (const orphan of orphanRebalanceHoldings) {
        await tx.delete(assetTransactions).where(eq(assetTransactions.holdingId, orphan.id));
        await tx.delete(holdings).where(eq(holdings.id, orphan.id));
      }

      // 3. IF ACTION IS RESET, CLEAR METADATA AND RETURN
      if (action === 'reset') {
        const updatedMeta = { ...profileMeta, rebalancePlan: null };
        await tx.update(users)
          .set({ profileMetadata: updatedMeta })
          .where(eq(users.id, userId));

        return { success: true, message: 'Rebalance plan reset successfully. Cash and Income remain 100% intact.', activePlan: null };
      }

      // 4. IF ACTION IS DEPLOY, APPLY NEW PLAN
      if (!amount || !Array.isArray(trades) || trades.length === 0) {
        throw new Error('Valid amount and trades required to deploy plan.');
      }

      const deployedTrades = [];

      for (const trade of trades) {
        const qty = Number(trade.quantity);
        const price = Number(trade.pricePerUnit);
        if (qty <= 0) continue;

        // Check if holding exists
        const [existing] = await tx.select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), eq(holdings.symbol, trade.symbol)))
          .limit(1);

        let holdingId: string;

        if (existing) {
          const oldQty = Number(existing.quantity);
          const oldCost = Number(existing.avgCost);
          const newQty = oldQty + qty;
          const newAvgCost = newQty > 0 ? (oldQty * oldCost + qty * price) / newQty : price;

          await tx.update(holdings).set({
            quantity: newQty.toString(),
            avgCost: newAvgCost.toString(),
            metadata: {
              ...((existing.metadata as any) || {}),
              source: 'smart_rebalance',
              category: trade.metadata?.category || (trade.assetType === 'stock' ? 'Equity Rebalance' : trade.assetType === 'gold' ? 'Precious Metals Hedge' : 'Debt Reserve'),
              goal: trade.metadata?.goal,
              horizonYears: trade.metadata?.horizonYears,
            },
            updatedAt: new Date(),
          }).where(eq(holdings.id, existing.id));

          holdingId = existing.id;
        } else {
          const [inserted] = await tx.insert(holdings).values({
            userId,
            assetType: trade.assetType as any,
            symbol: trade.symbol,
            name: trade.name,
            quantity: qty.toString(),
            avgCost: price.toString(),
            purchaseDate: new Date(),
            metadata: {
              ...(typeof trade.metadata === 'object' ? trade.metadata : {}),
              source: 'smart_rebalance',
              category: trade.metadata?.category || (trade.assetType === 'stock' ? 'Equity Rebalance' : trade.assetType === 'gold' ? 'Precious Metals Hedge' : 'Debt Reserve'),
            },
          }).returning();

          holdingId = inserted.id;
        }

        // Record transaction
        await tx.insert(assetTransactions).values({
          holdingId,
          type: 'buy',
          quantity: qty.toString(),
          pricePerUnit: price.toString(),
          amount: (qty * price).toString(),
        });

        deployedTrades.push({
          symbol: trade.symbol,
          name: trade.name,
          quantity: qty,
          pricePerUnit: price,
          assetType: trade.assetType,
          holdingId,
        });
      }

      // Note: Cash and Income holdings are strictly preserved and never deducted.
      // Rebalancing reflects the allocation of fresh monthly surplus inflow.

      // 5. Update user profile metadata with active plan
      const newPlan = {
        amount,
        deployedAt: new Date().toISOString(),
        trades: deployedTrades,
      };

      const updatedMeta = { ...profileMeta, rebalancePlan: newPlan };
      await tx.update(users)
        .set({ profileMetadata: updatedMeta })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: 'Plan deployed successfully',
        activePlan: newPlan,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error executing rebalance plan action:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
