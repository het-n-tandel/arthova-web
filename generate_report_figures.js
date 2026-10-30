// generate_report_figures.js
// Generates publication-grade PNG diagrams for the Arthova Project-2 Report

const fs = require('fs');
const path = require('path');
const sharp = require('./frontend/node_modules/sharp');

const FIGURES_DIR = path.join(__dirname, 'figures');
if (!fs.existsSync(FIGURES_DIR)) {
  fs.mkdirSync(FIGURES_DIR, { recursive: true });
}

// 1. Figure 1: Fragmented vs Unified Architecture
const svgFig1 = `
<svg width="880" height="420" viewBox="0 0 880 420" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="880" height="420" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  
  <!-- Top Box: Fragmented Traditional Silos -->
  <g transform="translate(30, 20)">
    <rect width="820" height="135" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="820" height="30" rx="8" fill="#EF4444" opacity="0.9"/>
    <text x="20" y="20" fill="#FFFFFF" font-size="12" font-weight="700" letter-spacing="0.5">TRADITIONAL FRAGMENTED WEALTH TRACKING (DISCONNECTED SILOS)</text>
    
    <g transform="translate(15, 45)">
      <rect x="0" y="0" width="145" height="70" rx="6" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="12" y="24" font-size="12" font-weight="700" fill="#991B1B">Demat Equities</text>
      <text x="12" y="42" font-size="10" fill="#6B7280">Zerodha / Groww</text>
      <text x="12" y="58" font-size="9" fill="#DC2626">Isolated P&amp;L</text>

      <rect x="160" y="0" width="145" height="70" rx="6" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="172" y="24" font-size="12" font-weight="700" fill="#991B1B">Mutual Funds</text>
      <text x="172" y="42" font-size="10" fill="#6B7280">CAMS / KFintech</text>
      <text x="172" y="58" font-size="9" fill="#DC2626">No Unified XIRR</text>

      <rect x="320" y="0" width="145" height="70" rx="6" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="332" y="24" font-size="12" font-weight="700" fill="#991B1B">Bank Deposits</text>
      <text x="332" y="42" font-size="10" fill="#6B7280">SBI / HDFC Portal</text>
      <text x="332" y="58" font-size="9" fill="#DC2626">Ignored Inflation</text>

      <rect x="480" y="0" width="145" height="70" rx="6" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="492" y="24" font-size="12" font-weight="700" fill="#991B1B">Gold &amp; Silver</text>
      <text x="492" y="42" font-size="10" fill="#6B7280">Physical / SGB</text>
      <text x="492" y="58" font-size="9" fill="#DC2626">Locker Storage</text>

      <rect x="640" y="0" width="145" height="70" rx="6" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="652" y="24" font-size="12" font-weight="700" fill="#991B1B">Real Estate</text>
      <text x="652" y="42" font-size="10" fill="#6B7280">Manual Registry</text>
      <text x="652" y="58" font-size="9" fill="#DC2626">Zero Rebalancing</text>
    </g>
  </g>

  <!-- Transition Arrow -->
  <path d="M 440 165 L 440 195" stroke="#0F172A" stroke-width="3" marker-end="url(#arrow)"/>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F172A"/>
    </marker>
  </defs>

  <!-- Bottom Box: Arthova Unified Platform -->
  <g transform="translate(30, 205)">
    <rect width="820" height="195" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
    <rect width="820" height="32" rx="8" fill="#0F172A"/>
    <text x="20" y="22" fill="#FFFFFF" font-size="13" font-weight="700" letter-spacing="0.5">ARTHOVA UNIFIED INSTITUTIONAL WEALTH PLATFORM</text>

    <!-- Sub-tiers -->
    <g transform="translate(20, 48)">
      <rect x="0" y="0" width="780" height="42" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
      <text x="20" y="26" font-size="12" font-weight="700" fill="#0F172A">UNIFIED DOUBLE-ENTRY MULTI-ASSET LEDGER (7 ASSET CLASSES CONSOLIDATED)</text>

      <g transform="translate(0, 52)">
        <rect x="0" y="0" width="245" height="75" rx="6" fill="#F0FDF4" stroke="#86EFAC"/>
        <text x="15" y="22" font-size="11.5" font-weight="700" fill="#166534">Quant Factor Screener</text>
        <text x="15" y="40" font-size="10" fill="#4B5563">- Piotroski 9-pt F-Score</text>
        <text x="15" y="55" font-size="10" fill="#4B5563">- Altman Z-Score Health</text>
        <text x="15" y="70" font-size="10" fill="#4B5563">- 10-Signal Technical Engine</text>

        <rect x="265" y="0" width="245" height="75" rx="6" fill="#EFF6FF" stroke="#93C5FD"/>
        <text x="280" y="22" font-size="11.5" font-weight="700" fill="#1E40AF">Machine Learning Engine</text>
        <text x="280" y="40" font-size="10" fill="#4B5563">- 100-Epoch Backprop Net</text>
        <text x="280" y="55" font-size="10" fill="#4B5563">- 5-Day &amp; 20-Day Directional</text>
        <text x="280" y="70" font-size="10" fill="#4B5563">- Dynamic Quantile Bands</text>

        <rect x="530" y="0" width="250" height="75" rx="6" fill="#FEFCE8" stroke="#FDE047"/>
        <text x="545" y="22" font-size="11.5" font-weight="700" fill="#854D0E">Tax &amp; Wealth Optimizer</text>
        <text x="545" y="40" font-size="10" fill="#4B5563">- FY25-26 Sec 112A LTCG</text>
        <text x="545" y="55" font-size="10" fill="#4B5563">- 20% STCG Loss Harvester</text>
        <text x="545" y="70" font-size="10" fill="#4B5563">- SIP Compounding Visualizer</text>
      </g>
    </g>
  </g>
</svg>
`;

