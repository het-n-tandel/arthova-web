import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  getDeterministicSentimentFallback,
  SentimentAnalysisResult,
} from '@/lib/strategies/sentiment-catalyst';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'NIFTY50';
  return handleSentiment(symbol);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const symbol = body.symbol || 'NIFTY50';
    return handleSentiment(symbol);
  } catch {
    return handleSentiment('NIFTY50');
  }
}

async function handleSentiment(symbol: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a quantitative financial sentiment analyst specializing in the Indian Stock Market (NSE/BSE) following Dey et al. (2025).
Analyze recent catalysts, earnings, RBI monetary context, and institutional developments for equity ticker: "${symbol}".

Respond strictly with valid JSON conforming to this TypeScript interface:
{
  "symbol": "${symbol}",
  "overallSentiment": "Bullish" | "Neutral" | "Bearish",
  "polarityScore": number between -1.0 and 1.0,
  "confidenceScore": number between 0 and 100,
  "catalysts": [
    {
      "id": "1",
      "headline": string,
      "source": string,
      "publishedAt": string,
      "impactScore": number between -1.0 and 1.0,
      "category": "earnings" | "macro_rbi" | "regulatory" | "capex_growth" | "management",
      "summary": string
    }
  ],
  "quantPositionAdjustment": {
    "baseWeightMultiplier": number (e.g. 1.15 for positive, 0.85 for negative),
    "actionRecommendation": string,
    "rationale": string
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as SentimentAnalysisResult;
        return NextResponse.json(parsed);
      }
    } catch (err) {
      console.warn('Gemini sentiment analysis failed, using resilient fallback:', err);
    }
  }

  // Graceful, deterministic fallback
  const fallback = getDeterministicSentimentFallback(symbol);
  return NextResponse.json(fallback);
}
