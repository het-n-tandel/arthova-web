# Helper module to produce clean, professional vector SVGs for all report figures

def get_svg_sys_arch():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 900 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient>
            <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b45309"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
            <linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#065f46"/><stop offset="100%" stop-color="#10b981"/></linearGradient>
            <linearGradient id="gSlate" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#334155"/></linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.12"/></filter>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#475569"/></marker>
        </defs>

        <!-- Background Container -->
        <rect width="900" height="520" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>

        <!-- TIER 1: CLIENT PRESENTATION TIER -->
        <g filter="url(#shadow)">
            <rect x="30" y="30" width="840" height="95" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <rect x="30" y="30" width="840" height="26" rx="8" fill="url(#gBlue)"/>
            <text x="45" y="48" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="1">CLIENT PRESENTATION TIER (BROWSER & MOBILE)</text>
            
            <rect x="45" y="65" width="185" height="48" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
            <text x="55" y="86" font-size="11" font-weight="700" fill="#0f172a">Next.js 16 (App Router)</text>
            <text x="55" y="102" font-size="9.5" fill="#64748b">React 19 Server Components</text>

            <rect x="245" y="65" width="185" height="48" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
            <text x="255" y="86" font-size="11" font-weight="700" fill="#0f172a">Tailwind CSS v4 & Motion</text>
            <text x="255" y="102" font-size="9.5" fill="#64748b">Responsive Dark-Mode Theme</text>

            <rect x="445" y="65" width="185" height="48" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
            <text x="455" y="86" font-size="11" font-weight="700" fill="#0f172a">Financial Visualizations</text>
            <text x="455" y="102" font-size="9.5" fill="#64748b">Recharts + TradingView Charts</text>

            <rect x="645" y="65" width="210" height="48" rx="6" fill="#fef3c7" stroke="#fde68a"/>
            <text x="655" y="86" font-size="11" font-weight="700" fill="#92400e">Wealth Copilot Widget</text>
            <text x="655" y="102" font-size="9.5" fill="#b45309">Persistent Global Drawer (FAB)</text>
        </g>

        <!-- Downward Arrow 1 -->
        <path d="M 450 125 L 450 155" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
        <text x="460" y="145" font-size="9.5" font-weight="600" fill="#64748b">HTTPS / REST / Server-Sent Events (SSE)</text>

        <!-- TIER 2: SERVERLESS API & MICROSERVICES TIER -->
        <g filter="url(#shadow)">
            <rect x="30" y="160" width="840" height="150" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <rect x="30" y="160" width="840" height="26" rx="8" fill="url(#gSlate)"/>
            <text x="45" y="178" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="1">APPLICATION LOGIC & API GATEWAY TIER</text>

            <!-- Box A: Next.js Edge APIs -->
            <rect x="45" y="196" width="375" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="60" y="216" font-size="12" font-weight="700" fill="#0f172a">Vercel Edge Serverless Handlers</text>
            <text x="60" y="234" font-size="10" fill="#475569">• /api/holdings — CRUD & Portfolio Balances</text>
            <text x="60" y="250" font-size="10" fill="#475569">• /api/stream/prices — Live SSE Ticker Telemetry</text>
            <text x="60" y="266" font-size="10" fill="#475569">• /api/portfolio/rebalance-plan — Drift Calculator</text>
            <text x="60" y="282" font-size="10" fill="#475569">• NextAuth v5 — Bcrypt Credentials & JWT Session</text>

            <!-- Box B: Spring Boot Microservices -->
            <rect x="440" y="196" width="415" height="100" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
            <text x="455" y="216" font-size="12" font-weight="700" fill="#0f172a">Spring Boot 4 / Java 21 Microservices (Render)</text>
            <text x="455" y="234" font-size="10" fill="#475569">• Algorithmic Quantitative Simulation Engine</text>
            <text x="455" y="250" font-size="10" fill="#475569">• Statistical Arbitrage & Pairs Cointegration Matrix</text>
            <text x="455" y="266" font-size="10" fill="#475569">• Monte Carlo 30-Year Compounding Trajectories</text>
            <text x="455" y="282" font-size="10" fill="#475569">• High-Throughput Historical Data Ingestion</text>
        </g>

        <!-- Downward Arrows 2 -->
        <path d="M 230 310 L 230 340" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
        <path d="M 650 310 L 650 340" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- TIER 3: AI REASONING & PERSISTENCE TIER -->
        <g filter="url(#shadow)">
            <!-- Left: Gemini & Quant Fallback -->
            <rect x="30" y="345" width="400" height="145" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <rect x="30" y="345" width="400" height="26" rx="8" fill="url(#gGold)"/>
            <text x="45" y="363" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="1">INTELLIGENCE & AI REASONING</text>
            <rect x="45" y="380" width="370" height="98" rx="6" fill="#fffbeb" stroke="#fde68a"/>
            <text x="55" y="400" font-size="11.5" font-weight="700" fill="#92400e">Google Gemini 2.5 Flash LLM</text>
            <text x="55" y="416" font-size="9.5" fill="#78350f">• Real-Time Portfolio Context Prompt Injection</text>
            <text x="55" y="432" font-size="9.5" fill="#78350f">• Institutional Private Wealth Advisory Generation</text>
            <text x="55" y="450" font-size="11.5" font-weight="700" fill="#047857">Deterministic Quant Fallback Engine</text>
            <text x="55" y="466" font-size="9.5" fill="#065f46">• 25% Sector Ceiling Audit + Section 112A Math (Offline)</text>

            <!-- Right: Neon Serverless Postgres -->
            <rect x="450" y="345" width="420" height="145" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <rect x="450" y="345" width="420" height="26" rx="8" fill="url(#gGreen)"/>
            <text x="465" y="363" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="1">PERSISTENCE TIER (NEON POSTGRESQL)</text>
            <rect x="465" y="380" width="390" height="98" rx="6" fill="#f0fdf4" stroke="#bbf7d0"/>
            <text x="475" y="400" font-size="11.5" font-weight="700" fill="#065f46">Serverless PostgreSQL 16 (ap-southeast-1)</text>
            <text x="475" y="416" font-size="9.5" fill="#14532d">• Drizzle ORM Schema Migrations & Type Safety</text>
            <text x="475" y="430" font-size="9.5" fill="#14532d">• Connection Pooler ({ prepare: false }) Resilience</text>
            <text x="475" y="446" font-size="9.5" fill="#14532d">• Tables: users, demat_accounts, holdings, transactions</text>
            <text x="475" y="462" font-size="9.5" fill="#14532d">• latest_prices Cache + Extensible profile_metadata JSONB</text>
        </g>
    </svg>
    <p class="diagram-caption">Fig 5.1: High-Level System Architecture Diagram of the Arthova Wealth Platform</p>