// 2. Figure 2: Markowitz Efficient Frontier
const svgFig2 = `
<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="800" height="400" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  
  <text x="50" y="40" font-size="16" font-weight="700" fill="#0F172A">Markowitz Modern Portfolio Theory: The Efficient Frontier</text>
  <text x="50" y="60" font-size="11" fill="#64748B">Optimal Risk-Return Boundary and Capital Allocation Line (CAL)</text>

  <!-- Axes -->
  <line x1="100" y1="340" x2="720" y2="340" stroke="#94A3B8" stroke-width="2"/>
  <line x1="100" y1="340" x2="100" y2="80" stroke="#94A3B8" stroke-width="2"/>
  <text x="700" y="365" font-size="12" font-weight="600" fill="#475569">Volatility (Risk) σ</text>
  <text x="35" y="85" font-size="12" font-weight="600" fill="#475569" transform="rotate(-90 35,85)">Expected Return E[R]</text>

  <!-- Grid lines -->
  <line x1="100" y1="280" x2="720" y2="280" stroke="#F1F5F9" stroke-width="1.5"/>
  <line x1="100" y1="220" x2="720" y2="220" stroke="#F1F5F9" stroke-width="1.5"/>
  <line x1="100" y1="160" x2="720" y2="160" stroke="#F1F5F9" stroke-width="1.5"/>

  <!-- Inefficient Random Portfolios (Scatter Cloud) -->
  <g fill="#CBD5E1" opacity="0.6">
    <circle cx="260" cy="270" r="4"/><circle cx="280" cy="250" r="4"/><circle cx="320" cy="290" r="4"/>
    <circle cx="340" cy="230" r="4"/><circle cx="380" cy="260" r="4"/><circle cx="410" cy="210" r="4"/>
    <circle cx="450" cy="240" r="4"/><circle cx="480" cy="190" r="4"/><circle cx="520" cy="220" r="4"/>
    <circle cx="560" cy="250" r="4"/><circle cx="600" cy="200" r="4"/><circle cx="630" cy="230" r="4"/>
  </g>

  <!-- Efficient Frontier Curve -->
  <path d="M 220 280 C 230 200, 320 150, 420 135 C 520 120, 620 110, 700 105" fill="none" stroke="#2563EB" stroke-width="4"/>
  
  <!-- Capital Allocation Line (CAL) -->
  <line x1="100" y1="300" x2="650" y2="85" stroke="#10B981" stroke-width="2.5" stroke-dasharray="6,4"/>
  <text x="520" y="95" font-size="11" font-weight="700" fill="#047857">Capital Allocation Line (CAL)</text>

  <!-- Tangency Portfolio Dot -->
  <circle cx="420" cy="135" r="7" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
  <text x="435" y="132" font-size="12" font-weight="700" fill="#B45309">Tangency Portfolio (Max Sharpe = 1.42)</text>

  <!-- Minimum Variance Portfolio -->
  <circle cx="220" cy="280" r="6" fill="#0F172A"/>
  <text x="140" y="270" font-size="11" font-weight="600" fill="#0F172A">Min Variance Portfolio</text>

  <!-- Risk-Free Rate -->
  <circle cx="100" cy="300" r="5" fill="#10B981"/>
  <text x="110" y="315" font-size="11" font-weight="600" fill="#047857">Risk-Free Rf = 6.5%</text>
</svg>
`;

