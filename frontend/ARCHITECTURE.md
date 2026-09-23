# Arthova Codebase Feature Architecture & Traceability Guide

This guide maps each platform capability, UI screen, and data pipeline to its exact codebase location.

---

## 1. High-Level Directory Overview

```text
frontend/
├── src/
│   ├── app/                    # Next.js App Router (Pages, Layouts, API Endpoints)
│   │   ├── (auth)/             # Authentication views (Login, Register, Actions)
│   │   ├── (marketing)/        # Landing page & public layout
│   │   ├── api/                # Internal backend API proxies & handlers
│   │   └── dashboard/          # All authenticated application screens
│   ├── components/             # Reusable UI & Feature component libraries
│   │   ├── charts/             # Data visualization & simulation engines
│   │   ├── layout/             # Application chrome (Sidebar, Navigation, TopNav)
│   │   ├── onboarding/         # User profiling & risk questionnaire
│   │   ├── portfolio/          # Investment tables, QVM cards, and trade execution
│   │   └── ui/                 # Atomic design tokens (Cards, Badges, Modals)
│   ├── hooks/                  # Standalone client state hooks
│   └── lib/                    # Business logic, quantitative algorithms, DB & store
│       ├── db/                 # Database schema and PostgreSQL pool connection
│       └── hooks/              # Global portfolio computation & data hooks
backend/                        # Java / Spring Boot enterprise services (Port 8080)
```

---

## 2. Feature Traceability Matrix

| Feature | Primary Page Route | Key Components | Backend / Algorithm Logic |
| :--- | :--- | :--- | :--- |
| **Consolidated Dashboard** | `src/app/dashboard/page.tsx` | `AllocationDonut`, `SummaryCard`, `RecentActivity` | `src/lib/hooks/use-portfolio.ts` |
| **AI Advisor & Quant Allocation** | `src/app/dashboard/ai-advisor/page.tsx` | `SmartRebalancerCard`, `StressTestingCard`, `NetWorthProjectionChart` | `src/lib/ai-engine.ts`, `src/lib/factor-scoring.ts` |
| **Stock Portfolio** | `src/app/dashboard/stocks/page.tsx` | `HoldingsTable`, `PriceCandlestick`, `AssetActionModal` | `src/app/api/market/quote/route.ts` |
| **Mutual Funds** | `src/app/dashboard/mutual-funds/page.tsx`| `HoldingsTable`, `AssetActionModal` | `src/app/api/market/mf/route.ts` |
| **Gold & Silver (Bullion)** | `src/app/dashboard/gold-silver/page.tsx` | `ManualAssetTable`, `AssetActionModal` | `use-portfolio.ts` (live gold/silver calculation) |
| **Fixed Deposits & Debt** | `src/app/dashboard/fixed-deposits/page.tsx`| `ManualAssetTable`, `AssetActionModal` | Interest accrual engine in `use-portfolio.ts` |
| **Real Estate & Property** | `src/app/dashboard/property/page.tsx` | `ManualAssetTable`, `AssetActionModal` | Rental yield engine in `use-portfolio.ts` |
| **Liabilities & Debt Repayment** | `src/app/dashboard/liabilities/page.tsx` | `ManualAssetTable`, `AssetActionModal` | EMI & present net worth calculation in `use-portfolio.ts` |
| **Tax Reports & Harvesting** | `src/app/dashboard/tax-reports/page.tsx` | `HoldingsTable`, Tax harvesting cards | `src/lib/mock-data.ts` (Tax engine) |
| **Multi-Asset Comparison** | `src/app/dashboard/compare/page.tsx` | `ComparisonController` | `src/app/api/market/compare/route.ts` |
| **Institutional Auth** | `src/app/(auth)/login/page.tsx`, `register`| AuthLayout, NextAuth | `src/auth.ts`, `src/lib/db/schema.ts` |

---

## 3. Clean Barrel Imports

You can now import any component or core utility cleanly through abstract barrel paths:

```typescript
// Components
import { SummaryCard, DeltaBadge, AssetActionModal } from '@/components/ui';
import { AllocationDonut, SmartRebalancerCard } from '@/components/charts';
import { HoldingsTable, QvmScoringCard } from '@/components/portfolio';
import { Sidebar, TopNav, CommandPalette } from '@/components/layout';

// All in one:
import { SummaryCard, SmartRebalancerCard, HoldingsTable } from '@/components';

// Business Logic & Services
import { usePortfolio, formatINR, formatINRCompact, runQuantEngine } from '@/lib';
```
