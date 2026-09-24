'use server';

import { db } from "@/lib/db";
import { users, holdings, assetTransactions, dematAccounts } from "@/lib/db/schema";
import { signIn, signOut } from "@/auth";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set in environment variables');
      return { error: 'Database configuration missing: DATABASE_URL is not configured in Vercel environment variables.' };
    }

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const dobRaw = formData.get('dateOfBirth') as string;
    const countryCurrency = formData.get('countryCurrency') as string;
    
    const profession = formData.get('profession') as string;
    const incomeBracket = formData.get('incomeBracket') as string;
    const riskTolerance = formData.get('riskTolerance') as string;
    const dematBroker = formData.get('dematBroker') as string;

    const monthlySalary = parseFloat((formData.get('monthlySalary') as string) || '0');
    const initialCash = parseFloat((formData.get('initialCash') as string) || '0');

    if (!email || !password || !name || !dobRaw) {
      return { error: 'Email, password, name, and date of birth are required' };
    }
    
    let country = 'IN';
    let currency = 'INR';
    if (countryCurrency === 'US') {
      country = 'US';
      currency = 'USD';
    }

    let dateOfBirth: Date | undefined;
    try {
      dateOfBirth = new Date(dobRaw);
    } catch {
      return { error: 'Invalid date format' };
    }

    const existing = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email}`,
    });

    if (existing) {
      return { error: 'User already exists with this email address' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      dateOfBirth,
      country,
      currency,
      profession: profession || null,
      incomeBracket: incomeBracket || (monthlySalary > 0 ? `₹${Math.round(monthlySalary * 12 / 100000)}L/yr` : null),
      riskTolerance: riskTolerance || null,
    }).returning();

    // 1. Automatically create Monthly Salary holding (income)
    if (monthlySalary > 0) {
      const [salaryHolding] = await db.insert(holdings).values({
        userId: newUser.id,
        assetType: 'cash',
        symbol: 'SALARY',
        name: 'Monthly Salary',
        quantity: monthlySalary.toString(),
        avgCost: '1',
        purchaseDate: new Date(),
        metadata: { type: 'income', isSalary: true, amount: monthlySalary.toString() },
      }).returning();

      await db.insert(assetTransactions).values({
        holdingId: salaryHolding.id,
        type: 'deposit',
        quantity: monthlySalary.toString(),
        pricePerUnit: '1',
        amount: monthlySalary.toString(),
      });
    }

    // 2. Automatically create Liquid Bank Cash holding (locker)
    if (initialCash > 0) {
      const [cashHolding] = await db.insert(holdings).values({
        userId: newUser.id,
        assetType: 'cash',
        symbol: 'CASH',
        name: 'Cash in Bank / Hand',
        quantity: initialCash.toString(),
        avgCost: '1',
        purchaseDate: new Date(),
        metadata: { type: 'locker', amount: initialCash.toString() },
      }).returning();

      await db.insert(assetTransactions).values({
        holdingId: cashHolding.id,
        type: 'deposit',
        quantity: initialCash.toString(),
        pricePerUnit: '1',
        amount: initialCash.toString(),
      });
    }

    // 3. Connect Demat account if selected
    if (dematBroker) {
      await db.insert(dematAccounts).values({
        userId: newUser.id,
        brokerName: dematBroker,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create user';
    console.error('Registration failed:', err);
    return { error: errorMsg };
  }
}