// 3. Figure 3: Purged Walk-Forward Time-Series Split
const svgFig3 = `
<svg width="840" height="340" viewBox="0 0 840 340" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="840" height="340" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <text x="40" y="35" font-size="16" font-weight="700" fill="#0F172A">Purged Walk-Forward Time-Series Cross-Validation</text>
  <text x="40" y="55" font-size="11" fill="#64748B">Elimination of Lookahead Bias and Serial Correlation Leakage (López de Prado Protocol)</text>

  <!-- Timeline Folds -->
  <!-- Fold 1 -->
  <g transform="translate(40, 80)">
    <text x="0" y="22" font-size="12" font-weight="700" fill="#334155">Fold 1</text>
    <rect x="70" y="5" width="400" height="26" rx="4" fill="#2563EB" opacity="0.9"/>
    <text x="210" y="22" fill="#FFFFFF" font-size="11" font-weight="600">In-Sample Training (600 Days)</text>

    <rect x="475" y="5" width="25" height="26" rx="3" fill="#EF4444" opacity="0.8"/>
    <text x="478" y="22" fill="#FFFFFF" font-size="9" font-weight="700">5D</text>

    <rect x="505" y="5" width="130" height="26" rx="4" fill="#10B981"/>
    <text x="535" y="22" fill="#FFFFFF" font-size="11" font-weight="600">Test (120 Days)</text>
  </g>

  <!-- Fold 2 -->
  <g transform="translate(40, 130)">
    <text x="0" y="22" font-size="12" font-weight="700" fill="#334155">Fold 2</text>
    <rect x="150" y="5" width="400" height="26" rx="4" fill="#2563EB" opacity="0.9"/>
    <text x="290" y="22" fill="#FFFFFF" font-size="11" font-weight="600">In-Sample Training (600 Days)</text>

    <rect x="555" y="5" width="25" height="26" rx="3" fill="#EF4444" opacity="0.8"/>
    <text x="558" y="22" fill="#FFFFFF" font-size="9" font-weight="700">5D</text>

    <rect x="585" y="5" width="130" height="26" rx="4" fill="#10B981"/>
    <text x="615" y="22" fill="#FFFFFF" font-size="11" font-weight="600">Test (120 Days)</text>
  </g>

  <!-- Fold 3 -->
  <g transform="translate(40, 180)">
    <text x="0" y="22" font-size="12" font-weight="700" fill="#334155">Fold 3</text>
    <rect x="230" y="5" width="400" height="26" rx="4" fill="#2563EB" opacity="0.9"/>
    <text x="370" y="22" fill="#FFFFFF" font-size="11" font-weight="600">In-Sample Training (600 Days)</text>

    <rect x="635" y="5" width="25" height="26" rx="3" fill="#EF4444" opacity="0.8"/>
    <text x="638" y="22" fill="#FFFFFF" font-size="9" font-weight="700">5D</text>

    <rect x="665" y="5" width="100" height="26" rx="4" fill="#10B981"/>
    <text x="685" y="22" fill="#FFFFFF" font-size="11" font-weight="600">Test (120D)</text>
  </g>

  <!-- Legend -->
  <g transform="translate(110, 260)">
    <rect x="0" y="0" width="18" height="18" rx="3" fill="#2563EB"/>
    <text x="28" y="14" font-size="12" font-weight="600" fill="#334155">Training Window (Rolling)</text>

    <rect x="240" y="0" width="18" height="18" rx="3" fill="#EF4444"/>
    <text x="268" y="14" font-size="12" font-weight="600" fill="#334155">Purged Embargo (5 Days)</text>

    <rect x="470" y="0" width="18" height="18" rx="3" fill="#10B981"/>
    <text x="498" y="14" font-size="12" font-weight="600" fill="#334155">Out-of-Sample Evaluation</text>
  </g>
</svg>
`;