</div>'''

def get_svg_er_diagram():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 900 560" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'JetBrains Mono', monospace">
        <defs>
            <filter id="shadow2" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.1"/></filter>
            <marker id="arrow2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7"/></marker>
        </defs>

        <rect width="900" height="560" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- TABLE: USERS -->
        <g filter="url(#shadow2)">
            <rect x="30" y="30" width="250" height="230" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
            <rect x="30" y="30" width="250" height="28" rx="6" fill="#0f172a"/>
            <text x="40" y="49" fill="#ffffff" font-size="12" font-weight="700">USERS [Table]</text>
            <text x="42" y="75" font-size="10" fill="#b91c1c" font-weight="700">PK id           : UUID</text>
            <text x="42" y="93" font-size="10" fill="#0f172a">   name         : VARCHAR(255)</text>
            <text x="42" y="111" font-size="10" fill="#0284c7" font-weight="700">   email (UQ)   : VARCHAR(255)</text>
            <text x="42" y="129" font-size="10" fill="#0f172a">   password_hash: TEXT</text>
            <text x="42" y="147" font-size="10" fill="#0f172a">   date_of_birth: TIMESTAMP</text>
            <text x="42" y="165" font-size="10" fill="#0f172a">   country      : VARCHAR(10)</text>
            <text x="42" y="183" font-size="10" fill="#0f172a">   risk_tol     : VARCHAR(50)</text>
            <text x="42" y="201" font-size="10" fill="#0f172a">   profile_meta : JSONB</text>
            <text x="42" y="219" font-size="10" fill="#0f172a">   created_at   : TIMESTAMP</text>
        </g>

        <!-- TABLE: DEMAT_ACCOUNTS -->
        <g filter="url(#shadow2)">
            <rect x="30" y="340" width="250" height="140" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
            <rect x="30" y="340" width="250" height="28" rx="6" fill="#0f172a"/>
            <text x="40" y="359" fill="#ffffff" font-size="12" font-weight="700">DEMAT_ACCOUNTS [Table]</text>
            <text x="42" y="385" font-size="10" fill="#b91c1c" font-weight="700">PK id          : UUID</text>
            <text x="42" y="405" font-size="10" fill="#059669" font-weight="700">FK user_id     : UUID</text>
            <text x="42" y="425" font-size="10" fill="#0f172a">   broker_name : VARCHAR(100)</text>
            <text x="42" y="445" font-size="10" fill="#0f172a">   connected_at: TIMESTAMP</text>
        </g>

        <!-- TABLE: HOLDINGS -->
        <g filter="url(#shadow2)">
            <rect x="340" y="30" width="260" height="250" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
            <rect x="340" y="30" width="260" height="28" rx="6" fill="#0f172a"/>
            <text x="350" y="49" fill="#ffffff" font-size="12" font-weight="700">HOLDINGS [Table]</text>
            <text x="352" y="75" font-size="10" fill="#b91c1c" font-weight="700">PK id           : UUID</text>
            <text x="352" y="93" font-size="10" fill="#059669" font-weight="700">FK user_id      : UUID</text>
            <text x="352" y="111" font-size="10" fill="#0f172a">   asset_type   : ENUM(10)</text>
            <text x="352" y="129" font-size="10" fill="#0f172a">   symbol       : VARCHAR(50)</text>
            <text x="352" y="147" font-size="10" fill="#0f172a">   name         : VARCHAR(255)</text>
            <text x="352" y="165" font-size="10" fill="#0f172a">   quantity     : NUMERIC(18,4)</text>
            <text x="352" y="183" font-size="10" fill="#0f172a">   avg_cost     : NUMERIC(18,4)</text>
            <text x="352" y="201" font-size="10" fill="#b45309" font-weight="700">   purchase_date: TIMESTAMP</text>
            <text x="352" y="219" font-size="10" fill="#0f172a">   metadata     : JSONB</text>
            <text x="352" y="237" font-size="10" fill="#0f172a">   updated_at   : TIMESTAMP</text>
        </g>

        <!-- TABLE: ASSET_TRANSACTIONS -->
        <g filter="url(#shadow2)">
            <rect x="640" y="30" width="230" height="200" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
            <rect x="640" y="30" width="230" height="28" rx="6" fill="#0f172a"/>
            <text x="650" y="49" fill="#ffffff" font-size="12" font-weight="700">ASSET_TRANSACTIONS</text>
            <text x="652" y="75" font-size="10" fill="#b91c1c" font-weight="700">PK id           : UUID</text>
            <text x="652" y="95" font-size="10" fill="#059669" font-weight="700">FK holding_id   : UUID</text>
            <text x="652" y="115" font-size="10" fill="#0f172a">   type         : ENUM</text>
            <text x="652" y="135" font-size="10" fill="#0f172a">   quantity     : NUMERIC(18,4)</text>
            <text x="652" y="155" font-size="10" fill="#0f172a">   price_unit   : NUMERIC(18,4)</text>
            <text x="652" y="175" font-size="10" fill="#0f172a">   amount       : NUMERIC(18,4)</text>
            <text x="652" y="195" font-size="10" fill="#0f172a">   executed_at  : TIMESTAMP</text>
        </g>

        <!-- TABLE: LATEST_PRICES -->
        <g filter="url(#shadow2)">
            <rect x="340" y="340" width="260" height="140" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
            <rect x="340" y="340" width="260" height="28" rx="6" fill="#0f172a"/>
            <text x="350" y="359" fill="#ffffff" font-size="12" font-weight="700">LATEST_PRICES [Cache]</text>
            <text x="352" y="385" font-size="10" fill="#b91c1c" font-weight="700">PK symbol       : VARCHAR(50)</text>
            <text x="352" y="405" font-size="10" fill="#0f172a">   latest_price : NUMERIC(18,4)</text>
            <text x="352" y="425" font-size="10" fill="#0f172a">   day_change   : NUMERIC(10,2)</text>
            <text x="352" y="445" font-size="10" fill="#0f172a">   updated_at   : TIMESTAMP</text>
        </g>

        <!-- RELATIONSHIP LINES -->
        <!-- USERS to DEMAT_ACCOUNTS (1 : N) -->
        <path d="M 140 260 L 140 340" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow2)"/>
        <text x="145" y="300" font-size="11" font-weight="700" fill="#0284c7">1 : N</text>

        <!-- USERS to HOLDINGS (1 : N) -->
        <path d="M 280 120 L 340 120" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow2)"/>
        <text x="295" y="112" font-size="11" font-weight="700" fill="#0284c7">1 : N</text>

        <!-- HOLDINGS to ASSET_TRANSACTIONS (1 : N) -->
        <path d="M 600 120 L 640 120" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow2)"/>
        <text x="605" y="112" font-size="11" font-weight="700" fill="#0284c7">1 : N</text>

        <!-- Legend -->
        <rect x="640" y="270" width="230" height="150" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
        <text x="655" y="295" font-size="11" font-weight="700" fill="#0f172a">KEY CONVENTIONS</text>
        <circle cx="660" cy="318" r="4" fill="#b91c1c"/>
        <text x="672" y="322" font-size="10" fill="#475569">PK: Primary Key</text>
        <circle cx="660" cy="338" r="4" fill="#059669"/>
        <text x="672" y="342" font-size="10" fill="#475569">FK: Foreign Key</text>
        <circle cx="660" cy="358" r="4" fill="#b45309"/>
        <text x="672" y="362" font-size="10" fill="#475569">Tax Core Attribute</text>
        <circle cx="660" cy="378" r="4" fill="#0284c7"/>
        <text x="672" y="382" font-size="10" fill="#475569">1:N Referential Integrity</text>
    </svg>
    <p class="diagram-caption">Fig 4.5: Relational Entity Relationship (ER) Diagram of the Arthova Database Schema</p>
</div>'''

