# Arthova Web 📈

**Next-Gen Quantitative Portfolio Intelligence & Wealth Management Platform**

Arthova is an institutional-grade financial platform integrating algorithmic trading models, portfolio risk diagnostics, and real-time equity analytics tailored for the Indian Stock Market (NSE/BSE).

---

## 🏗️ Architecture

```
                  ┌───────────────────────────────┐
                  │   Neon Serverless PostgreSQL  │
                  └───────────────┬───────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
       ┌─────────────────┐                 ┌─────────────────┐
       │   Render.com    │                 │     Vercel      │
       │  (Spring Boot)  │                 │    (Next.js)    │
       └─────────────────┘                 └─────────────────┘
```

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, Recharts, TanStack Query, Framer Motion.
- **Backend**: Java 21, Spring Boot 4, Spring Security, Hibernate JPA.
- **Database**: Serverless PostgreSQL on Neon with Drizzle ORM schema migrations.
- **Quantitative Engine**: Machine Learning & Reinforcement Learning models based on *Dey et al. (2025)* (PPO, DQN, LSTM, StatArb Cointegration, and Gemini Financial NLP).

---

## 🚀 Live Services

- **Backend**: [https://arthova-web.onrender.com](https://arthova-web.onrender.com)
- **Database**: Neon Serverless PostgreSQL (`ap-southeast-1`)
