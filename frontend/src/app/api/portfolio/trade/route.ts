import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { eq, and, sql } from 'drizzle-orm';
import { tracing } from '@/lib/tracing';
import crypto from 'crypto';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  // Rate Limiting: 10 trades per minute per authenticated user + client IP
  const clientIp = getClientIp(req);
  const rateLimitKey = `trade:${userId}:${clientIp}`;
  const rlResult = checkRateLimit(rateLimitKey, { limit: 10, windowMs: 60 * 1000 });
  if (!rlResult.success) {
    return rateLimitResponse(rlResult);
  }

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
    const txType = (transactionType || 'buy').toString().toLowerCase();
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata || '{}') : (metadata || {});
    const effectivePurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Price must be a valid positive number' }, { status: 400 });
    }
    if (!name && !symbol) {
      return NextResponse.json({ error: 'Asset symbol or name is required' }, { status: 400 });
    }

    // --- IDEMPOTENCY KEY HANDLING ---
    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || body.idempotencyKey;
    const requestHash = crypto.createHash('sha256').update(JSON.stringify({
      userId,
      assetType,
      symbol: symbol || '',
      name: name || '',
      quantity: qty,
      pricePerUnit: price,
      transactionType: txType
    })).digest('hex');

    if (idempotencyKey) {
      const existing = await db.execute(sql`
        SELECT key, user_id, request_hash, response_body
        FROM idempotency_records
        WHERE key = ${idempotencyKey}
        LIMIT 1;
      `);
      const existingRows: any[] = Array.isArray(existing) ? existing : ((existing as any)?.rows || []);
      if (existingRows.length > 0) {
        const record = existingRows[0];
        if (record.request_hash === requestHash) {
          // Idempotent duplicate: return identical recorded response without executing a new trade
          return NextResponse.json(record.response_body, { status: 200 });
        } else {
          // Same idempotency key with conflicting payload
          return NextResponse.json(
            { error: 'Conflict: Idempotency-Key already used with a different request payload' },
            { status: 409 }
          );
        }
      }
    }

    const trace = tracing.startTrace('TRADE_EXECUTION', `${transactionType || 'trade'}_${symbol || name}`, {
      userId,
      assetType,
      qty,
      price,
    });

    let resultHolding: any;

    await db.transaction(async (tx) => {
      // 1. Automatic Cash Sweep ONLY for liquid market trades (stock, mutual_fund, crypto)
      if (assetType === 'stock' || assetType === 'mutual_fund' || assetType === 'crypto') {
        const totalTradeCost = qty * price;
        const [cashHolding] = await tx
          .select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), eq(holdings.symbol, 'CASH')))
          .limit(1);

        if (cashHolding) {
          const currentCash = parseFloat(cashHolding.quantity?.toString() || '0');
          if (txType === 'buy') {
            const newCash = Math.max(0, currentCash - totalTradeCost);
            await tx
              .update(holdings)
              .set({ quantity: newCash.toString(), updatedAt: new Date() })
              .where(eq(holdings.id, cashHolding.id));
          } else if (txType === 'sell') {
            const newCash = currentCash + totalTradeCost;
            await tx
              .update(holdings)
              .set({ quantity: newCash.toString(), updatedAt: new Date() })
              .where(eq(holdings.id, cashHolding.id));
          }
        }
      }

      // 2. Find existing holding:
      // SALARY and CASH are singleton symbols — always update the existing row, never duplicate.
      // Other manual assets (named FD, property, named cash accounts) each get their own distinct row.
      const isSingletonSymbol = symbol === 'SALARY' || symbol === 'CASH';
      const isManual = (assetType === 'cash' || assetType === 'liability' || assetType === 'fd' || assetType === 'property') && !isSingletonSymbol;
      let existingHolding: any = null;

      if ((!isManual || isSingletonSymbol) && symbol) {
        const matches = await tx
          .select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), eq(holdings.symbol, symbol)))
          .limit(1);
        if (matches.length > 0) existingHolding = matches[0];
      }

      if (txType === 'buy' || txType === 'deposit') {
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
      } else if (txType === 'sell' || txType === 'withdraw') {
        if (!existingHolding) {
          // If selling a manual asset by name or symbol
          const matches = await tx
            .select()
            .from(holdings)
            .where(and(eq(holdings.userId, userId), eq(holdings.name, name)))
            .limit(1);
          if (matches.length > 0) existingHolding = matches[0];
        }

        if (!existingHolding) {
          throw new Error('Cannot remove an asset you do not own.');
        }

        const oldQty = parseFloat(existingHolding.quantity?.toString() || '0');
        if (oldQty < qty) {
          throw new Error('Insufficient balance to withdraw.');
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
          type: txType,
          quantity: qty.toString(),
          pricePerUnit: price.toString(),
          amount: (qty * price).toString(),
          executedAt: effectivePurchaseDate,
        });

        // 4. Save idempotency record inside same transaction
        if (idempotencyKey) {
          await tx.execute(sql`
            INSERT INTO idempotency_records (key, user_id, request_hash, response_body)
            VALUES (${idempotencyKey}, ${userId}, ${requestHash}, ${JSON.stringify(resultHolding)}::jsonb)
            ON CONFLICT (key) DO NOTHING;
          `);
        }
      }
    });

    trace?.end('SUCCESS', `Successfully executed ${txType} for ${qty} units of ${symbol || name}`);
    return NextResponse.json(resultHolding || { success: true });
  } catch (err: any) {
    console.error('Trade execution error:', err);
    return NextResponse.json({ error: err.message || 'Transaction failed' }, { status: 400 });
  }
}
