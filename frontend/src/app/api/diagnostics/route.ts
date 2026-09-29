import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { tracing } from '@/lib/tracing';
import { INDIAN_EQUITY_FACTOR_REGISTRY, INDIAN_MUTUAL_FUND_REGISTRY } from '@/lib/factor-scoring';

export async function GET(req: Request) {
  const trace = tracing.startTrace('DB_POOLER', 'system_health_check');
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // 1. Database Pooler Latency Check
  const dbStart = Date.now();
  try {
    trace.info('Pinging Supabase PostgreSQL pooler...');
    const result = await db.execute(sql`SELECT 1 as ping, current_database() as db_name, version() as pg_version;`);
    const dbLatency = Date.now() - dbStart;
    const dbRows = Array.isArray(result) ? result : (result as any)?.rows || [];

    diagnostics.checks.database = {
      status: 'HEALTHY',
      latencyMs: dbLatency,
      databaseName: dbRows[0]?.db_name || 'postgres',
      poolerMode: 'transaction_pooling_prepare_false',
    };
    trace.info(`Database responsive in ${dbLatency}ms`);
  } catch (err: any) {
    trace.error('Database connection failed', err);
    diagnostics.checks.database = {
      status: 'UNHEALTHY',
      error: err.message,
      code: err.code,
    };
  }

  // 2. Table Existence & Row Counts
  try {
    const tableCounts = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM holdings) as holdings_count,
        (SELECT count(*) FROM asset_transactions) as transactions_count;
    `);
    const counts = Array.isArray(tableCounts) ? tableCounts[0] : (tableCounts as any)?.rows?.[0] || {};
    diagnostics.checks.tables = {
      status: 'HEALTHY',
      users: parseInt(counts.users_count || '0'),
      holdings: parseInt(counts.holdings_count || '0'),
      transactions: parseInt(counts.transactions_count || '0'),
    };
  } catch (err: any) {
    diagnostics.checks.tables = {
      status: 'DEGRADED',
      error: err.message,
    };
  }

  // 3. QVM Registry Integrity Check
  const stockCount = Object.keys(INDIAN_EQUITY_FACTOR_REGISTRY).length;
  const mfCount = Object.keys(INDIAN_MUTUAL_FUND_REGISTRY).length;
  diagnostics.checks.quantRegistry = {
    status: stockCount >= 10 && mfCount >= 5 ? 'HEALTHY' : 'DEGRADED',
    registeredEquities: stockCount,
    registeredMutualFunds: mfCount,
    samplePicks: ['TCS.NS', 'RELIANCE.NS', 'TATAMOTORS.NS', 'POLYCAB.NS'],
  };

  // 4. Memory & Performance
  const memUsage = process.memoryUsage();
  diagnostics.checks.runtime = {
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    rssMB: Math.round(memUsage.rss / 1024 / 1024),
  };

  // 5. Recent Traces Summary
  diagnostics.tracing = tracing.getSummaryStats();
  diagnostics.recentTraces = tracing.getRecentTraces({ limit: 15 });

  const isAllHealthy = Object.values(diagnostics.checks).every(
    (c: any) => c.status === 'HEALTHY'
  );

  trace.end(isAllHealthy ? 'SUCCESS' : 'WARNING', `Diagnostics completed with status: ${isAllHealthy ? 'HEALTHY' : 'DEGRADED'}`);

  return NextResponse.json(diagnostics, { status: isAllHealthy ? 200 : 207 });
}
