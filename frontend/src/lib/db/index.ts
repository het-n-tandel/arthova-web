import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ledger:ledger@localhost:5433/ledger',
});

export const db = drizzle(pool, { schema });
