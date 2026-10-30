import re
import os
import subprocess
import make_diagrams

print("=== Starting ARTHOVA Master Report Compilation ===")

# 1. Load SVGs
svg_map = {
    'FIG_SYS_ARCH_1': (
        make_diagrams.get_svg_sys_arch(),
        "Fig 1.1: High-Level Technology Architecture of the Arthova Wealth Platform"
    ),
    'FIG_QVM_PIPE': (
        make_diagrams.get_svg_qvm_pipeline(),
        "Fig 4.1: Multi-Factor QVM Pipeline Architecture & Quant Data Flow"
    ),
    'FIG_DFD_0': (
        make_diagrams.get_svg_dfd_level0(),
        "Fig 4.2: Level 0 Data Flow Diagram (Context-Level DFD)"
    ),
    'FIG_ER_DIAGRAM': (
        make_diagrams.get_svg_er_diagram(),
        "Fig 4.5: Relational Entity Relationship (ER) Diagram of the Arthova Database"
    ),
    'FIG_SYS_ARCH_5': (
        make_diagrams.get_svg_sys_arch(),
        "Fig 5.1: High-Level System Architecture Diagram"
    ),
    'FIG_USE_CASE': (
        make_diagrams.get_svg_use_case(),
        "Fig 5.2: System Use Case Diagram"
    ),
    'FIG_SEQ_AUTH': (
        make_diagrams.get_svg_sequence_auth(),
        "Fig 5.3: Sequence Diagram — User Authentication & Session Token Issuance"
    ),
    'FIG_SEQ_QVM': (
        make_diagrams.get_svg_sequence_qvm(),
        "Fig 5.4: Sequence Diagram — QVM Multi-Factor Equity Scoring Flow"
    ),
    'FIG_SEQ_TAX': (
        make_diagrams.get_svg_sequence_tax(),
        "Fig 5.5: Sequence Diagram — Section 112A Tax-Loss Harvesting Execution Flow"
    ),
    'FIG_SEQ_SSE': (
        make_diagrams.get_svg_sequence_sse(),
        "Fig 5.6: Sequence Diagram — Real-Time Price Streaming (SSE) Flow"
    ),
    'FIG_SEQ_COPILOT': (
        make_diagrams.get_svg_sequence_copilot(),
        "Fig 5.7: Sequence Diagram — Conversational AI Wealth Copilot Query & Fallback Flow"
    ),
    'FIG_ACT_REBAL': (
        make_diagrams.get_svg_activity_rebalance(),
        "Fig 5.8: Activity Diagram — Portfolio Aggregation & Smart Rebalancing Workflow"
    ),
    'FIG_ACT_TAX': (
        make_diagrams.get_svg_activity_tax(),
        "Fig 5.9: Activity Diagram — Year-End Tax Optimization & Loss Harvesting Workflow"
    ),
}