def get_svg_use_case():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 900 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <filter id="shadow3" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        </defs>

        <rect width="900" height="520" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>

        <!-- SYSTEM BOUNDARY -->
        <rect x="220" y="25" width="460" height="470" rx="10" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <rect x="220" y="25" width="460" height="30" rx="10" fill="#0f172a"/>
        <text x="350" y="46" font-size="13" font-weight="700" fill="#ffffff" letter-spacing="1">ARTHOVA PLATFORM BOUNDARY</text>

        <!-- ACTOR: INVESTOR -->
        <g id="actor-user" transform="translate(60, 200)">
            <circle cx="35" cy="20" r="14" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
            <line x1="35" y1="34" x2="35" y2="75" stroke="#0284c7" stroke-width="2"/>
            <line x1="15" y1="50" x2="55" y2="50" stroke="#0284c7" stroke-width="2"/>
            <line x1="35" y1="75" x2="15" y2="105" stroke="#0284c7" stroke-width="2"/>
            <line x1="35" y1="75" x2="55" y2="105" stroke="#0284c7" stroke-width="2"/>
            <text x="0" y="125" font-size="12" font-weight="700" fill="#0f172a">Retail / HNI Investor</text>
        </g>

        <!-- ACTOR: EXTERNAL MARKET / AI -->
        <g id="actor-ai" transform="translate(730, 200)">
            <rect x="15" y="10" width="70" height="60" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
            <text x="25" y="38" font-size="11" font-weight="700" fill="#92400e">Gemini AI</text>
            <text x="25" y="55" font-size="10" font-weight="600" fill="#b45309">&amp; NSE Feed</text>
            <text x="10" y="95" font-size="12" font-weight="700" fill="#0f172a">External Services</text>
        </g>

        <!-- USE CASES OVALS -->
        <!-- UC 1 -->
        <ellipse cx="450" cy="80" rx="150" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="350" y="85" font-size="11" font-weight="600" fill="#0f172a">UC-01: Register &amp; Authenticate Session</text>

        <!-- UC 2 -->
        <ellipse cx="450" cy="130" rx="160" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="340" y="135" font-size="11" font-weight="600" fill="#0f172a">UC-02: Manage Multi-Asset Holdings</text>

        <!-- UC 3 -->
        <ellipse cx="450" cy="180" rx="160" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="335" y="185" font-size="11" font-weight="600" fill="#0f172a">UC-03: Stream Real-Time Price Ticks (SSE)</text>

        <!-- UC 4 -->
        <ellipse cx="450" cy="230" rx="160" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="330" y="235" font-size="11" font-weight="600" fill="#0f172a">UC-04: Execute QVM Multi-Factor Screener</text>

        <!-- UC 5 -->
        <ellipse cx="450" cy="280" rx="165" ry="20" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
        <text x="315" y="285" font-size="11" font-weight="700" fill="#14532d">UC-05: Harvest Section 112A Tax Losses</text>

        <!-- UC 6 -->
        <ellipse cx="450" cy="330" rx="160" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="335" y="335" font-size="11" font-weight="600" fill="#0f172a">UC-06: Simulate Portfolio Rebalancing</text>

        <!-- UC 7 -->
        <ellipse cx="450" cy="380" rx="165" ry="20" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="320" y="385" font-size="11" font-weight="700" fill="#92400e">UC-07: Query Conversational Wealth Copilot</text>

        <!-- UC 8 -->
        <ellipse cx="450" cy="430" rx="160" ry="20" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
        <text x="335" y="435" font-size="11" font-weight="600" fill="#0f172a">UC-08: Analyze Pairs Trading Arbitrage</text>

        <!-- CONNECTING LINES FROM USER -->
        <line x1="130" y1="240" x2="300" y2="80" stroke="#64748b" stroke-width="1.2"/>
        <line x1="130" y1="240" x2="290" y2="130" stroke="#64748b" stroke-width="1.2"/>
        <line x1="130" y1="240" x2="290" y2="180" stroke="#64748b" stroke-width="1.2"/>
        <line x1="130" y1="240" x2="290" y2="230" stroke="#64748b" stroke-width="1.2"/>
        <line x1="130" y1="240" x2="285" y2="280" stroke="#16a34a" stroke-width="1.8"/>
        <line x1="130" y1="240" x2="290" y2="330" stroke="#64748b" stroke-width="1.2"/>
        <line x1="130" y1="240" x2="285" y2="380" stroke="#d97706" stroke-width="1.8"/>
        <line x1="130" y1="240" x2="290" y2="430" stroke="#64748b" stroke-width="1.2"/>

        <!-- CONNECTING LINES FROM EXTERNAL/AI -->
        <line x1="730" y1="230" x2="610" y2="180" stroke="#d97706" stroke-width="1.2"/>
        <line x1="730" y1="230" x2="610" y2="230" stroke="#d97706" stroke-width="1.2"/>
        <line x1="730" y1="230" x2="615" y2="380" stroke="#d97706" stroke-width="1.8"/>
    </svg>
    <p class="diagram-caption">Fig 5.2: Use Case Diagram for the Arthova Wealth Platform</p>
