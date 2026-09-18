import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, holdings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateAIRecommendation } from '@/lib/ai-engine';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user demographics directly from PostgreSQL
    let userRow: any = null;
    let registeredSalary = 0;
    let registeredLiabilities = 0;
    let registeredEmis = 0;
    let hasHighInterestDebt = false;

    try {
      const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userList.length > 0) {
        userRow = userList[0];
      }

      // Check for user's primary salary holding and liabilities
      const userHoldings = await db.select().from(holdings).where(eq(holdings.userId, userId));
      const salaryH = userHoldings.find(h => h.assetType === 'cash' && (h.name.toLowerCase().includes('salary') || (h.metadata as any)?.isSalary));
      if (salaryH) {
        registeredSalary = parseFloat(salaryH.quantity.toString()) || 0;
      }

      const liabilityHoldings = userHoldings.filter(h => h.assetType === 'liability');
      for (const lh of liabilityHoldings) {
        const qty = parseFloat(lh.quantity?.toString() || '0');
        const avg = parseFloat(lh.avgCost?.toString() || '1');
        const meta = typeof lh.metadata === 'object' && lh.metadata !== null ? lh.metadata : (lh.metadata ? JSON.parse(lh.metadata as string) : {});
        const emi = parseFloat(meta.emi || '0');
        const rate = parseFloat(meta.interestRate || '0');
        registeredLiabilities += (qty * avg);
        registeredEmis += emi;
        if (rate > 11.5) hasHighInterestDebt = true;
      }
    } catch (dbErr) {
      console.warn('DB user query error:', dbErr);
    }

    const calculatedAge = userRow?.dateOfBirth
      ? Math.max(18, Math.floor((Date.now() - new Date(userRow.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
      : 28;

    // 2. Try Spring Boot for saved profile
    let profile: any = null;
    try {
      const res = await fetch(`http://localhost:8080/api/public/ai/profile/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        profile = await res.json();
      }
    } catch (e) {
      // Spring Boot offline
    }

    // 3. If not from Spring Boot, get profileMetadata from Drizzle
    if (!profile && userRow?.profileMetadata) {
      profile = userRow.profileMetadata;
    }

    // 4. Enrich or synthesize default profile with real user registration data
    if (!profile) {
      profile = {
        userDemographics: {
          age: calculatedAge,
          targetRetirementAge: Math.max(calculatedAge + 5, 55),
          maritalStatus: 'single',
          childrenCount: 0,
          dependentParents: false,
        },
        financialCashflow: {
          monthlyIncome: registeredSalary > 0 ? registeredSalary : 100000,
          monthlyExpenses: registeredSalary > 0 ? Math.round(registeredSalary * 0.4) : 40000,
          monthlyEmis: registeredEmis,
          taxBracketPercent: registeredSalary > 125000 ? 30 : registeredSalary > 60000 ? 20 : 10,
        },
        netWorthBreakdown: {
          totalCurrentAssets: 0,
          assetBreakdownPercent: { equity: 0, fdDebt: 0, gold: 0, realEstate: 0 },
          totalLiabilities: registeredLiabilities,
          hasHighInterestDebt: hasHighInterestDebt,
        },
        riskAndInsurance: {
          riskAppetite: userRow?.riskTolerance || 'Medium',
          hasHealthInsurance: true,
          hasLifeInsurance: true,
          hasEmergencyFund: false,
        },
        financialGoals: [],
      };
    } else {
      // Keep real age synced from Date of Birth if user registered with DOB
      if (userRow?.dateOfBirth) {
        profile.userDemographics = {
          ...profile.userDemographics,
          age: calculatedAge,
        };
      }
      if (registeredSalary > 0 && (!profile.financialCashflow?.monthlyIncome || profile.financialCashflow.monthlyIncome === 120000)) {
        profile.financialCashflow = {
          ...profile.financialCashflow,
          monthlyIncome: registeredSalary,
        };
      }
      if (registeredEmis > 0) {
        profile.financialCashflow = {
          ...profile.financialCashflow,
          monthlyEmis: registeredEmis,
        };
      }
      if (registeredLiabilities > 0) {
        profile.netWorthBreakdown = {
          ...profile.netWorthBreakdown,
          totalLiabilities: registeredLiabilities,
          hasHighInterestDebt: hasHighInterestDebt || Boolean(profile.netWorthBreakdown?.hasHighInterestDebt),
        };
      }
    }

    profile.dateOfBirth = userRow?.dateOfBirth || null;
    profile.calculatedAge = calculatedAge;
    profile.registeredSalary = registeredSalary;

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error('Error fetching user AI profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const body = await req.json();

    // 1. Try Spring Boot backend first
    try {
      const targetUrl = userId
        ? `http://localhost:8080/api/public/ai/profile/${userId}`
        : 'http://localhost:8080/api/public/ai/recommendation';

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Spring Boot offline, fallback to Drizzle DB + local AI Engine calculation
    }

    // 2. Fallback: Save to PostgreSQL if logged in
    if (userId) {
      try {
        await db.update(users).set({ profileMetadata: body }).where(eq(users.id, userId));
      } catch (dbErr) {
        console.warn('Could not persist profile directly to DB:', dbErr);
      }
    }

    // 3. Compute recommendation
    const recommendation = calculateAIRecommendation(body);
    return NextResponse.json(recommendation);
  } catch (err: any) {
    console.error('Error saving user AI profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
