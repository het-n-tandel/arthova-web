import { NextResponse } from 'next/server';
import { calculateAIRecommendation } from '@/lib/ai-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Attempt Spring Boot backend first
    try {
      const res = await fetch('http://localhost:8080/api/public/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Spring Boot backend is offline or starting; gracefully fall back to local AI engine
      console.log('Spring Boot backend offline, computing recommendation via local AI Engine fallback');
    }

    // 2. High-performance TypeScript calculation fallback
    const result = calculateAIRecommendation(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI Recommendation Route Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to compute AI recommendation' }, { status: 500 });
  }
}