with open('ARTHOVA_PROJECT_REPORT.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Academic metadata updates
text = text.replace("6th semester project report", "7th semester project report (Project-II)")
text = text.replace("subject of **Project-III**", "subject of **Project-II**")
text = text.replace("academic year **2025–2026**", "academic year **2026–2027**")

# Replace diagrams cleanly
def replace_diagram(doc_text, fig_key, caption_prefix):
    svg_content, full_caption = svg_map[fig_key]
    pos = doc_text.find(caption_prefix)
    if pos == -1:
        print(f"Warning: Caption prefix not found: {caption_prefix}")
        return doc_text
    
    line_end = doc_text.find('\n', pos)
    if line_end == -1:
        line_end = len(doc_text)
        
    close_cb = doc_text.rfind('```', 0, pos)
    if close_cb == -1:
        print(f"Warning: Closing ``` not found before {caption_prefix}")
        return doc_text
        
    open_cb = doc_text.rfind('```', 0, close_cb)
    if open_cb == -1:
        print(f"Warning: Opening ``` not found before {caption_prefix}")
        return doc_text

    # For Fig 1.1, customize caption inside svg_content
    if fig_key == 'FIG_SYS_ARCH_1':
        svg_content = svg_content.replace(
            "Fig 5.1: High-Level System Architecture Diagram of the Arthova Wealth Platform",
            "Fig 1.1: High-Level Technology Architecture of the Arthova Wealth Platform"
        )

    # svg_content already contains its own <div class="diagram-container"><svg>...</svg><p class="diagram-caption">...</p></div>
    replacement = f"\n{svg_content}\n"
    doc_text = doc_text[:open_cb] + replacement + doc_text[line_end:]
    print(f"Successfully injected SVG diagram for: {caption_prefix}")
    return doc_text

text = replace_diagram(text, 'FIG_SYS_ARCH_1', '*Fig 1.1: High-Level Technology Architecture')
text = replace_diagram(text, 'FIG_DFD_0', '*Fig 4.2: Level 0 Data Flow Diagram')
text = replace_diagram(text, 'FIG_ER_DIAGRAM', '*Fig 4.5: Relational Entity Relationship (ER) Diagram')
text = replace_diagram(text, 'FIG_SYS_ARCH_5', '*Fig 5.1: High-Level System Architecture Diagram')
text = replace_diagram(text, 'FIG_USE_CASE', '*Fig 5.2: System Use Case Diagram')
text = replace_diagram(text, 'FIG_SEQ_AUTH', '*Fig 5.3: Sequence Diagram — User Authentication')
text = replace_diagram(text, 'FIG_SEQ_QVM', '*Fig 5.4: Sequence Diagram — QVM Multi-Factor')
text = replace_diagram(text, 'FIG_SEQ_TAX', '*Fig 5.5: Sequence Diagram — Section 112A Tax-Loss')
text = replace_diagram(text, 'FIG_SEQ_SSE', '*Fig 5.6: Sequence Diagram — Real-Time Price Streaming')
text = replace_diagram(text, 'FIG_SEQ_COPILOT', '*Fig 5.7: Sequence Diagram — Conversational AI Wealth Copilot')
text = replace_diagram(text, 'FIG_ACT_REBAL', '*Fig 5.8: Activity Diagram — Portfolio Aggregation')
text = replace_diagram(text, 'FIG_ACT_TAX', '*Fig 5.9: Activity Diagram — Year-End Tax Optimization')

# Add Fig 4.1 QVM pipeline diagram in Chapter 4 section 4.3 without duplicate caption
if "### 4.3.1 Multi-Factor QVM Quantitative Model" in text:
    qvm_svg_block = f"\n{svg_map['FIG_QVM_PIPE'][0]}\n"
    text = text.replace(
        "### 4.3.1 Multi-Factor QVM Quantitative Model",
        "### 4.3.1 Multi-Factor QVM Quantitative Model\n" + qvm_svg_block
    )
    print("Successfully injected Fig 4.1 into section 4.3.1")

# Add SQL DDL Schema Section right before Section 4.6 (ER Diagram)
sql_ddl_html = """
<div class="sql-ddl-section">
<h3>4.5.1 Relational Data Definition Language (DDL) Schema</h3>
<p>The core transactional and analytical data structures of Arthova are implemented via PostgreSQL DDL with strict integrity constraints, foreign key cascades, and check constraints:</p>
<pre><code>-- PostgreSQL DDL for Arthova Core Wealth Schema
CREATE TYPE asset_type_enum AS ENUM (
  'stock', 'mutual_fund', 'gold', 'silver', 'fd', 
  'property', 'crypto', 'cash', 'bond', 'liability'
);

CREATE TYPE transaction_type_enum AS ENUM (
  'buy', 'sell', 'deposit', 'withdraw'
);

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  date_of_birth TIMESTAMP,
  country VARCHAR(10) DEFAULT 'IN',
  currency VARCHAR(10) DEFAULT 'INR',
  profession VARCHAR(100),
  income_bracket VARCHAR(50),
  risk_tolerance VARCHAR(50),
  profile_metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Demat Accounts Table
CREATE TABLE demat_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_name VARCHAR(100) NOT NULL,
  connected_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Holdings Table
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type asset_type_enum NOT NULL,
  symbol VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
  purchase_date TIMESTAMP, -- Essential for Section 112A tenure audit
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Asset Transactions Table
CREATE TABLE asset_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  type transaction_type_enum NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL,
  price_per_unit NUMERIC(18, 4) NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Latest Prices Real-Time Cache Table
CREATE TABLE latest_prices (
  symbol VARCHAR(50) PRIMARY KEY,
  latest_price NUMERIC(18, 4) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
</code></pre>
</div>
"""

if "## 4.6 Entity Relationship (ER) Diagram" in text:
    text = text.replace("## 4.6 Entity Relationship (ER) Diagram", sql_ddl_html + "\n\n## 4.6 Entity Relationship (ER) Diagram")
    print("Successfully injected SQL DDL schema section")

# =========================================================================
# EXACT MATHEMATICAL EQUATION REPLACEMENTS (SEMANTIC HTML + FRACTIONS)
# =========================================================================

# 1. Replace Altman Z-Score & 5 discriminant ratios exactly
altman_clean_html = """
<div class="math-block">
  <span class="math-main">Z = 1.2 &middot; X<sub>1</sub> + 1.4 &middot; X<sub>2</sub> + 3.3 &middot; X<sub>3</sub> + 0.6 &middot; X<sub>4</sub> + 0.999 &middot; X<sub>5</sub></span>
</div>

<div class="math-block math-block-left">
  <div style="font-weight: 700; color: #0f172a; margin-bottom: 12px; font-size: 11pt;">Where discriminant financial ratios are defined as:</div>
  <div class="math-ratio-row">
    <span class="ratio-bullet">&bull;</span>
    <span class="ratio-var">X<sub>1</sub></span>
    <span class="ratio-eq">=</span>
    <span class="frac"><span class="top">Working Capital</span><span class="bottom">Total Assets</span></span>
    <span class="ratio-desc">(Short-Term Liquidity Measure)</span>
  </div>
  <div class="math-ratio-row">
    <span class="ratio-bullet">&bull;</span>
    <span class="ratio-var">X<sub>2</sub></span>
    <span class="ratio-eq">=</span>
    <span class="frac"><span class="top">Retained Earnings</span><span class="bottom">Total Assets</span></span>
    <span class="ratio-desc">(Cumulative Lifetime Profitability)</span>
  </div>
  <div class="math-ratio-row">
    <span class="ratio-bullet">&bull;</span>
    <span class="ratio-var">X<sub>3</sub></span>
    <span class="ratio-eq">=</span>
    <span class="frac"><span class="top">EBIT</span><span class="bottom">Total Assets</span></span>
    <span class="ratio-desc">(Operating Productivity &amp; Return on Capital)</span>
  </div>
  <div class="math-ratio-row">
    <span class="ratio-bullet">&bull;</span>
    <span class="ratio-var">X<sub>4</sub></span>
    <span class="ratio-eq">=</span>
    <span class="frac"><span class="top">Market Value of Equity</span><span class="bottom">Total Liabilities</span></span>
    <span class="ratio-desc">(Financial Leverage Cushion)</span>
  </div>
  <div class="math-ratio-row">
    <span class="ratio-bullet">&bull;</span>
    <span class="ratio-var">X<sub>5</sub></span>
    <span class="ratio-eq">=</span>
    <span class="frac"><span class="top">Sales / Revenue</span><span class="bottom">Total Assets</span></span>
    <span class="ratio-desc">(Asset Turnover Efficiency)</span>
  </div>
</div>
"""

altman_start = '<div class="math-block">\n$$Z = 1.2'
altman_end = 'Asset Turnover Efficiency)</em>\n</div>'
p1 = text.find(altman_start)
p2 = text.find(altman_end)
if p1 != -1 and p2 != -1:
    text = text[:p1] + altman_clean_html.strip() + text[p2 + len(altman_end):]
    print("Successfully replaced Altman Z-Score block with semantic HTML fractions!")
else:
    print("Warning: Altman Z-score block markers not matched!")

# 2. QVM Composite and sub-score equations
qvm_comp_start = '<div class="math-block">\n$$S_{\\text{QVM}} = 0.40'
qvm_comp_end = 'S_{\\text{Momentum}}$$\n</div>'
p_qvm1 = text.find(qvm_comp_start)
p_qvm2 = text.find(qvm_comp_end)
if p_qvm1 != -1 and p_qvm2 != -1:
    qvm_comp_html = """
<div class="math-block">
  <span class="math-main">S<sub>QVM</sub> = 0.40 &middot; S<sub>Quality</sub> + 0.35 &middot; S<sub>Valuation</sub> + 0.25 &middot; S<sub>Momentum</sub></span>
</div>
"""
    text = text[:p_qvm1] + qvm_comp_html.strip() + text[p_qvm2 + len(qvm_comp_end):]
    print("Successfully replaced QVM Composite equation!")

# Quality sub-score
qvm_q_start = '<div class="math-block">\n$$S_{\\text{Quality}} ='
pq1 = text.find(qvm_q_start)
if pq1 != -1:
    end_q = text.find("</div>", pq1) + 6
    qvm_quality_html = """
<div class="math-block">
  <span class="math-main">
    S<sub>Quality</sub> = [ 0.35 &middot; (<span class="frac"><span class="top">ROCE</span><span class="bottom">30%</span></span>) + 0.35 &middot; (<span class="frac"><span class="top">ROE</span><span class="bottom">25%</span></span>) + 0.30 &middot; (<span class="frac"><span class="top">Piotroski F-Score</span><span class="bottom">9</span></span>) ] &times; 100
  </span>
</div>
"""
    text = text[:pq1] + qvm_quality_html.strip() + text[end_q:]
    print("Successfully replaced QVM Quality equation!")

# Valuation sub-score
qvm_v_start = '<div class="math-block">\n$$S_{\\text{Valuation}} ='
pv1 = text.find(qvm_v_start)
if pv1 != -1:
    end_v = text.find("</div>", pv1) + 6
    qvm_val_html = """
<div class="math-block">
  <span class="math-main">
    S<sub>Valuation</sub> = [ 1 &minus; min(1, <span class="frac"><span class="top">P/E</span><span class="bottom">Sector Median P/E &times; 1.5</span></span>) ] &times; 60 + [ <span class="frac"><span class="top">Dividend Yield</span><span class="bottom">5%</span></span> ] &times; 40
  </span>
</div>
"""
    text = text[:pv1] + qvm_val_html.strip() + text[end_v:]
    print("Successfully replaced QVM Valuation equation!")

# Momentum sub-score
qvm_m_start = '<div class="math-block">\n$$S_{\\text{Momentum}} = 0.50'
qvm_m_end = 'R_{1M,\\text{rel}}$$\n</div>'
pm1 = text.find(qvm_m_start)
pm2 = text.find(qvm_m_end)
if pm1 != -1 and pm2 != -1:
    qvm_mom_html = """
<div class="math-block">
  <span class="math-main">S<sub>Momentum</sub> = 0.50 &middot; R<sub>6M, rel</sub> + 0.30 &middot; R<sub>12M, rel</sub> + 0.20 &middot; R<sub>1M, rel</sub></span>
</div>
"""
    text = text[:pm1] + qvm_mom_html.strip() + text[pm2 + len(qvm_m_end):]
    print("Successfully replaced QVM Momentum equation!")

# 3. Piotroski F-Score equation
piot_start = '<div class="math-block">\n$$F_{\\text{Total}} = \\sum_{i=1}^{9}'
piot_end = 'F_i \\in \\{0, 1\\}$$\n</div>'
ppi1 = text.find(piot_start)
ppi2 = text.find(piot_end)
if ppi1 != -1 and ppi2 != -1:
    piot_html = """
<div class="math-block">
  <span class="math-main">F<sub>Total</sub> = &sum;<sub>i=1</sub><sup>9</sup> F<sub>i</sub> &nbsp;&nbsp;&nbsp;&nbsp; where F<sub>i</sub> &isin; {0, 1}</span>
</div>
"""
    text = text[:ppi1] + piot_html.strip() + text[ppi2 + len(piot_end):]
    print("Successfully replaced Piotroski equation!")

# 4. Tax Harvesting Equations
gain_start = '<div class="math-block">\n$$G(h_i) = \\left[ P_{\\text{CMP}}'
gain_end = 'Q(h_i)$$\n</div>'
pg1 = text.find(gain_start)
pg2 = text.find(gain_end)
if pg1 != -1 and pg2 != -1:
    gain_html = """
<div class="math-block">
  <span class="math-main">G(h<sub>i</sub>) = [ P<sub>CMP</sub>(h<sub>i</sub>) &minus; P<sub>Avg</sub>(h<sub>i</sub>) ] &times; Q(h<sub>i</sub>)</span>
</div>
"""
    text = text[:pg1] + gain_html.strip() + text[pg2 + len(gain_end):]
    print("Successfully replaced Capital Gain equation!")

tax_stcg_start = '<div class="math-block">\n$$\\text{STCG}_{\\text{gross}} = \\sum_{h \\in H_{\\text{STCG, profit}}}'
tax_stcg_end = 'H_{\\text{STCG, loss}}} |G(h)|$$\n</div>'
pt1 = text.find(tax_stcg_start)
pt2 = text.find(tax_stcg_end)
if pt1 != -1 and pt2 != -1:
    tax_stcg_html = """
<div class="math-block">
  <span class="math-main">STCG<sub>gross</sub> = &sum;<sub>h &isin; H<sub>STCG,profit</sub></sub> G(h) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LTCG<sub>gross</sub> = &sum;<sub>h &isin; H<sub>LTCG,profit</sub></sub> G(h)</span><br><br>
  <span class="math-main">Loss<sub>harvestable</sub> = &sum;<sub>h &isin; H<sub>STCG,loss</sub></sub> |G(h)|</span>
</div>
"""
    text = text[:pt1] + tax_stcg_html.strip() + text[pt2 + len(tax_stcg_end):]
    print("Successfully replaced Tax Aggregation equations!")

tax_opt_start = '<div class="math-block">\n$$\\Omega_{\\text{offset}} = \\min\\left('
tax_opt_end = '\\times 20\\%$$\n</div>'
po1 = text.find(tax_opt_start)
po2 = text.find(tax_opt_end)
if po1 != -1 and po2 != -1:
    tax_opt_html = """
<div class="math-block">
  <span class="math-main">&Omega;<sub>offset</sub> = min( STCG<sub>gross</sub>, &nbsp; Loss<sub>harvestable</sub> )</span><br><br>
  <span class="math-main" style="color: #047857; font-weight: 700;">Direct Tax Saved = &Omega;<sub>offset</sub> &times; 20%</span>
</div>
"""
    text = text[:po1] + tax_opt_html.strip() + text[po2 + len(tax_opt_end):]
    print("Successfully replaced Tax Optimization offset equations!")

ltcg_exempt_start = '<div class="math-block">\n$$\\text{LTCG}_{\\text{exemption, remaining}}'
ltcg_exempt_end = 'LTCG}_{\\text{gross}} \\right)$$\n</div>'
ple1 = text.find(ltcg_exempt_start)
ple2 = text.find(ltcg_exempt_end)
if ple1 != -1 and ple2 != -1:
    ltcg_exempt_html = """
<div class="math-block">
  <span class="math-main">LTCG<sub>exemption, remaining</sub> = max( 0, &nbsp; &#8377;1,25,000 &minus; LTCG<sub>gross</sub> )</span>
</div>
"""
    text = text[:ple1] + ltcg_exempt_html.strip() + text[ple2 + len(ltcg_exempt_end):]
    print("Successfully replaced LTCG Exemption equation!")

# 5. Markowitz Drift equation
mark_drift_start = '<div class="math-block">\n$$\\text{Drift}_k = w_k^{\\text{current}}'
mark_drift_end = 'w_k^{\\text{target}}$$\n</div>'
pmd1 = text.find(mark_drift_start)
pmd2 = text.find(mark_drift_end)
if pmd1 != -1 and pmd2 != -1:
    mark_drift_html = """
<div class="math-block">
  <span class="math-main">Drift<sub>k</sub> = w<sub>k</sub><sup>current</sup> &minus; w<sub>k</sub><sup>target</sup></span>
</div>
"""
    text = text[:pmd1] + mark_drift_html.strip() + text[pmd2 + len(mark_drift_end):]
    print("Successfully replaced Markowitz Drift equation!")

# 6. Rebalancing Cash Allocation equation
cash_alloc_start = '<div class="math-block">\n$$\\Delta C_k = \\left('
cash_alloc_end = 'W_{\\text{Net}}$$\n</div>'
pca1 = text.find(cash_alloc_start)
pca2 = text.find(cash_alloc_end)
if pca1 != -1 and pca2 != -1:
    cash_alloc_html = """
<div class="math-block">
  <span class="math-main">&Delta;C<sub>k</sub> = ( w<sub>k</sub><sup>target</sup> &minus; w<sub>k</sub><sup>current</sup> ) &times; W<sub>Net</sub></span>
</div>
"""
    text = text[:pca1] + cash_alloc_html.strip() + text[pca2 + len(cash_alloc_end):]
    print("Successfully replaced Rebalancing Cash Allocation equation!")

# 7. Rebalancing alert condition equation
drift_cond_raw = "$$\\exists k \\text{ such that } |\\text{Drift}_k| \\ge 5.0\\% \\quad \\text{or} \\quad w_{\\text{Equity}}^{\\text{current}} \\ge 75\\%$$"
if drift_cond_raw in text:
    drift_cond_html = """
<div class="math-block">
  <span class="math-main">&exist; k &nbsp; such that &nbsp; |Drift<sub>k</sub>| &ge; 5.0% &nbsp;&nbsp;&nbsp;&nbsp; or &nbsp;&nbsp;&nbsp;&nbsp; w<sub>Equity</sub><sup>current</sup> &ge; 75%</span>
</div>
"""
    text = text.replace(drift_cond_raw, drift_cond_html.strip())
    print("Successfully replaced Drift trigger condition equation!")

# Replace inline LaTeX expressions in text and tables
replacements = [
    (r'$\text{ROA}_t > 0$', '<strong>ROA<sub>t</sub> &gt; 0</strong>'),
    (r'$\text{CFO}_t > 0$', '<strong>CFO<sub>t</sub> &gt; 0</strong>'),
    (r'$\Delta \text{ROA} = \text{ROA}_t - \text{ROA}_{t-1} > 0$', '<strong>&Delta;ROA = ROA<sub>t</sub> &minus; ROA<sub>t-1</sub> &gt; 0</strong>'),
    (r'$\text{CFO}_t > \text{Net Income}_t$', '<strong>CFO<sub>t</sub> &gt; Net Income<sub>t</sub></strong>'),
    (r'$\Delta \text{Leverage} = \text{Debt}_t - \text{Debt}_{t-1} \le 0$', '<strong>&Delta;Leverage = Debt<sub>t</sub> &minus; Debt<sub>t-1</sub> &le; 0</strong>'),
    (r'$\Delta \text{CR} = \text{CR}_t - \text{CR}_{t-1} > 0$', '<strong>&Delta;CR = CR<sub>t</sub> &minus; CR<sub>t-1</sub> &gt; 0</strong>'),
    (r'$\text{Shares Issued}_t \le \text{Shares Issued}_{t-1}$', '<strong>Shares Issued<sub>t</sub> &le; Shares Issued<sub>t-1</sub></strong>'),
    (r'$\Delta \text{GM} = \text{GM}_t - \text{GM}_{t-1} > 0$', '<strong>&Delta;GM = GM<sub>t</sub> &minus; GM<sub>t-1</sub> &gt; 0</strong>'),
    (r'$\Delta \text{ATO} = \text{ATO}_t - \text{ATO}_{t-1} > 0$', '<strong>&Delta;ATO = ATO<sub>t</sub> &minus; ATO<sub>t-1</sub> &gt; 0</strong>'),
    (r'$\tau < 365\text{ days}$', '<strong>&tau; &lt; 365 days</strong>'),
    (r'$\tau \ge 365\text{ days}$', '<strong>&tau; &ge; 365 days</strong>'),
    (r'$Z > 2.99$', '<strong>Z &gt; 2.99</strong>'),
    (r'$1.81 \le Z \le 2.99$', '<strong>1.81 &le; Z &le; 2.99</strong>'),
    (r'$Z < 1.81$', '<strong>Z &lt; 1.81</strong>'),
    (r'($S_{\text{QVM}}$)', '(<strong>S<sub>QVM</sub></strong>)'),
    (r'($F_i \in \{0, 1\}$)', '(<strong>F<sub>i</sub> &isin; {0, 1}</strong>)'),
    (r'($F_i = 1$)', '(<strong>F<sub>i</sub> = 1</strong>)'),
    (r'($\text{EBIT} / \text{Capital Employed}$)', '(EBIT / Capital Employed)'),
    (r'(\text{EBIT} / \text{Capital Employed})', '(EBIT / Capital Employed)'),
    (r'$S_{\text{QVM}} \in [0, 100]$', '<strong>S<sub>QVM</sub> &isin; [0, 100]</strong>'),
    (r'($S_{\text{Quality}}$)', '(<strong>S<sub>Quality</sub></strong>)'),
    (r'($S_{\text{Valuation}}$)', '(<strong>S<sub>Valuation</sub></strong>)'),
    (r'($S_{\text{Momentum}}$)', '(<strong>S<sub>Momentum</sub></strong>)'),
    (r'$H_{\text{STCG, profit}} = \{h_i \mid \tau_i < 365 \land G(h_i) > 0\}$', '<strong>H<sub>STCG,profit</sub> = { h<sub>i</sub> | &tau;<sub>i</sub> &lt; 365 and G(h<sub>i</sub>) &gt; 0 }</strong>'),
    (r'$H_{\text{STCG, loss}} = \{h_i \mid \tau_i < 365 \land G(h_i) < 0\}$', '<strong>H<sub>STCG,loss</sub> = { h<sub>i</sub> | &tau;<sub>i</sub> &lt; 365 and G(h<sub>i</sub>) &lt; 0 }</strong>'),
    (r'$H_{\text{LTCG, profit}} = \{h_i \mid \tau_i \ge 365 \land G(h_i) > 0\}$', '<strong>H<sub>LTCG,profit</sub> = { h<sub>i</sub> | &tau;<sub>i</sub> &ge; 365 and G(h<sub>i</sub>) &gt; 0 }</strong>'),
    (r'$H_{\text{LTCG, loss}} = \{h_i \mid \tau_i \ge 365 \land G(h_i) < 0\}$', '<strong>H<sub>LTCG,loss</sub> = { h<sub>i</sub> | &tau;<sub>i</sub> &ge; 365 and G(h<sub>i</sub>) &lt; 0 }</strong>'),
    (r'$\Omega_{\text{offset}}$', '<strong>&Omega;<sub>offset</sub></strong>'),
    (r'$k \in \{\text{Equity}, \text{Debt}, \text{Gold}, \text{Cash}\}$', '<strong>k &isin; {Equity, Debt, Gold, Cash}</strong>'),
    (r'$w_k^{\text{current}}$', '<strong>w<sub>k</sub><sup>current</sup></strong>'),
    (r'$w_k^{\text{target}}$', '<strong>w<sub>k</sub><sup>target</sup></strong>'),
    (r'($\min(\text{STCG}, \text{Loss}) \times 20\%$)', '(min(STCG, Loss) &times; 20%)'),
    (r'$S_{\text{QVM}} \ge 80$', '<strong>S<sub>QVM</sub> &ge; 80</strong>'),
    (r'$< 768\text{px}$', '&lt; 768px'),
    (r'$H_{\text{STCG, profit}}$', '<strong>H<sub>STCG,profit</sub></strong>'),
    (r'$H_{\text{STCG, loss}}$', '<strong>H<sub>STCG,loss</sub></strong>'),
    (r'$H_{\text{LTCG, profit}}$', '<strong>H<sub>LTCG,profit</sub></strong>'),
    (r'$H_{\text{LTCG, loss}}$', '<strong>H<sub>LTCG,loss</sub></strong>'),
]

for src, dst in replacements:
    text = text.replace(src, dst)

print("Inline mathematical expressions replaced.")

# Ensure every chapter and major section begins on a fresh page
chapter_headings = [
    '## CANDIDATE’S DECLARATION',
    '## DHARMSINH DESAI UNIVERSITY',
    '## ACKNOWLEDGEMENT',
    '## ABSTRACT',
    '## TABLE OF CONTENTS',
    '## LIST OF FIGURES',
    '## LIST OF TABLES',
    '# CHAPTER 1: INTRODUCTION',
    '# CHAPTER 2: PROJECT MANAGEMENT',
    '# CHAPTER 3: SYSTEM REQUIREMENTS STUDY',
    '# CHAPTER 4: SYSTEM ANALYSIS',
    '# CHAPTER 5: SYSTEM DESIGN',
    '# CHAPTER 6: IMPLEMENTATION PLANNING & ENGINEERING',
    '# CHAPTER 7: TESTING & QUALITY ASSURANCE',
    '# CHAPTER 8: USER MANUAL & VISUAL WALKTHROUGH',
    '# CHAPTER 9: LIMITATIONS & FUTURE ENHANCEMENTS',
    '# CHAPTER 10: CONCLUSION & DISCUSSION',
    '# REFERENCES',
    '# GLOSSARY OF TERMS'
]

pb_marker = '<div style="page-break-after: always;"></div>'

for h in chapter_headings:
    pos = text.find(h)
    if pos == -1:
        continue
    prefix = text[max(0, pos-200):pos]
    if pb_marker not in prefix:
        dash_pos = text.rfind('---', 0, pos)
        if dash_pos != -1 and dash_pos > pos - 100:
            insert_pos = dash_pos
        else:
            insert_pos = pos
        text = text[:insert_pos] + pb_marker + '\n\n' + text[insert_pos:]
        print(f"Added page-break before: {h}")

# =========================================================================
# CSS DESIGN FOR MASTER ACADEMIC REPORT
# =========================================================================

css = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');

@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
        content: counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8.5pt;
        color: #64748b;
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.6;
    color: #1e293b;
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
}

