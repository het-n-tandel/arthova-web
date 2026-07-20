import { pgTable, text, timestamp, uuid, pgEnum, numeric, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dematAccounts = pgTable('demat_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  brokerName: text('broker_name').notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
});

export const assetTypeEnum = pgEnum('asset_type', ['stock', 'mutual_fund', 'gold', 'silver', 'fd', 'property']);
export const transactionTypeEnum = pgEnum('transaction_type', ['buy', 'sell', 'deposit', 'withdraw']);

export const holdings = pgTable('holdings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  assetType: assetTypeEnum('asset_type').notNull(),
  symbol: text('symbol'),
  name: text('name').notNull(),
  quantity: numeric('quantity').notNull().default('0'),
  avgCost: numeric('avg_cost').notNull().default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetTransactions = pgTable('asset_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  holdingId: uuid('holding_id').references(() => holdings.id).notNull(),
  type: transactionTypeEnum('type').notNull(),
  quantity: numeric('quantity').notNull(),
  pricePerUnit: numeric('price_per_unit').notNull(),
  amount: numeric('amount').notNull(),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
});

export const latestPrices = pgTable('latest_prices', {
  symbol: text('symbol').primaryKey(),
  latestPrice: numeric('latest_price').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