</div>'''

def get_svg_sequence_auth():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 440" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="mArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="440" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Lifeline Headers -->
        <rect x="40" y="20" width="120" height="36" rx="6" fill="#0f172a"/><text x="75" y="43" fill="#fff" font-size="12" font-weight="700">Investor</text>
        <rect x="230" y="20" width="140" height="36" rx="6" fill="#0f172a"/><text x="250" y="43" fill="#fff" font-size="12" font-weight="700">Next.js Client UI</text>
        <rect x="440" y="20" width="160" height="36" rx="6" fill="#0f172a"/><text x="455" y="43" fill="#fff" font-size="12" font-weight="700">NextAuth v5 /actions</text>
        <rect x="670" y="20" width="140" height="36" rx="6" fill="#0f172a"/><text x="690" y="43" fill="#fff" font-size="12" font-weight="700">Neon Postgres</text>

        <!-- Vertical Lifelines -->
        <line x1="100" y1="56" x2="100" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="300" y1="56" x2="300" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="520" y1="56" x2="520" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="740" y1="56" x2="740" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>

        <!-- Messages -->
        <!-- 1 -->
        <line x1="100" y1="90" x2="295" y2="90" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow)"/>
        <text x="110" y="82" font-size="11" font-weight="600" fill="#0f172a">1. Enters Email &amp; Password</text>

        <!-- 2 -->
        <line x1="300" y1="125" x2="515" y2="125" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow)"/>
        <text x="310" y="117" font-size="11" font-weight="600" fill="#0f172a">2. POST credentials to signIn('credentials')</text>

        <!-- 3 -->
        <line x1="520" y1="165" x2="735" y2="165" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow)"/>
        <text x="530" y="157" font-size="11" font-weight="600" fill="#0f172a">3. SQL: SELECT * FROM users WHERE email = $1</text>

        <!-- 4 -->
        <line x1="740" y1="205" x2="525" y2="205" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#mArrow)"/>
        <text x="545" y="197" font-size="11" font-weight="600" fill="#0284c7">4. Returns user record (password_hash)</text>

        <!-- 5: Self loop for bcrypt -->
        <path d="M 520 235 L 560 235 L 560 265 L 525 265" fill="none" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow)"/>
        <text x="570" y="253" font-size="11" font-weight="600" fill="#0f172a">5. bcrypt.compare(pass, hash)</text>

        <!-- 6 -->
        <line x1="520" y1="295" x2="305" y2="295" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#mArrow)"/>
        <text x="325" y="287" font-size="11" font-weight="600" fill="#059669">6. Issues Encrypted JWT Cookie</text>

        <!-- 7 -->
        <line x1="300" y1="340" x2="105" y2="340" stroke="#059669" stroke-width="1.8" marker-end="url(#mArrow)"/>
        <text x="125" y="332" font-size="11" font-weight="600" fill="#059669">7. Success Toast &amp; Redirect to /dashboard</text>
    </svg>
    <p class="diagram-caption">Fig 5.3: Sequence Diagram — User Authentication &amp; Session Token Issuance Flow</p>
</div>'''

def get_svg_sequence_tax():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 440" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="mArrow2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="440" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Headers -->
        <rect x="30" y="20" width="120" height="36" rx="6" fill="#0f172a"/><text x="65" y="43" fill="#fff" font-size="12" font-weight="700">Investor</text>
        <rect x="210" y="20" width="150" height="36" rx="6" fill="#0f172a"/><text x="225" y="43" fill="#fff" font-size="12" font-weight="700">Tax Reports UI</text>
        <rect x="420" y="20" width="170" height="36" rx="6" fill="#0f172a"/><text x="435" y="43" fill="#fff" font-size="12" font-weight="700">Tax Engine (/api/tax)</text>
        <rect x="650" y="20" width="160" height="36" rx="6" fill="#0f172a"/><text x="665" y="43" fill="#fff" font-size="12" font-weight="700">Holdings Database</text>

        <!-- Lines -->
        <line x1="90" y1="56" x2="90" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="285" y1="56" x2="285" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="505" y1="56" x2="505" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="730" y1="56" x2="730" y2="400" stroke="#94a3b8" stroke-dasharray="4 4"/>

        <!-- Flow -->
        <line x1="90" y1="95" x2="280" y2="95" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow2)"/>
        <text x="100" y="87" font-size="11" font-weight="600" fill="#0f172a">1. Opens Tax Reports Dashboard</text>

        <line x1="285" y1="130" x2="500" y2="130" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow2)"/>
        <text x="295" y="122" font-size="11" font-weight="600" fill="#0f172a">2. GET /api/holdings (with purchaseDate)</text>

        <line x1="505" y1="165" x2="725" y2="165" stroke="#0f172a" stroke-width="1.8" marker-end="url(#mArrow2)"/>
        <text x="515" y="157" font-size="11" font-weight="600" fill="#0f172a">3. Query lot records &amp; execution dates</text>

        <line x1="730" y1="200" x2="510" y2="200" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#mArrow2)"/>
        <text x="525" y="192" font-size="11" font-weight="600" fill="#0284c7">4. Return lots: [{symbol, avgCost, cmp, date}]</text>

        <!-- Self calculation -->
        <path d="M 505 230 L 550 230 L 550 265 L 510 265" fill="none" stroke="#16a34a" stroke-width="1.8" marker-end="url(#mArrow2)"/>
        <text x="560" y="244" font-size="10.5" font-weight="700" fill="#16a34a">5. Partition Lots: STCG (&lt;365d) vs LTCG (&gt;=365d)</text>
        <text x="560" y="258" font-size="9.5" fill="#14532d">Offset STCG @ 20% &amp; ₹1.25L Section 112A Headroom</text>

        <line x1="505" y1="295" x2="290" y2="295" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#mArrow2)"/>
        <text x="305" y="287" font-size="11" font-weight="600" fill="#059669">6. Return Tax Breakdown &amp; Direct Savings (₹)</text>

        <line x1="285" y1="335" x2="95" y2="335" stroke="#059669" stroke-width="1.8" marker-end="url(#mArrow2)"/>
        <text x="110" y="327" font-size="11" font-weight="600" fill="#059669">7. Renders 1-Click Tax Harvest Action Plan</text>
    </svg>
    <p class="diagram-caption">Fig 5.5: Sequence Diagram — Section 112A Tax-Loss Harvesting Execution Flow</p>