// 4. Figure 4: End-to-End Pipeline
const svgFig4 = `
<svg width="860" height="380" viewBox="0 0 860 380" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="860" height="380" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <text x="40" y="35" font-size="16" font-weight="700" fill="#0F172A">Four-Stage Multi-Signal Hybrid Execution Pipeline</text>
  <text x="40" y="55" font-size="11" fill="#64748B">Systematic verification sequence from raw financial data to risk-budgeted order execution</text>

  <!-- 4 Columns -->
  <!-- Col 1 -->
  <g transform="translate(30, 85)">
    <rect width="180" height="250" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="180" height="32" rx="8" fill="#1E293B"/>
    <text x="12" y="21" fill="#FFFFFF" font-size="11" font-weight="700">STAGE 1: HEALTH GATE</text>

    <text x="14" y="60" font-size="11" font-weight="700" fill="#0F172A">Balance Sheet Moats</text>
    <text x="14" y="80" font-size="10" fill="#475569">• Piotroski F-Score >= 6</text>
    <text x="14" y="100" font-size="10" fill="#475569">• Altman Z-Score > 1.81</text>
    <text x="14" y="120" font-size="10" fill="#475569">• D/E Ratio &lt; 1.5</text>
    <text x="14" y="140" font-size="10" fill="#475569">• Zero share dilution</text>
    <rect x="14" y="180" width="152" height="40" rx="6" fill="#FEE2E2" stroke="#FCA5A5"/>
    <text x="24" y="204" font-size="10" font-weight="700" fill="#991B1B">Rejects Weak Balance</text>
  </g>

  <!-- Arrow 1 -->
  <path d="M 215 210 L 235 210" stroke="#64748B" stroke-width="2.5" marker-end="url(#arrow)"/>

  <!-- Col 2 -->
  <g transform="translate(240, 85)">
    <rect width="180" height="250" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="180" height="32" rx="8" fill="#2563EB"/>
    <text x="10" y="21" fill="#FFFFFF" font-size="11" font-weight="700">STAGE 2: 10-SIGNAL</text>

    <text x="14" y="60" font-size="11" font-weight="700" fill="#0F172A">Technical Consensus</text>
    <text x="14" y="80" font-size="10" fill="#475569">• Trend: EMA 20/50, ST</text>
    <text x="14" y="100" font-size="10" fill="#475569">• Momentum: RSI, MACD</text>
    <text x="14" y="120" font-size="10" fill="#475569">• Volatility: BB Squeeze</text>
    <text x="14" y="140" font-size="10" fill="#475569">• Volume: OBV, CMF, VWAP</text>
    <rect x="14" y="180" width="152" height="40" rx="6" fill="#EFF6FF" stroke="#BFDBFE"/>
    <text x="26" y="204" font-size="10" font-weight="700" fill="#1E40AF">Threshold: |C| >= 0.60</text>
  </g>

  <!-- Arrow 2 -->
  <path d="M 425 210 L 445 210" stroke="#64748B" stroke-width="2.5" marker-end="url(#arrow)"/>

  <!-- Col 3 -->
  <g transform="translate(450, 85)">
    <rect width="180" height="250" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="180" height="32" rx="8" fill="#7C3AED"/>
    <text x="12" y="21" fill="#FFFFFF" font-size="11" font-weight="700">STAGE 3: NEURAL NET</text>

    <text x="14" y="60" font-size="11" font-weight="700" fill="#0F172A">100-Epoch Backprop</text>
    <text x="14" y="80" font-size="10" fill="#475569">• 24 Input Features</text>
    <text x="14" y="100" font-size="10" fill="#475569">• LeakyReLU + Dropout</text>
    <text x="14" y="120" font-size="10" fill="#475569">• Adam Optimizer η=10⁻³</text>
    <text x="14" y="140" font-size="10" fill="#475569">• 5D &amp; 20D Probabilities</text>
    <rect x="14" y="180" width="152" height="40" rx="6" fill="#F5F3FF" stroke="#DDD6FE"/>
    <text x="28" y="204" font-size="10" font-weight="700" fill="#5B21B6">P(Bullish) >= 0.60</text>
  </g>

  <!-- Arrow 3 -->
  <path d="M 635 210 L 655 210" stroke="#64748B" stroke-width="2.5" marker-end="url(#arrow)"/>

  <!-- Col 4 -->
  <g transform="translate(660, 85)">
    <rect width="170" height="250" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <rect width="170" height="32" rx="8" fill="#059669"/>
    <text x="12" y="21" fill="#FFFFFF" font-size="11" font-weight="700">STAGE 4: RISK GUARD</text>

    <text x="14" y="60" font-size="11" font-weight="700" fill="#0F172A">Position Execution</text>
    <text x="14" y="80" font-size="10" fill="#475569">• Stop: Entry - 1.5 ATR</text>
    <text x="14" y="100" font-size="10" fill="#475569">• Target: Entry + 3 ATR</text>
    <text x="14" y="120" font-size="10" fill="#475569">• 1:2 Asymmetric R:R</text>
    <text x="14" y="140" font-size="10" fill="#475569">• 20% STCG friction</text>
    <rect x="14" y="180" width="142" height="40" rx="6" fill="#ECFDF5" stroke="#A7F3D0"/>
    <text x="24" y="204" font-size="10" font-weight="700" fill="#065F46">Live Order Trigger</text>
  </g>
</svg>
`;

