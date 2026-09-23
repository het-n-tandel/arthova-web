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
        signal: AbortSignal.timeout(800), // 800ms — skip quickly if backend is offline
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.marketCapAllocation) {
          const localCalc = calculateAIRecommendation(body);
          data.marketCapAllocation = localCalc.marketCapAllocation;
          if (localCalc.marketCapAllocation?.concentrationAlerts?.length) {
            data.rebalanceActions = [
              ...(data.rebalanceActions || []),
              ...localCalc.marketCapAllocation.concentrationAlerts.map(
                (a: any) => `[${a.type}] ${a.title}: ${a.description}`
              ),
            ];
          }
        }
        // Sanitize trajectory to guarantee non-negative values
        if (Array.isArray(data.netWorthTrajectory)) {
          data.netWorthTrajectory = data.netWorthTrajectory.map((pt: any) => ({
            ...pt,
            expectedNetWorth: Math.max(0, Math.round(pt.expectedNetWorth || 0)),
            bullNetWorth: Math.max(0, Math.round(pt.bullNetWorth || 0)),
            bearNetWorth: Math.max(0, Math.round(pt.bearNetWorth || 0)),
          }));
        }
        if (data.projectedRetirementNetWorth !== undefined) {
          data.projectedRetirementNetWorth = Math.max(0, Math.round(data.projectedRetirementNetWorth || 0));
        }
        return NextResponse.json(data);
      }
    } catch (e) {
      // Spring Boot backend is offline or starting; gracefully fall back to local AI engine
      console.log('Spring Boot backend offline, computing recommendation via local AI Engine fallback');
    }

    // 2. High-performance TypeScript calculation fallback
    const result = calculateAIRecommendation(body);
    if (Array.isArray(result.netWorthTrajectory)) {
      result.netWorthTrajectory = result.netWorthTrajectory.map((pt: any) => ({
        ...pt,
        expectedNetWorth: Math.max(0, Math.round(pt.expectedNetWorth || 0)),
        bullNetWorth: Math.max(0, Math.round(pt.bullNetWorth || 0)),
        bearNetWorth: Math.max(0, Math.round(pt.bearNetWorth || 0)),
      }));
    }
    if (result.projectedRetirementNetWorth !== undefined) {
      result.projectedRetirementNetWorth = Math.max(0, Math.round(result.projectedRetirementNetWorth || 0));
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI Recommendation Route Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to compute AI recommendation' }, { status: 500 });
  }
}