</div>'''

def get_svg_activity_rebalance():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 480" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="mArrow3" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="480" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Start Node -->
        <circle cx="425" cy="35" r="14" fill="#0f172a"/>
        <text x="445" y="40" font-size="11" font-weight="700" fill="#0f172a">Start</text>

        <line x1="425" y1="49" x2="425" y2="75" stroke="#0f172a" stroke-width="2" marker-end="url(#mArrow3)"/>

        <!-- Activity 1 -->
        <rect x="310" y="75" width="230" height="40" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
        <text x="325" y="100" font-size="11" font-weight="600" fill="#0f172a">Fetch Multi-Asset Balances</text>

        <line x1="425" y1="115" x2="425" y2="145" stroke="#0f172a" stroke-width="2" marker-end="url(#mArrow3)"/>

        <!-- Activity 2 -->
        <rect x="300" y="145" width="250" height="40" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
        <text x="312" y="170" font-size="11" font-weight="600" fill="#0f172a">Compute Current Weights: w_k</text>

        <line x1="425" y1="185" x2="425" y2="215" stroke="#0f172a" stroke-width="2" marker-end="url(#mArrow3)"/>

        <!-- Decision Diamond -->
        <polygon points="425,215 505,255 425,295 345,255" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="375" y="253" font-size="10.5" font-weight="700" fill="#92400e">Asset Drift &gt;= 5%?</text>
        <text x="390" y="267" font-size="9" fill="#92400e">or Eq &gt; 75%</text>

        <!-- Branch Yes (Left) -->
        <line x1="345" y1="255" x2="200" y2="255" stroke="#b91c1c" stroke-width="2"/>
        <text x="250" y="247" font-size="11" font-weight="700" fill="#b91c1c">[Yes]</text>
        <line x1="200" y1="255" x2="200" y2="310" stroke="#b91c1c" stroke-width="2" marker-end="url(#mArrow3)"/>

        <rect x="90" y="310" width="220" height="45" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
        <text x="105" y="330" font-size="11" font-weight="700" fill="#991b1b">Generate Rebalance Orders</text>
        <text x="105" y="344" font-size="9.5" fill="#b91c1c">Deploy Surplus into Underweight Assets</text>

        <!-- Branch No (Right) -->
        <line x1="505" y1="255" x2="650" y2="255" stroke="#059669" stroke-width="2"/>
        <text x="560" y="247" font-size="11" font-weight="700" fill="#059669">[No]</text>
        <line x1="650" y1="255" x2="650" y2="310" stroke="#059669" stroke-width="2" marker-end="url(#mArrow3)"/>

        <rect x="540" y="310" width="220" height="45" rx="6" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
        <text x="560" y="330" font-size="11" font-weight="700" fill="#166534">Flag: "Allocation Healthy"</text>
        <text x="560" y="344" font-size="9.5" fill="#15803d">Maintain Current Recurring SIPs</text>

        <!-- Merge at End -->
        <line x1="200" y1="355" x2="200" y2="400" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="650" y1="355" x2="650" y2="400" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="200" y1="400" x2="650" y2="400" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="425" y1="400" x2="425" y2="430" stroke="#0f172a" stroke-width="2" marker-end="url(#mArrow3)"/>

        <!-- End Node -->
        <circle cx="425" cy="445" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <circle cx="425" cy="445" r="8" fill="#0f172a"/>
        <text x="445" y="450" font-size="11" font-weight="700" fill="#0f172a">End</text>
    </svg>
    <p class="diagram-caption">Fig 5.8: Activity Diagram — Portfolio Aggregation &amp; Smart Rebalancing Workflow</p>
</div>'''

print("Diagrams module compiled.")

def get_svg_dfd_level0():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="dfdArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="360" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- External Entity: User -->
        <rect x="40" y="130" width="140" height="80" rx="6" fill="#0f172a"/>
        <text x="65" y="165" fill="#ffffff" font-size="13" font-weight="700">INVESTOR /</text>
        <text x="75" y="185" fill="#93c5fd" font-size="12" font-weight="600">USER</text>

        <!-- Process 0.0: Central System -->
        <circle cx="425" cy="170" r="80" fill="#ffffff" stroke="#0284c7" stroke-width="3"/>
        <text x="395" y="145" font-size="12" font-weight="700" fill="#0284c7">PROCESS 0.0</text>
        <text x="365" y="165" font-size="13" font-weight="800" fill="#0f172a">ARTHOVA WEALTH</text>
        <text x="380" y="185" font-size="12" font-weight="700" fill="#0f172a">INTELLIGENCE</text>
        <text x="395" y="202" font-size="10.5" fill="#64748b">PLATFORM</text>

        <!-- External Entity: Database -->
        <rect x="670" y="60" width="150" height="70" rx="6" fill="#065f46"/>
        <text x="690" y="92" fill="#ffffff" font-size="12" font-weight="700">NEON DATABASE</text>
        <text x="705" y="110" fill="#a7f3d0" font-size="10.5">(PostgreSQL 16)</text>

        <!-- External Entity: AI Gateway -->
        <rect x="670" y="210" width="150" height="70" rx="6" fill="#92400e"/>
        <text x="695" y="242" fill="#ffffff" font-size="12" font-weight="700">GEMINI 2.5 AI</text>
        <text x="695" y="260" fill="#fde68a" font-size="10.5">&amp; NSE Telemetry</text>

        <!-- Arrows -->
        <line x1="180" y1="150" x2="345" y2="150" stroke="#0f172a" stroke-width="1.8" marker-end="url(#dfdArrow)"/>
        <text x="195" y="142" font-size="9.5" font-weight="600" fill="#0f172a">Holdings, Profile &amp; Queries</text>

        <line x1="345" y1="190" x2="180" y2="190" stroke="#0284c7" stroke-width="1.8" marker-end="url(#dfdArrow)"/>
        <text x="195" y="206" font-size="9.5" font-weight="600" fill="#0284c7">Net Worth, Drift, Copilot Insights</text>

        <line x1="500" y1="140" x2="670" y2="105" stroke="#065f46" stroke-width="1.8" marker-end="url(#dfdArrow)"/>
        <text x="525" y="115" font-size="9.5" font-weight="600" fill="#065f46">ACID Relational Queries</text>

        <line x1="500" y1="200" x2="670" y2="235" stroke="#92400e" stroke-width="1.8" marker-end="url(#dfdArrow)"/>
        <text x="525" y="235" font-size="9.5" font-weight="600" fill="#92400e">Prompt Context Injection</text>
    </svg>
    <p class="diagram-caption">Fig 4.2: Level 0 Context-Level Data Flow Diagram (DFD)</p>