// 5. Figure 5: Training Convergence
const svgFig5 = `
<svg width="800" height="380" viewBox="0 0 800 380" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="800" height="380" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <text x="40" y="35" font-size="16" font-weight="700" fill="#0F172A">100-Epoch Supervised Neural Network Convergence</text>
  <text x="40" y="55" font-size="11" fill="#64748B">Training Loss vs Validation Loss over 100 Epochs (Adam Optimizer)</text>

  <!-- Axes -->
  <line x1="80" y1="320" x2="740" y2="320" stroke="#94A3B8" stroke-width="2"/>
  <line x1="80" y1="320" x2="80" y2="80" stroke="#94A3B8" stroke-width="2"/>
  <text x="700" y="345" font-size="12" font-weight="600" fill="#475569">Epochs</text>
  <text x="35" y="85" font-size="12" font-weight="600" fill="#475569" transform="rotate(-90 35,85)">Cross-Entropy Loss</text>

  <!-- Loss Curves -->
  <!-- Training Loss (Smooth descent to 0.612) -->
  <path d="M 90 100 C 180 200, 350 250, 720 265" fill="none" stroke="#2563EB" stroke-width="3"/>
  
  <!-- Validation Loss (Descent then flattening to 0.684) -->
  <path d="M 90 120 C 180 210, 350 240, 720 245" fill="none" stroke="#DC2626" stroke-width="3" stroke-dasharray="5,4"/>

  <!-- Legend -->
  <g transform="translate(480, 100)">
    <line x1="0" y1="10" x2="30" y2="10" stroke="#2563EB" stroke-width="3"/>
    <text x="40" y="14" font-size="12" font-weight="600" fill="#1E293B">Training Loss (Final: 0.612)</text>

    <line x1="0" y1="35" x2="30" y2="35" stroke="#DC2626" stroke-width="3" stroke-dasharray="5,4"/>
    <text x="40" y="39" font-size="12" font-weight="600" fill="#1E293B">Validation Loss (Final: 0.684)</text>
  </g>

  <!-- Stabilized Marker -->
  <circle cx="520" cy="245" r="5" fill="#DC2626"/>
  <text x="450" y="275" font-size="11" font-weight="600" fill="#64748B">Convergence at Epoch 70</text>
</svg>
`;

