import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL || 'postgresql://ledger:ledger@127.0.0.1:5433/ledger';

const isRemote =
  !connectionString.includes('127.0.0.1') &&
  !connectionString.includes('localhost');

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 25000,
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