</div>'''

def get_svg_qvm_pipeline():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="qvmArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="320" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Ingestion -->
        <rect x="25" y="110" width="150" height="85" rx="6" fill="#0f172a"/>
        <text x="45" y="135" fill="#ffffff" font-size="11" font-weight="700">Market Data</text>
        <text x="45" y="152" fill="#93c5fd" font-size="10">P/E, ROCE, ROE,</text>
        <text x="45" y="168" fill="#93c5fd" font-size="10">1Y/6M/3M Returns</text>

        <line x1="175" y1="152" x2="225" y2="152" stroke="#0f172a" stroke-width="2" marker-end="url(#qvmArrow)"/>

        <!-- 3 Factor Branches -->
        <!-- Quality (40%) -->
        <rect x="230" y="30" width="230" height="70" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="245" y="52" font-size="11.5" font-weight="700" fill="#166534">Quality Factor (40%)</text>
        <text x="245" y="70" font-size="9.5" fill="#15803d">• Stanford Piotroski F-Score (0–9)</text>
        <text x="245" y="85" font-size="9.5" fill="#15803d">• ROCE (35%) + ROE (35%)</text>

        <!-- Valuation (30%) -->
        <rect x="230" y="120" width="230" height="70" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="245" y="142" font-size="11.5" font-weight="700" fill="#1e40af">Valuation Factor (30%)</text>
        <text x="245" y="160" font-size="9.5" fill="#1d4ed8">• P/E vs Sector Median Benchmark</text>
        <text x="245" y="175" font-size="9.5" fill="#1d4ed8">• Dividend Yield Normalization</text>

        <!-- Momentum (30%) -->
        <rect x="230" y="210" width="230" height="70" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="245" y="232" font-size="11.5" font-weight="700" fill="#92400e">Momentum Factor (30%)</text>
        <text x="245" y="250" font-size="9.5" fill="#b45309">• 6M Relative Return vs Nifty 50 (50%)</text>
        <text x="245" y="265" font-size="9.5" fill="#b45309">• 12M Return (30%) + 1M Return (20%)</text>

        <!-- Merge Arrows -->
        <line x1="460" y1="65" x2="520" y2="135" stroke="#0f172a" stroke-width="1.8" marker-end="url(#qvmArrow)"/>
        <line x1="460" y1="155" x2="520" y2="155" stroke="#0f172a" stroke-width="1.8" marker-end="url(#qvmArrow)"/>
        <line x1="460" y1="245" x2="520" y2="175" stroke="#0f172a" stroke-width="1.8" marker-end="url(#qvmArrow)"/>

        <!-- Final Box -->
        <rect x="525" y="110" width="295" height="90" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <text x="545" y="135" font-size="12" font-weight="800" fill="#0f172a">COMPOSITE QVM SCORE (0–100)</text>
        <text x="545" y="155" font-size="10.5" fill="#059669" font-weight="700">80–100: Strong Buy | 65–79: Buy</text>
        <text x="545" y="172" font-size="10" fill="#475569">+ Altman Z-Score Distress Filter</text>
        <text x="545" y="188" font-size="9.5" fill="#64748b">Auto-injected into AI Advisor UI &amp; Copilot</text>
    </svg>
    <p class="diagram-caption">Fig 4.1: Multi-Factor QVM Pipeline Architecture &amp; Quant Data Flow</p>
</div>'''

