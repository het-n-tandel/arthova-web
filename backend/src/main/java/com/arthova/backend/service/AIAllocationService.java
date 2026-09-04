package com.arthova.backend.service;

import com.arthova.backend.dto.AIAllocationDTO.*;
import com.arthova.backend.entity.User;
import com.arthova.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AIAllocationService {

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIRecommendationResponse generateRecommendation(UserProfilePayload payload) {
        AIRecommendationResponse response = new AIRecommendationResponse();

        UserDemographics demo = payload.getUserDemographics() != null ? payload.getUserDemographics() : new UserDemographics();
        FinancialCashflow cashflow = payload.getFinancialCashflow() != null ? payload.getFinancialCashflow() : new FinancialCashflow();
        NetWorthBreakdown netWorth = payload.getNetWorthBreakdown() != null ? payload.getNetWorthBreakdown() : new NetWorthBreakdown();
        RiskAndInsurance riskIns = payload.getRiskAndInsurance() != null ? payload.getRiskAndInsurance() : new RiskAndInsurance();
        List<FinancialGoalItem> goals = payload.getFinancialGoals() != null ? payload.getFinancialGoals() : new ArrayList<>();

        // ── LAYER 1: CASH FLOW & TAX GUARDRAILS ─────────────────────────────
        double surplus = cashflow.getMonthlyIncome() - cashflow.getMonthlyExpenses() - cashflow.getMonthlyEmis();
        response.setNetMonthlySurplus(Math.max(0, surplus));

        double requiredEmergencyBuffer = cashflow.getMonthlyExpenses() * 6.0;
        double emergencyNeeded = riskIns.isHasEmergencyFund() ? 0.0 : Math.min(requiredEmergencyBuffer, netWorth.getTotalCurrentAssets());
        response.setEmergencyBufferNeeded(emergencyNeeded);

        // Current user allocation
        RecommendedAllocation currentAlloc = new RecommendedAllocation();
        currentAlloc.setEquityPercent(netWorth.getAssetBreakdownPercent().getEquity());
        currentAlloc.setDebtPercent(netWorth.getAssetBreakdownPercent().getFdDebt());
        currentAlloc.setGoldPercent(netWorth.getAssetBreakdownPercent().getGold());
        currentAlloc.setCashPercent(netWorth.getAssetBreakdownPercent().getRealEstate());
        response.setCurrentAllocation(currentAlloc);

        // ── LAYER 2: ASSET ALLOCATION & GOAL SOLVER ───────────────────────────
        int age = demo.getAge() > 0 ? demo.getAge() : 28;
        int retirementAge = demo.getTargetRetirementAge() > age ? demo.getTargetRetirementAge() : 55;
        response.setRetirementAge(retirementAge);
        int yearsToRetire = retirementAge - age;

        // Risk-adjusted equity target rule
        double targetEquity = 100.0 - age;
        if ("High".equalsIgnoreCase(riskIns.getRiskAppetite())) {
            targetEquity += 10.0;
        } else if ("Low".equalsIgnoreCase(riskIns.getRiskAppetite())) {
            targetEquity -= 15.0;
        }
        targetEquity = Math.max(20.0, Math.min(80.0, targetEquity));

        double targetGold = 10.0;
        double targetCash = emergencyNeeded > 0 ? 10.0 : 5.0;
        double targetDebt = Math.max(5.0, 100.0 - targetEquity - targetGold - targetCash);

        RecommendedAllocation targetAlloc = new RecommendedAllocation();
        targetAlloc.setEquityPercent(targetEquity);
        targetAlloc.setDebtPercent(targetDebt);
        targetAlloc.setGoldPercent(targetGold);
        targetAlloc.setCashPercent(targetCash);
        response.setRecommendedAllocation(targetAlloc);

        // ── ASSET CLASS RECOMMENDATIONS & WHY RECOMMENDED (EXPLANATION CARDS) ──
        List<AssetClassRecommendation> assetClassRecs = new ArrayList<>();

        // 1. Stocks & Equity Recommendation
        AssetClassRecommendation equityRec = new AssetClassRecommendation();
        equityRec.setAssetClass("Equity (Stocks & Mutual Funds)");
        equityRec.setRecommendedPercent(targetEquity);
        equityRec.setWhyRecommended(String.format(
                "At age %d with %d years to retirement, equity compounding is required to beat 6%% inflation. Equities historically deliver 12%%–14%% CAGR. A %.0f%% allocation balances high wealth accumulation while absorbing short-term market corrections.",
                age, yearsToRetire, targetEquity
        ));
        equityRec.setTopInstruments(Arrays.asList(
                "Nifty 50 Index Mutual Funds (Core Foundation)",
                "Parag Parikh Flexi Cap Fund (Global & Indian Growth)",
                "Bluechip Large-Cap Stocks (Reliance, TCS, HDFC Bank, Infosys)"
        ));
        equityRec.setExpectedReturn("12.0% – 14.0% CAGR");
        equityRec.setRiskLevel("High Growth / Long-Term Compounding");
        equityRec.setTaxRule("12.5% LTCG on gains above ₹1.25 Lakh; 20% STCG");
        assetClassRecs.add(equityRec);

        // 2. Fixed Income / Debt Recommendation
        AssetClassRecommendation debtRec = new AssetClassRecommendation();
        debtRec.setAssetClass("Fixed Income (Fixed Deposits & Debt)");
        debtRec.setRecommendedPercent(targetDebt);
        if (cashflow.getTaxBracketPercent() >= 30) {
            debtRec.setWhyRecommended(String.format(
                    "Provides capital protection and shields your portfolio during market drawdowns. In your 30%% tax bracket, the AI directs short/medium debt into Arbitrage Mutual Funds to be taxed as Equity (20%% STCG) rather than paying 30%% slab tax on bank FDs.",
                    targetDebt
            ));
            debtRec.setTopInstruments(Arrays.asList(
                    "Arbitrage Mutual Funds (Saves ~10% tax vs FDs)",
                    "Top Bank Fixed Deposits (SBI / HDFC 7.1% - 7.5%)",
                    "Corporate AAA Bond Funds"
            ));
            debtRec.setTaxRule("Tax-optimized equity arbitrage (20% STCG) vs 30% slab");
        } else {
            debtRec.setWhyRecommended(String.format(
                    "Guarantees predictable capital safety and regular interest income without market risk, stabilizing your overall portfolio at %.0f%% weight.",
                    targetDebt
            ));
            debtRec.setTopInstruments(Arrays.asList(
                    "High-Interest Bank Fixed Deposits (7.1% - 7.5%)",
                    "Short-Duration Debt Mutual Funds",
                    "RBI Floating Rate Savings Bonds"
            ));
            debtRec.setTaxRule("Taxed as per regular income slab rate");
        }
        debtRec.setExpectedReturn("7.0% – 7.5% p.a.");
        debtRec.setRiskLevel("Low Risk / Capital Preservation");
        assetClassRecs.add(debtRec);

        // 3. Gold & Silver Recommendation
        AssetClassRecommendation goldRec = new AssetClassRecommendation();
        goldRec.setAssetClass("Gold & Silver");
        goldRec.setRecommendedPercent(targetGold);
        goldRec.setWhyRecommended("Acts as a crisis hedge and purchasing power preserver. Gold exhibits near-zero correlation with Indian equities, rising when stock markets crash and currency weakens.");
        goldRec.setTopInstruments(Arrays.asList(
                "Sovereign Gold Bonds (SGB - 2.5% annual interest + tax-free gains)",
                "Gold ETFs (Nippon / HDFC Gold BeES)",
                "Physical 24K Gold / Silver ETFs"
        ));
        goldRec.setExpectedReturn("8.5% – 10.0% p.a.");
        goldRec.setRiskLevel("Moderate / Safe-Haven & Inflation Hedge");
        goldRec.setTaxRule("SGBs held to maturity are 100% Tax-Free; Gold ETFs taxed at slab");
        assetClassRecs.add(goldRec);

        // 4. Cash & Emergency Liquidity
        AssetClassRecommendation cashRec = new AssetClassRecommendation();
        cashRec.setAssetClass("Cash & Emergency Buffer");
        cashRec.setRecommendedPercent(targetCash);
        cashRec.setWhyRecommended(emergencyNeeded > 0
                ? String.format("Reserves ₹%.0f (6 months living expenses at ₹%.0f/mo) strictly in liquid cash so you never need to distress-sell stocks during an emergency.", emergencyNeeded, cashflow.getMonthlyExpenses())
                : "Provides immediate transactional liquidity for monthly EMIs, unexpected medical costs, and market dip buying opportunities."
        );
        cashRec.setTopInstruments(Arrays.asList(
                "Liquid Mutual Funds (Instant T+1 redemption)",
                "High-Yield Auto-Sweep Savings Account",
                "7-Day to 90-Day Short-Term Bank FDs"
        ));
        cashRec.setExpectedReturn("6.0% – 6.8% p.a.");
        cashRec.setRiskLevel("Zero Volatility / 100% Instant Liquidity");
        cashRec.setTaxRule("Taxed at income tax slab rate");
        assetClassRecs.add(cashRec);

        response.setAssetClassRecommendations(assetClassRecs);

        // ── GOAL EXECUTION PLAN & WHY RECOMMENDED FOR GOALS ─────────────────
        List<GoalExecutionPlanItem> goalItems = new ArrayList<>();
        List<AssetRecommendationReason> assetReasons = new ArrayList<>();

        for (FinancialGoalItem goal : goals) {
            GoalExecutionPlanItem item = new GoalExecutionPlanItem();
            item.setGoal(goal.getType());
            item.setOriginalTarget(goal.getTargetAmount());
            item.setHorizonYears(goal.getHorizonYears());

            double inflationAdjusted = goal.getTargetAmount() * Math.pow(1.06, goal.getHorizonYears());
            item.setInflationAdjustedTarget(Math.round(inflationAdjusted));

            String assetClass;
            String reasonText;
            String taxText;
            String riskProfileText;
            double expectedAnnualReturn;

            if (goal.getHorizonYears() <= 3) {
                if (cashflow.getTaxBracketPercent() >= 30) {
                    assetClass = "Arbitrage Mutual Funds";
                    reasonText = String.format("Selected for short-term horizon (%d yrs) with capital protection. Taxed at 20%% STCG equity rates instead of 30%% FD slab tax.", goal.getHorizonYears());
                    taxText = "Saves ~10% in tax leakage vs FDs";
                } else {
                    assetClass = "Short-Term Fixed Deposits";
                    reasonText = String.format("Selected for guaranteed 100%% capital safety for a short horizon of %d years.", goal.getHorizonYears());
                    taxText = "Standard slab interest tax";
                }
                riskProfileText = "Low Volatility / Capital Preservation";
                expectedAnnualReturn = 0.07;
            } else if (goal.getHorizonYears() <= 7) {
                assetClass = "Balanced Advantage Funds";
                reasonText = String.format("Selected for medium-term horizon (%d yrs) to capture equity upside while dynamically hedging market downturns.", goal.getHorizonYears());
                taxText = "Equity tax treatment (12.5% LTCG)";
                riskProfileText = "Moderate Risk / Growth & Stability";
                expectedAnnualReturn = 0.10;
            } else {
                assetClass = "Nifty 50 Index & Flexi-Cap Funds";
                reasonText = String.format("Selected for long-term compounding (%d yrs). Long horizons absorb market cycles and deliver max inflation-beating returns.", goal.getHorizonYears());
                taxText = "₹1.25 Lakh annual LTCG tax-free threshold";
                riskProfileText = "High Growth / High Equity Compounding";
                expectedAnnualReturn = 0.13;
            }

            item.setSuggestedAssetClass(assetClass);

            int months = goal.getHorizonYears() * 12;
            double monthlyRate = expectedAnnualReturn / 12.0;
            double requiredSIP = (inflationAdjusted * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
            item.setRequiredMonthlySip(Math.round(requiredSIP));

            goalItems.add(item);

            AssetRecommendationReason reason = new AssetRecommendationReason();
            reason.setAssetClass(assetClass);
            reason.setGoalType(goal.getType());
            reason.setHorizonLabel(goal.getHorizonYears() + " Years");
            reason.setReasoning(reasonText);
            reason.setTaxAdvantage(taxText);
            reason.setRiskProfile(riskProfileText);
            assetReasons.add(reason);
        }

        response.setGoalExecutionPlan(goalItems);
        response.setAssetRecommendations(assetReasons);

        // ── NET WORTH TRAJECTORY SIMULATION WITH EXPLICIT GOAL DIPS ─────────
        List<NetWorthYearPoint> trajectory = new ArrayList<>();
        double currentAssets = netWorth.getTotalCurrentAssets();
        double currentLiabilities = netWorth.getTotalLiabilities();

        double annualInvestCapacity = surplus * 12.0;
        double expectedRate = (targetEquity * 0.13 + targetDebt * 0.07 + targetGold * 0.09) / 100.0;
        double pessimisticRate = expectedRate - 0.035;
        double optimisticRate = expectedRate + 0.035;

        double expectedAssets = currentAssets;
        double pessimisticAssets = currentAssets;
        double optimisticAssets = currentAssets;

        for (int y = 0; y <= yearsToRetire; y++) {
            int currentPointAge = age + y;
            int currentPointYear = 2026 + y;
            double paydownLiabilities = Math.max(0, currentLiabilities - (cashflow.getMonthlyEmis() * 12.0 * y));

            // Check if any goal matures in this year
            double goalOutflowInYear = 0.0;
            List<String> outflowNames = new ArrayList<>();
            for (FinancialGoalItem g : goals) {
                if (g.getHorizonYears() == y) {
                    double infAdjustedGoal = g.getTargetAmount() * Math.pow(1.06, g.getHorizonYears());
                    goalOutflowInYear += infAdjustedGoal;
                    outflowNames.add(g.getType());
                }
            }

            if (y == 0) {
                NetWorthYearPoint pt = new NetWorthYearPoint();
                pt.setAge(currentPointAge);
                pt.setYear(currentPointYear);
                pt.setAgeLabel("Age " + currentPointAge);
                pt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                pt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                pt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));
                pt.setGoalDip(false);
                trajectory.add(pt);
            } else {
                // Compound assets for the year
                expectedAssets = (expectedAssets + annualInvestCapacity) * (1 + expectedRate);
                pessimisticAssets = (pessimisticAssets + annualInvestCapacity) * (1 + pessimisticRate);
                optimisticAssets = (optimisticAssets + annualInvestCapacity) * (1 + optimisticRate);

                if (goalOutflowInYear > 0) {
                    // 1. Record PRE-GOAL PEAK POINT
                    NetWorthYearPoint prePt = new NetWorthYearPoint();
                    prePt.setAge(currentPointAge);
                    prePt.setYear(currentPointYear);
                    prePt.setAgeLabel("Age " + currentPointAge + " (Pre-Goal)");
                    prePt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                    prePt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                    prePt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));
                    prePt.setGoalDip(false);
                    trajectory.add(prePt);

                    // Deduct goal capital outflow
                    expectedAssets = Math.max(0, expectedAssets - goalOutflowInYear);
                    pessimisticAssets = Math.max(0, pessimisticAssets - goalOutflowInYear);
                    optimisticAssets = Math.max(0, optimisticAssets - goalOutflowInYear);

                    // 2. Record POST-GOAL DIP POINT (GRAPH VISIBLY PLUNGES DOWN HERE!)
                    NetWorthYearPoint dipPt = new NetWorthYearPoint();
                    dipPt.setAge(currentPointAge);
                    dipPt.setYear(currentPointYear);
                    String goalTitle = String.join(", ", outflowNames);
                    dipPt.setAgeLabel("Age " + currentPointAge + " (" + goalTitle + " Outflow)");
                    dipPt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                    dipPt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                    dipPt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));
                    dipPt.setGoalDip(true);
                    dipPt.setGoalDipName(goalTitle);
                    dipPt.setGoalOutflowAmount(Math.round(goalOutflowInYear));
                    trajectory.add(dipPt);
                } else {
                    NetWorthYearPoint pt = new NetWorthYearPoint();
                    pt.setAge(currentPointAge);
                    pt.setYear(currentPointYear);
                    pt.setAgeLabel("Age " + currentPointAge);
                    pt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                    pt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                    pt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));
                    pt.setGoalDip(false);
                    trajectory.add(pt);
                }
            }
        }

        response.setNetWorthTrajectory(trajectory);
        response.setProjectedRetirementNetWorth(trajectory.isEmpty() ? 0 : trajectory.get(trajectory.size() - 1).getExpectedNetWorth());

        // ── LAYER 3: NARRATIVE INSIGHTS & REBALANCE STEPS ───────────────────
        List<String> insights = new ArrayList<>();
        List<String> rebalance = new ArrayList<>();

        if (emergencyNeeded > 0) {
            insights.add(String.format("Emergency Buffer Missing: Allocate ₹%.0f to High-Yield Liquid FDs to cover 6 months of living expenses.", emergencyNeeded));
            rebalance.add(String.format("Park ₹%.0f in 1-Year Bank FD as Emergency Cash Buffer.", emergencyNeeded));
        }

        if (netWorth.isHasHighInterestDebt()) {
            insights.add("High Interest Debt Alert: Pay off credit card / personal loan debt immediately before investing in equities.");
            rebalance.add("Allocate 50% of monthly surplus to pre-paying high-interest credit card debt.");
        }

        if (cashflow.getTaxBracketPercent() >= 30) {
            insights.add("Tax Slab Optimization (30% Bracket): Recommending Arbitrage Funds over FDs for short-term goals to save ~10% in taxes.");
        }

        if (Math.abs(currentAlloc.getEquityPercent() - targetEquity) > 5.0) {
            if (currentAlloc.getEquityPercent() < targetEquity) {
                rebalance.add(String.format("Increase Equity weight from %.0f%% to %.0f%% by directing monthly surplus into Nifty 50 Index Funds.", currentAlloc.getEquityPercent(), targetEquity));
            } else {
                rebalance.add(String.format("Equity is over-weight at %.0f%% (Target: %.0f%%). Rebalance profits into Sovereign Gold & Debt FDs.", currentAlloc.getEquityPercent(), targetEquity));
            }
        }

        if (rebalance.isEmpty()) {
            rebalance.add("Your portfolio is well-aligned! Continue your monthly SIP allocations.");
        }

        response.setAiInsights(insights);
        response.setRebalanceActions(rebalance);

        return response;
    }

    public void saveUserProfile(UUID userId, UserProfilePayload payload) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            try {
                user.setProfileMetadata(objectMapper.writeValueAsString(payload));
                if (payload.getRiskAndInsurance() != null) {
                    user.setRiskTolerance(payload.getRiskAndInsurance().getRiskAppetite());
                }
                userRepository.save(user);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public UserProfilePayload getUserProfile(UUID userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getProfileMetadata() != null) {
            try {
                return objectMapper.readValue(userOpt.get().getProfileMetadata(), UserProfilePayload.class);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return null;
    }
}
