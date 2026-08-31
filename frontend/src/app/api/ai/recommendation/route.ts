import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch('http://localhost:8080/api/public/ai/recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Spring Boot backend error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('AI Recommendation Route Proxy Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch AI recommendation' }, { status: 500 });
  }
}