def get_svg_sequence_qvm():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="sqArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="420" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Headers -->
        <rect x="40" y="20" width="120" height="36" rx="6" fill="#0f172a"/><text x="75" y="43" fill="#fff" font-size="12" font-weight="700">Investor</text>
        <rect x="230" y="20" width="150" height="36" rx="6" fill="#0f172a"/><text x="250" y="43" fill="#fff" font-size="12" font-weight="700">UI Dashboard</text>
        <rect x="440" y="20" width="170" height="36" rx="6" fill="#0f172a"/><text x="455" y="43" fill="#fff" font-size="12" font-weight="700">/api/market/quote</text>
        <rect x="670" y="20" width="150" height="36" rx="6" fill="#0f172a"/><text x="685" y="43" fill="#fff" font-size="12" font-weight="700">Factor Registry</text>

        <!-- Lines -->
        <line x1="100" y1="56" x2="100" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="305" y1="56" x2="305" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="525" y1="56" x2="525" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="745" y1="56" x2="745" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>

        <!-- Flow -->
        <line x1="100" y1="95" x2="300" y2="95" stroke="#0f172a" stroke-width="1.8" marker-end="url(#sqArrow)"/>
        <text x="110" y="87" font-size="11" font-weight="600" fill="#0f172a">1. Selects Ticker (e.g. TCS)</text>

        <line x1="305" y1="130" x2="520" y2="130" stroke="#0f172a" stroke-width="1.8" marker-end="url(#sqArrow)"/>
        <text x="315" y="122" font-size="11" font-weight="600" fill="#0f172a">2. GET /api/market/quote?symbol=TCS</text>

        <line x1="525" y1="165" x2="740" y2="165" stroke="#0f172a" stroke-width="1.8" marker-end="url(#sqArrow)"/>
        <text x="535" y="157" font-size="11" font-weight="600" fill="#0f172a">3. Fetch Fundamentals &amp; Piotroski Signals</text>

        <line x1="745" y1="200" x2="530" y2="200" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#sqArrow)"/>
        <text x="545" y="192" font-size="11" font-weight="600" fill="#0284c7">4. Return P/E, ROCE, Returns, F-Score</text>

        <!-- Self computation -->
        <path d="M 525 230 L 575 230 L 575 265 L 530 265" fill="none" stroke="#16a34a" stroke-width="1.8" marker-end="url(#sqArrow)"/>
        <text x="585" y="244" font-size="10.5" font-weight="700" fill="#16a34a">5. Compute S_QVM (40/30/30)</text>
        <text x="585" y="258" font-size="9.5" fill="#14532d">Evaluate Altman Z Distress Zone</text>

        <line x1="525" y1="300" x2="310" y2="300" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#sqArrow)"/>
        <text x="330" y="292" font-size="11" font-weight="600" fill="#059669">6. JSON: {score: 88, rating: "Strong Buy"}</text>

        <line x1="305" y1="340" x2="105" y2="340" stroke="#059669" stroke-width="1.8" marker-end="url(#sqArrow)"/>
        <text x="120" y="332" font-size="11" font-weight="600" fill="#059669">7. Render QVM Card with Piotroski 8/9 &amp; Safe Zone</text>
    </svg>
    <p class="diagram-caption">Fig 5.4: Sequence Diagram — QVM Multi-Factor Equity Scoring Flow</p>
</div>'''

def get_svg_sequence_sse():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 380" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="sseArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="380" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Headers -->
        <rect x="40" y="20" width="140" height="36" rx="6" fill="#0f172a"/><text x="60" y="43" fill="#fff" font-size="12" font-weight="700">Client Browser</text>
        <rect x="250" y="20" width="160" height="36" rx="6" fill="#0f172a"/><text x="265" y="43" fill="#fff" font-size="12" font-weight="700">/api/stream/prices</text>
        <rect x="480" y="20" width="160" height="36" rx="6" fill="#0f172a"/><text x="495" y="43" fill="#fff" font-size="12" font-weight="700">NSE Market Stream</text>
        <rect x="690" y="20" width="130" height="36" rx="6" fill="#0f172a"/><text x="705" y="43" fill="#fff" font-size="12" font-weight="700">UI PriceCell</text>

        <!-- Lines -->
        <line x1="110" y1="56" x2="110" y2="340" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="330" y1="56" x2="330" y2="340" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="560" y1="56" x2="560" y2="340" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="755" y1="56" x2="755" y2="340" stroke="#94a3b8" stroke-dasharray="4 4"/>

        <!-- Flow -->
        <line x1="110" y1="95" x2="325" y2="95" stroke="#0f172a" stroke-width="1.8" marker-end="url(#sseArrow)"/>
        <text x="120" y="87" font-size="11" font-weight="600" fill="#0f172a">1. EventSource('/api/stream/prices')</text>

        <line x1="330" y1="130" x2="555" y2="130" stroke="#0f172a" stroke-width="1.8" marker-end="url(#sseArrow)"/>
        <text x="345" y="122" font-size="11" font-weight="600" fill="#0f172a">2. Register Client Stream Listener</text>

        <!-- Repeat tick loop -->
        <rect x="230" y="160" width="450" height="85" rx="6" fill="#f0fdf4" stroke="#86efac" stroke-dasharray="3 3"/>
        <text x="245" y="180" font-size="10.5" font-weight="700" fill="#15803d">[Interval: Every 3000ms Loop]</text>

        <line x1="560" y1="200" x2="335" y2="200" stroke="#16a34a" stroke-width="1.8" marker-end="url(#sseArrow)"/>
        <text x="350" y="195" font-size="10" font-weight="600" fill="#166534">3. Emits Price Tick (symbol, cmp, delta)</text>

        <line x1="330" y1="225" x2="115" y2="225" stroke="#16a34a" stroke-width="1.8" marker-end="url(#sseArrow)"/>
        <text x="135" y="220" font-size="10" font-weight="600" fill="#166534">4. SSE: "data: {symbol, price, change}"</text>

        <line x1="110" y1="285" x2="750" y2="285" stroke="#0284c7" stroke-width="1.8" marker-end="url(#sseArrow)"/>
        <text x="130" y="277" font-size="11" font-weight="600" fill="#0284c7">5. Zustand Store Updates &amp; Triggers 600ms Micro-Flash Animation</text>
    </svg>
    <p class="diagram-caption">Fig 5.6: Sequence Diagram — Real-Time Price Streaming (SSE) Flow</p>
</div>'''

