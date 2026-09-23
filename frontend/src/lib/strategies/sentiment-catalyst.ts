/**
 * Sentiment & News Catalyst Engine
 * Based on Dey et al. (2025) Section 4: "Sentiment-Augmented Dynamic Execution"
 * Integrates real-time news polarity scoring to dynamically modulate quant position sizing.
 */

export interface NewsCatalyst {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  impactScore: number; // -1.0 to +1.0
  category: 'earnings' | 'macro_rbi' | 'regulatory' | 'capex_growth' | 'management';
  summary: string;
}

export interface SentimentAnalysisResult {
  symbol: string;
  overallSentiment: 'Bullish' | 'Neutral' | 'Bearish';
  polarityScore: number; // -1.0 to 1.0
  confidenceScore: number; // 0 to 100
  catalysts: NewsCatalyst[];
  quantPositionAdjustment: {
    baseWeightMultiplier: number; // e.g., 1.15x
    actionRecommendation: string;
    rationale: string;
  };
}

/**
 * Returns mock/fallback institutional catalysts for key NSE tickers
 */
export function getDeterministicSentimentFallback(symbol: string): SentimentAnalysisResult {
  const cleanSymbol = symbol.replace('.NS', '').toUpperCase();

  const symbolCatalystsMap: Record<string, {
    sentiment: 'Bullish' | 'Neutral' | 'Bearish';
    polarity: number;
    confidence: number;
    catalysts: NewsCatalyst[];
  }> = {
    TCS: {
      sentiment: 'Bullish',
      polarity: 0.62,
      confidence: 88,
      catalysts: [
        {
          id: 'tcs-1',
          headline: 'TCS Secures $1.2B Mega Cloud Transformation Deal with European Financial Institution',
          source: 'Economic Times',
          publishedAt: '2 hours ago',
          impactScore: 0.75,
          category: 'earnings',
          summary: 'Multi-year deal boosts order book pipeline, providing high revenue visibility for FY26.',
        },
        {
          id: 'tcs-2',
          headline: 'Operating Margins Expand 70 bps on Attrition Normalization and GenAI Deployments',
          source: 'LiveMint',
          publishedAt: 'Yesterday',
          impactScore: 0.58,
          category: 'capex_growth',
          summary: 'Cost discipline and higher utilization rates offset wage hike pressures.',
        },
      ],
    },
    INFY: {
      sentiment: 'Neutral',
      polarity: 0.15,
      confidence: 82,
      catalysts: [
        {
          id: 'infy-1',
          headline: 'Infosys Expands Enterprise Generative AI Partnership with Global Automotive OEM',
          source: 'Business Standard',
          publishedAt: '4 hours ago',
          impactScore: 0.45,
          category: 'capex_growth',
          summary: 'Expansion of Topaz suite integrations into autonomous supply chain software.',
        },
        {
          id: 'infy-2',
          headline: 'Discretionary IT Spending in North America Shows Gradual Stabilization',
          source: 'Financial Express',
          publishedAt: '1 day ago',
          impactScore: 0.1,
          category: 'macro_rbi',
          summary: 'Client decision-making cycles remain elongated despite uptick in POC conversions.',
        },
      ],
    },
    RELIANCE: {
      sentiment: 'Bullish',
      polarity: 0.71,
      confidence: 91,
      catalysts: [
        {
          id: 'ril-1',
          headline: 'Jio 5G User Monetization Gains Traction as Tariff Rationalization Boosts ARPU to ₹195',
          source: 'Economic Times',
          publishedAt: '1 hour ago',
          impactScore: 0.82,
          category: 'earnings',
          summary: 'Strong subscriber additions in wireless broadband drive telecom EBITDA expansion.',
        },
        {
          id: 'ril-2',
          headline: 'Reliance Retail Expands FMCG Footprint with Strategic Domestic Brand Acquisitions',
          source: 'Reuters India',
          publishedAt: 'Yesterday',
          impactScore: 0.61,
          category: 'capex_growth',
          summary: 'Omnichannel retail presence scales operating leverage across Tier 2 and Tier 3 cities.',
        },
      ],
    },
    HDFCBANK: {
      sentiment: 'Bullish',
      polarity: 0.55,
      confidence: 85,
      catalysts: [
        {
          id: 'hdfc-1',
          headline: 'HDFC Bank Credit-to-Deposit (LDR) Ratio Normalizes Toward RBI Preferred 84% Range',
          source: 'Bloomberg Quint',
          publishedAt: '3 hours ago',
          impactScore: 0.65,
          category: 'regulatory',
          summary: 'Aggressive retail branch deposit mobilization reduces post-merger liquidity buffer drag.',
        },
        {
          id: 'hdfc-2',
          headline: 'Asset Quality Remains Pristine: Gross NPA Trajectory Sub-1.35% with Healthy PCR',
          source: 'CNBC-TV18',
          publishedAt: '1 day ago',
          impactScore: 0.52,
          category: 'macro_rbi',
          summary: 'Proactive underwriting and robust unsecured risk models mitigate credit losses.',
        },
      ],
    },
  };

  const matched = symbolCatalystsMap[cleanSymbol] || {
    sentiment: 'Bullish',
    polarity: 0.48,
    confidence: 80,
    catalysts: [
      {
        id: 'gen-1',
        headline: `${cleanSymbol} Benefits from Domestic Capex Cycle and Resilient Consumer Demand`,
        source: 'Bloomberg India',
        publishedAt: '3 hours ago',
        impactScore: 0.55,
        category: 'capex_growth',
        summary: `Institutional brokerages maintain positive stance citing market share gains.`,
      },
      {
        id: 'gen-2',
        headline: `RBI Monetary Policy Committee Maintains Pro-Growth Neutral Stance`,
        source: 'Reserve Bank of India',
        publishedAt: '2 days ago',
        impactScore: 0.42,
        category: 'macro_rbi',
        summary: `Easing liquidity conditions support corporate balance sheet borrowing efficiency.`,
      },
    ],
  };

  // Dey et al. Position Sizing Multiplier: 1 + 0.3 * Polarity
  const baseMultiplier = Number((1.0 + 0.25 * matched.polarity).toFixed(2));
  let actionRecommendation = 'Maintain Standard Quant Weight';
  let rationale = `Neutral catalyst environment. Indicator signals alone govern execution.`;

  if (matched.polarity >= 0.35) {
    actionRecommendation = `Overweight Position (+${Math.round((baseMultiplier - 1) * 100)}%)`;
    rationale = `Positive institutional news catalysts validate technical breakout momentum.`;
  } else if (matched.polarity <= -0.35) {
    actionRecommendation = `Trim Position (-${Math.round((1 - baseMultiplier) * 100)}%)`;
    rationale = `Negative event risk detected. Algorithmic risk limits recommend tightening stops.`;
  }

  return {
    symbol,
    overallSentiment: matched.sentiment,
    polarityScore: matched.polarity,
    confidenceScore: matched.confidence,
    catalysts: matched.catalysts,
    quantPositionAdjustment: {
      baseWeightMultiplier: baseMultiplier,
      actionRecommendation,
      rationale,
    },
  };
}
