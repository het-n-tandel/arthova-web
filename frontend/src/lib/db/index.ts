import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://ledger:ledger@127.0.0.1:5433/ledger';

const isNeon = connectionString.includes('neon.tech');

function initDb() {
  if (isNeon) {
    // Strip -pooler for Neon HTTP transport since Neon HTTP proxy handles connection pooling natively
    const cleanUrl = connectionString.replace('-pooler.', '.');
    const client = neon(cleanUrl);
    return drizzleHttp(client, { schema });
  }

  // Fallback for local Docker PostgreSQL (127.0.0.1)
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  return drizzlePg(pool, { schema });
}

export const db = initDb() as ReturnType<typeof drizzleHttp<typeof schema>>;