// 6. Figure 6: Drawdown Comparison
const svgFig6 = `
<svg width="840" height="400" viewBox="0 0 840 400" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="840" height="400" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <text x="40" y="35" font-size="16" font-weight="700" fill="#0F172A">Historical Portfolio Drawdown: Hybrid Model vs. Passive Benchmark</text>
  <text x="40" y="55" font-size="11" fill="#64748B">Capital Preservation Comparison During March 2020 COVID Crash and 2022 Inflation</text>

  <!-- 0% Baseline -->
  <line x1="80" y1="100" x2="780" y2="100" stroke="#475569" stroke-width="2"/>
  <text x="35" y="105" font-size="11" font-weight="700" fill="#475569">0%</text>

  <line x1="80" y1="170" x2="780" y2="170" stroke="#F1F5F9" stroke-width="1.5"/>
  <text x="30" y="175" font-size="10" fill="#94A3B8">-10%</text>

  <line x1="80" y1="240" x2="780" y2="240" stroke="#F1F5F9" stroke-width="1.5"/>
  <text x="30" y="245" font-size="10" fill="#94A3B8">-20%</text>

  <line x1="80" y1="310" x2="780" y2="310" stroke="#F1F5F9" stroke-width="1.5"/>
  <text x="30" y="315" font-size="10" fill="#94A3B8">-30%</text>

  <line x1="80" y1="370" x2="780" y2="370" stroke="#F1F5F9" stroke-width="1.5"/>
  <text x="30" y="375" font-size="10" fill="#94A3B8">-40%</text>

  <!-- Buy and Hold Nifty 50 Drawdown (Red area down to -38.4%) -->
  <path d="M 80 100 L 150 115 L 220 100 L 290 140 L 330 368 L 380 280 L 450 180 L 520 220 L 600 130 L 780 100" fill="none" stroke="#DC2626" stroke-width="2.5"/>

  <!-- Arthova Hybrid Drawdown (Green area capped at -14.6%) -->
  <path d="M 80 100 L 150 105 L 220 100 L 290 120 L 330 202 L 380 150 L 450 120 L 520 140 L 600 110 L 780 100" fill="none" stroke="#059669" stroke-width="3.5"/>

  <!-- Markers -->
  <!-- Nifty 50 trough -->
  <circle cx="330" cy="368" r="6" fill="#DC2626"/>
  <text x="345" y="372" font-size="11" font-weight="700" fill="#991B1B">Nifty 50 Crash: -38.4%</text>

  <!-- Arthova trough -->
  <circle cx="330" cy="202" r="6" fill="#059669"/>
  <text x="345" y="195" font-size="11" font-weight="700" fill="#065F46">Arthova Capped: -14.6%</text>

  <!-- Legend -->
  <g transform="translate(520, 45)">
    <line x1="0" y1="10" x2="30" y2="10" stroke="#059669" stroke-width="3.5"/>
    <text x="40" y="14" font-size="12" font-weight="700" fill="#065F46">Proposed Multi-Signal Hybrid</text>

    <line x1="0" y1="35" x2="30" y2="35" stroke="#DC2626" stroke-width="2.5"/>
    <text x="40" y="39" font-size="12" font-weight="600" fill="#991B1B">Buy-and-Hold Nifty 50</text>
  </g>
</svg>
`;