.screen-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

@media print {
    body {
        background-color: #ffffff;
        font-size: 11pt;
        line-height: 1.55;
    }
    .screen-wrapper {
        padding: 0;
        max-width: 100%;
        box-shadow: none;
    }
    .page-break {
        page-break-after: always;
        break-after: page;
    }
    .no-print {
        display: none !important;
    }
    .chapter-heading, h1.chapter-heading {
        page-break-before: always !important;
        break-before: page !important;
    }
}

.page-break {
    page-break-after: always;
    break-after: page;
    border-bottom: 1px dashed #cbd5e1;
    margin: 40px 0;
}

@media print {
    .page-break {
        border: none;
        margin: 0;
    }
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    font-weight: 700;
    line-height: 1.25;
}

h1 {
    font-size: 19pt;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 8px;
    margin-top: 28px;
    margin-bottom: 16px;
}

.chapter-heading, h1.chapter-heading {
    page-break-before: always !important;
    break-before: page !important;
    font-size: 20pt;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 8px;
    margin-top: 10px !important;
    margin-bottom: 18px;
}

h2 {
    font-size: 14pt;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 6px;
    margin-top: 22px;
    margin-bottom: 12px;
}

h3 {
    font-size: 12pt;
    margin-top: 18px;
    margin-bottom: 8px;
    color: #1e3a8a;
}