def get_svg_sequence_copilot():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="cpArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="420" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Headers -->
        <rect x="30" y="20" width="120" height="36" rx="6" fill="#0f172a"/><text x="65" y="43" fill="#fff" font-size="12" font-weight="700">Investor</text>
        <rect x="200" y="20" width="140" height="36" rx="6" fill="#0f172a"/><text x="215" y="43" fill="#fff" font-size="12" font-weight="700">Copilot Widget</text>
        <rect x="390" y="20" width="150" height="36" rx="6" fill="#0f172a"/><text x="405" y="43" fill="#fff" font-size="12" font-weight="700">/api/ai/copilot</text>
        <rect x="580" y="20" width="130" height="36" rx="6" fill="#0f172a"/><text x="595" y="43" fill="#fff" font-size="12" font-weight="700">Gemini 2.5</text>
        <rect x="730" y="20" width="100" height="36" rx="6" fill="#0f172a"/><text x="740" y="43" fill="#fff" font-size="12" font-weight="700">Local Quant</text>

        <!-- Lines -->
        <line x1="90" y1="56" x2="90" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="270" y1="56" x2="270" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="465" y1="56" x2="465" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="645" y1="56" x2="645" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>
        <line x1="780" y1="56" x2="780" y2="380" stroke="#94a3b8" stroke-dasharray="4 4"/>

        <!-- Flow -->
        <line x1="90" y1="95" x2="265" y2="95" stroke="#0f172a" stroke-width="1.8" marker-end="url(#cpArrow)"/>
        <text x="100" y="87" font-size="10.5" font-weight="600" fill="#0f172a">1. Queries: "Am I overexposed to tech?"</text>

        <line x1="270" y1="130" x2="460" y2="130" stroke="#0f172a" stroke-width="1.8" marker-end="url(#cpArrow)"/>
        <text x="280" y="122" font-size="10.5" font-weight="600" fill="#0f172a">2. POST (Prompt + Live Portfolio Context)</text>

        <line x1="465" y1="165" x2="640" y2="165" stroke="#0f172a" stroke-width="1.8" marker-end="url(#cpArrow)"/>
        <text x="475" y="157" font-size="10" font-weight="600" fill="#0f172a">3. ai.models.generateContent()</text>

        <!-- Fallback alternative box -->
        <rect x="420" y="185" width="410" height="85" rx="6" fill="#fef2f2" stroke="#fca5a5" stroke-dasharray="3 3"/>
        <text x="430" y="202" font-size="10" font-weight="700" fill="#991b1b">[Exception: Timeout or Quota Limit]</text>

        <line x1="465" y1="225" x2="775" y2="225" stroke="#dc2626" stroke-width="1.8" marker-end="url(#cpArrow)"/>
        <text x="475" y="220" font-size="9.5" font-weight="700" fill="#dc2626">4. Fallback: generateLocalDeterministicReply()</text>

        <line x1="780" y1="250" x2="470" y2="250" stroke="#16a34a" stroke-width="1.8" stroke-dasharray="4 4" marker-end="url(#cpArrow)"/>
        <text x="485" y="244" font-size="9.5" font-weight="700" fill="#15803d">5. Returns Exact 25% Sector Audit Response</text>

        <line x1="465" y1="310" x2="275" y2="310" stroke="#059669" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#cpArrow)"/>
        <text x="290" y="302" font-size="10.5" font-weight="600" fill="#059669">6. HTTP 200: {reply, source}</text>

        <line x1="270" y1="345" x2="95" y2="345" stroke="#059669" stroke-width="1.8" marker-end="url(#cpArrow)"/>
        <text x="110" y="337" font-size="10.5" font-weight="600" fill="#059669">7. Renders Markdown Formatted Advisory</text>
    </svg>
    <p class="diagram-caption">Fig 5.7: Sequence Diagram — Conversational AI Wealth Copilot Query &amp; Fallback Flow</p>
</div>'''

def get_svg_activity_tax():
    return '''<div class="diagram-container">
    <svg viewBox="0 0 850 480" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="'Plus Jakarta Sans', sans-serif">
        <defs>
            <marker id="txArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/></marker>
        </defs>
        <rect width="850" height="480" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>

        <!-- Start -->
        <circle cx="425" cy="30" r="14" fill="#0f172a"/>
        <text x="445" y="35" font-size="11" font-weight="700" fill="#0f172a">Start</text>

        <line x1="425" y1="44" x2="425" y2="70" stroke="#0f172a" stroke-width="2" marker-end="url(#txArrow)"/>

        <!-- Step 1 -->
        <rect x="300" y="70" width="250" height="40" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
        <text x="315" y="95" font-size="11" font-weight="600" fill="#0f172a">Scan Active Holdings &amp; Buy Dates</text>

        <line x1="425" y1="110" x2="425" y2="140" stroke="#0f172a" stroke-width="2" marker-end="url(#txArrow)"/>

        <!-- Step 2 -->
        <rect x="290" y="140" width="270" height="40" rx="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
        <text x="302" y="165" font-size="11" font-weight="600" fill="#0f172a">Partition: STCG (&lt;365d) vs LTCG (&gt;=365d)</text>

        <line x1="425" y1="180" x2="425" y2="210" stroke="#0f172a" stroke-width="2" marker-end="url(#txArrow)"/>

        <!-- Decision -->
        <polygon points="425,210 515,250 425,290 335,250" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <text x="365" y="247" font-size="11" font-weight="700" fill="#92400e">Unrealized Losses</text>
        <text x="385" y="262" font-size="9.5" fill="#92400e">Available?</text>

        <!-- Yes (Left) -->
        <line x1="335" y1="250" x2="190" y2="250" stroke="#16a34a" stroke-width="2"/>
        <text x="240" y="242" font-size="11" font-weight="700" fill="#16a34a">[Yes]</text>
        <line x1="190" y1="250" x2="190" y2="310" stroke="#16a34a" stroke-width="2" marker-end="url(#txArrow)"/>

        <rect x="70" y="310" width="240" height="50" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
        <text x="85" y="332" font-size="11" font-weight="700" fill="#14532d">Offset Against 20% STCG</text>
        <text x="85" y="347" font-size="9.5" fill="#15803d">Direct Tax Saved = min(STCG, Loss) * 20%</text>

        <!-- No (Right) -->
        <line x1="515" y1="250" x2="660" y2="250" stroke="#64748b" stroke-width="2"/>
        <text x="575" y="242" font-size="11" font-weight="700" fill="#64748b">[No]</text>
        <line x1="660" y1="250" x2="660" y2="310" stroke="#64748b" stroke-width="2" marker-end="url(#txArrow)"/>

        <rect x="550" y="310" width="220" height="50" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
        <text x="570" y="332" font-size="11" font-weight="700" fill="#334155">Nil Loss Harvesting</text>
        <text x="570" y="347" font-size="9.5" fill="#64748b">Highlight ₹1.25L Section 112A Headroom</text>

        <!-- Merge -->
        <line x1="190" y1="360" x2="190" y2="410" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="660" y1="360" x2="660" y2="410" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="190" y1="410" x2="660" y2="410" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="425" y1="410" x2="425" y2="440" stroke="#0f172a" stroke-width="2" marker-end="url(#txArrow)"/>

        <!-- End -->
        <circle cx="425" cy="455" r="14" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <circle cx="425" cy="455" r="8" fill="#0f172a"/>
        <text x="445" y="460" font-size="11" font-weight="700" fill="#0f172a">End</text>
    </svg>
    <p class="diagram-caption">Fig 5.9: Activity Diagram — Year-End Tax Optimization &amp; Loss Harvesting Workflow</p>
</div>'''

