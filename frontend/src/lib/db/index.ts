import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

const connectionString =
  process.env.DATABASE_URL || 'postgresql://ledger:ledger@127.0.0.1:5433/ledger';

const isRemote =
  !connectionString.includes('127.0.0.1') &&
  !connectionString.includes('localhost');

// Official Drizzle + Supabase driver for Serverless / Vercel
// prepare: false is strictly required for Supabase transaction pooler (port 6543)
export const client =
  globalForDb.client ??
  postgres(connectionString, {
    prepare: false,
    ssl: isRemote ? 'require' : false,
    connect_timeout: 30,
    idle_timeout: 20,
    max: 1,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle(client, { schema });
