import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
  const userId = session.user.id;

  const result = await db.execute(sql`
    SELECT SUM(h.quantity * COALESCE(p.latest_price, h.avg_cost)) AS net_worth
    FROM holdings h
    LEFT JOIN latest_prices p ON p.symbol = h.symbol
    WHERE h.user_id = ${userId} AND h.quantity > 0;
  `);

  const netWorth = result.rows[0]?.net_worth || 0;

  return NextResponse.json({ netWorth: Number(netWorth) });
}
