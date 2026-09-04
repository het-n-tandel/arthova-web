import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`http://localhost:8080/api/public/ai/profile/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ notFound: true }, { status: 404 });
    }

    const profile = await res.json();
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

    const targetUrl = userId
      ? `http://localhost:8080/api/public/ai/profile/${userId}`
      : 'http://localhost:8080/api/public/ai/recommendation';

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Spring Boot error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error saving user AI profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
