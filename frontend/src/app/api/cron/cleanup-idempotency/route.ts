import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getInternalApiSecret } from '@/lib/config';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const internalSecret = req.headers.get('x-internal-secret') || '';

  const cronSecret = process.env.CRON_SECRET;
  let expectedSecret = '';
  try {
    expectedSecret = getInternalApiSecret();
  } catch {
    // Ignore if not configured
  }

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (expectedSecret && internalSecret === expectedSecret) ||
    (expectedSecret && authHeader === `Bearer ${expectedSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.execute(sql`
      DELETE FROM idempotency_records 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);

    return NextResponse.json({
      success: true,
      message: 'Idempotency records older than 30 days cleaned up successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CleanupCron] Error cleaning idempotency records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