h4 {
    font-size: 11pt;
    font-weight: 600;
    margin-top: 14px;
    margin-bottom: 6px;
}

p {
    margin: 0 0 12px 0;
    text-align: justify;
}

ul, ol {
    margin: 0 0 14px 24px;
    padding: 0;
}

li {
    margin-bottom: 6px;
    text-align: justify;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 20px 0;
    font-size: 9.5pt;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

th, td {
    border: 1px solid #cbd5e1;
    padding: 7px 9px;
    text-align: left;
    vertical-align: top;
}

th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

tr:nth-child(even) td {
    background-color: #f8fafc;
}

code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 9pt;
    background: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    color: #0f172a;
    border: 1px solid #e2e8f0;
}

pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    margin: 14px 0;
}

pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
}

/* Math Styles */
.math-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #1e3a8a;
    padding: 14px 20px;
    margin: 16px 0;
    border-radius: 6px;
    font-family: 'Plus Jakarta Sans', Georgia, serif;
    font-size: 11pt;
    text-align: center;
    color: #0f172a;
}

.math-block-left {
    text-align: left;
    padding: 16px 22px;
}

.math-main {
    font-size: 11.5pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #0f172a;
}

.math-ratio-row {
    display: flex;
    align-items: center;
    margin: 9px 0;
    font-size: 10.5pt;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

.ratio-bullet {
    font-size: 14pt;
    color: #1e3a8a;
    margin-right: 8px;
}

.ratio-var {
    font-weight: 700;
    font-size: 11pt;
    color: #0f172a;
    min-width: 26px;
}

.ratio-eq {
    margin: 0 10px;
    font-weight: 700;
    color: #475569;
}

.frac {
    display: inline-flex;
    flex-direction: column;
    vertical-align: middle;
    text-align: center;
    padding: 0 8px;
    font-size: 9.5pt;
    margin: 0 4px;
}

.frac .top {
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 2px;
    font-weight: 700;
    color: #0f172a;
}

.frac .bottom {
    padding-top: 2px;
    font-weight: 700;
    color: #0f172a;
}

.ratio-desc {
    margin-left: 14px;
    color: #475569;
    font-style: italic;
    font-size: 10pt;
}

.diagram-container {
    margin: 22px 0;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.diagram-caption {
    text-align: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9.5pt;
    font-weight: 600;
    color: #475569;
    margin-top: 10px;
    margin-bottom: 4px;
}

.print-btn-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #0f172a;
    color: white;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    font-family: 'Plus Jakarta Sans', sans-serif;
}
.print-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}
.print-btn:hover {
    background: #1d4ed8;
}
"""

def parse_markdown_to_html(md_text):
    pages = md_text.split('<div style="page-break-after: always;"></div>')
    page_htmls = []
    
    for page_idx, page_content in enumerate(pages):
        lines = page_content.strip().split('\n')
        out = []
        in_table = False
        table_rows = []
        in_pre = False
        pre_content = []
        in_custom_div = False
        custom_div_content = []
        
        for line in lines:
            if any(marker in line for marker in ['<div class="diagram-container">', '<div class="math-block', '<div class="sql-ddl-section">']):
                in_custom_div = True
                custom_div_content.append(line)
                continue
                
            if in_custom_div:
                custom_div_content.append(line)
                if line.strip() == '</div>':
                    out.append('\n'.join(custom_div_content))
                    in_custom_div = False
                    custom_div_content = []
                continue

            if line.startswith('```'):
                if in_pre:
                    out.append('<pre><code>' + '\n'.join(pre_content) + '</code></pre>')
                    in_pre = False
                    pre_content = []
                else:
                    in_pre = True
                    pre_content = []
                continue

            if in_pre:
                clean_l = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                pre_content.append(clean_l)
                continue

            # Markdown Tables
            if '|' in line and not line.strip().startswith('<!--'):
                parts = [p.strip() for p in line.split('|')[1:-1]]
                if all(set(p) <= set(':- ') for p in parts if p):
                    continue
                if not in_table:
                    in_table = True
                    table_rows = [parts]
                else:
                    table_rows.append(parts)
                continue
            else:
                if in_table:
                    tbl_html = ['<table>']
                    if table_rows:
                        tbl_html.append('<thead><tr>')
                        for th in table_rows[0]:
                            tbl_html.append(f'<th>{th}</th>')
                        tbl_html.append('</tr></thead><tbody>')
                        for row in table_rows[1:]:
                            tbl_html.append('<tr>')
                            for td in row:
                                tbl_html.append(f'<td>{td}</td>')
                            tbl_html.append('</tr>')
                        tbl_html.append('</tbody>')
                    tbl_html.append('</table>')
                    out.append(''.join(tbl_html))
                    in_table = False
                    table_rows = []

            # Markdown Headers
            if line.startswith('# CHAPTER') or line.startswith('# REFERENCES') or line.startswith('# GLOSSARY'):
                out.append(f'<h1 class="chapter-heading">{line[2:].strip()}</h1>')
            elif line.startswith('# '):
                out.append(f'<h1>{line[2:].strip()}</h1>')
            elif line.startswith('## '):
                out.append(f'<h2>{line[3:].strip()}</h2>')
            elif line.startswith('### '):
                out.append(f'<h3>{line[4:].strip()}</h3>')
            elif line.startswith('#### '):
                out.append(f'<h4>{line[5:].strip()}</h4>')
            elif line.strip().startswith('- ') or line.strip().startswith('* '):
                content = line.strip()[2:]
                out.append(f'<ul><li>{content}</li></ul>')
            elif re.match(r'^\d+\.\s', line.strip()):
                content = re.sub(r'^\d+\.\s', '', line.strip())
                out.append(f'<ol><li>{content}</li></ol>')
            elif line.strip() == '---':
                out.append('<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 18px 0;">')
            elif line.strip() == '':
                continue
            else:
                out.append(f'<p>{line.strip()}</p>')

        if in_table:
            tbl_html = ['<table>']
            if table_rows:
                tbl_html.append('<thead><tr>')
                for th in table_rows[0]:
                    tbl_html.append(f'<th>{th}</th>')
                tbl_html.append('</tr></thead><tbody>')
                for row in table_rows[1:]:
                    tbl_html.append('<tr>')
                    for td in row:
                        tbl_html.append(f'<td>{td}</td>')
                    tbl_html.append('</tr>')
                tbl_html.append('</tbody>')
            tbl_html.append('</table>')
            out.append(''.join(tbl_html))

        page_str = '\n'.join(out)
        page_str = page_str.replace('</ul>\n<ul>', '')
        page_str = page_str.replace('</ol>\n<ol>', '')

        page_str = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', page_str)
        page_str = re.sub(r'\*(.*?)\*', r'<em>\1</em>', page_str)
        page_str = re.sub(r'`(.*?)`', r'<code>\1</code>', page_str)
        
        page_htmls.append(f'<div class="report-page page-{page_idx+1}">\n{page_str}\n</div>')
        
    return '\n<div class="page-break"></div>\n'.join(page_htmls)

body_html = parse_markdown_to_html(text)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARTHOVA - B.Tech Project Report (DDU)</title>
    <style>{css}</style>
</head>
<body>
    <div class="print-btn-bar no-print">
        <div>
            <strong>ARTHOVA B.Tech Project Report</strong> &mdash; Dharmsinh Desai University (2026&ndash;2027)
        </div>
        <div>
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>
    </div>
    <div class="screen-wrapper">
{body_html}
    </div>
</body>
</html>
"""

with open('ARTHOVA_PROJECT_REPORT.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("ARTHOVA_PROJECT_REPORT.html created successfully!")
print(f"Total HTML file size: {len(full_html)} characters.")