// 7. Figure 7: SIP Compounding Curve
const svgFig7 = `
<svg width="840" height="400" viewBox="0 0 840 400" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
  <rect width="840" height="400" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <text x="40" y="35" font-size="16" font-weight="700" fill="#0F172A">SIP Compounding Horizon: Wealth Accumulation vs. Capital Outlay</text>
  <text x="40" y="55" font-size="11" fill="#64748B">Exponential Compounding of ₹10,000/Month Systematic Investment at 14% Annualized Return</text>

  <!-- Axes -->
  <line x1="80" y1="340" x2="780" y2="340" stroke="#94A3B8" stroke-width="2"/>
  <line x1="80" y1="340" x2="80" y2="80" stroke="#94A3B8" stroke-width="2"/>
  <text x="730" y="365" font-size="12" font-weight="600" fill="#475569">Horizon (Years)</text>
  <text x="35" y="85" font-size="12" font-weight="600" fill="#475569" transform="rotate(-90 35,85)">Corpus Value (₹ Lakhs)</text>

  <!-- Linear Invested Line (Grey) -->
  <line x1="80" y1="340" x2="740" y2="240" stroke="#64748B" stroke-width="2.5" stroke-dasharray="6,4"/>
  <circle cx="740" cy="240" r="5" fill="#64748B"/>
  <text x="630" y="265" font-size="11" font-weight="600" fill="#475569">Invested: ₹18.0 L</text>

  <!-- Parabolic Compounding Curve (Gold/Brass #C9A227) -->
  <path d="M 80 340 Q 400 310, 740 95" fill="none" stroke="#D97706" stroke-width="4"/>
  <circle cx="740" cy="95" r="7" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
  <text x="600" y="85" font-size="13" font-weight="700" fill="#B45309">Future Corpus: ₹57.8 L (3.2x Multiplier)</text>

  <!-- Shaded Area between curves -->
  <path d="M 80 340 L 740 240 L 740 95 Q 400 310, 80 340 Z" fill="#FEF3C7" opacity="0.4"/>

  <!-- Legend -->
  <g transform="translate(100, 100)">
    <line x1="0" y1="10" x2="30" y2="10" stroke="#D97706" stroke-width="4"/>
    <text x="40" y="14" font-size="12" font-weight="700" fill="#92400E">Compounded Corpus (NAV × Units)</text>

    <line x1="0" y1="35" x2="30" y2="35" stroke="#64748B" stroke-width="2.5" stroke-dasharray="6,4"/>
    <text x="40" y="39" font-size="12" font-weight="600" fill="#475569">Total Principal Invested (Linear)</text>
  </g>
</svg>
`;

async function buildFigures() {
  const tasks = [
    { name: 'fig1_architecture.png', svg: svgFig1 },
    { name: 'fig2_efficient_frontier.png', svg: svgFig2 },
    { name: 'fig3_purged_walk_forward.png', svg: svgFig3 },
    { name: 'fig4_pipeline.png', svg: svgFig4 },
    { name: 'fig5_loss_convergence.png', svg: svgFig5 },
    { name: 'fig6_drawdown.png', svg: svgFig6 },
    { name: 'fig7_sip_compounding.png', svg: svgFig7 },
  ];

  for (const t of tasks) {
    const outPath = path.join(FIGURES_DIR, t.name);
    await sharp(Buffer.from(t.svg)).png().toFile(outPath);
    console.log(`Generated: figures/${t.name}`);
  }
  console.log('All 7 figures generated successfully!');
}

buildFigures().catch(err => {
  console.error(err);
  process.exit(1);
});
