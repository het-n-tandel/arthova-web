'use server';

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn, signOut } from "@/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const dobRaw = formData.get('dateOfBirth') as string;
  const countryCurrency = formData.get('countryCurrency') as string;
  
  const profession = formData.get('profession') as string;
  const incomeBracket = formData.get('incomeBracket') as string;
  const riskTolerance = formData.get('riskTolerance') as string;

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
  } catch (e) {
    return { error: 'Invalid date format' };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return { error: 'User already exists' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      email,
      passwordHash,
      name,
      dateOfBirth,
      country,
      currency,
      profession: profession || null,
      incomeBracket: incomeBracket || null,
      riskTolerance: riskTolerance || null,
    });
    return { success: true };
  } catch (err) {
    return { error: 'Failed to create user' };
  }
}


