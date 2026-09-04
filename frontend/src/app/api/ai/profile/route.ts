import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateAIRecommendation } from '@/lib/ai-engine';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Try Spring Boot first
    try {
      const res = await fetch(`http://localhost:8080/api/public/ai/profile/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const profile = await res.json();
        return NextResponse.json(profile);
      }
    } catch (e) {
      // Spring Boot offline, fallback to database direct query
    }

    // 2. Direct PostgreSQL fallback via Drizzle
    try {
      const userList = await db.select({ profileMetadata: users.profileMetadata }).from(users).where(eq(users.id, userId)).limit(1);
      if (userList.length > 0 && userList[0].profileMetadata) {
        return NextResponse.json(userList[0].profileMetadata);
      }
    } catch (dbErr) {
      console.warn('DB profile query fallback error:', dbErr);
    }

    return NextResponse.json({ notFound: true }, { status: 404 });
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
