package com.arthova.backend.service;

import com.arthova.backend.dto.AIAllocationDTO.*;
import com.arthova.backend.entity.User;
import com.arthova.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

        // Goal Execution Plan & Why Recommended Explanations
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
                reasonText = String.format("Selected for a medium-term horizon (%d yrs) to capture equity upside while dynamically hedging market downturns.", goal.getHorizonYears());
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

            // Asset Recommendation Reason
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

        // ── NET WORTH TRAJECTORY SIMULATION WITH REALISTIC GOAL DIPS ─────────────
        List<NetWorthYearPoint> trajectory = new ArrayList<>();
        int totalYears = retirementAge - age;
        double currentAssets = netWorth.getTotalCurrentAssets();
        double currentLiabilities = netWorth.getTotalLiabilities();

        double annualInvestCapacity = surplus * 12.0;
        double expectedRate = (targetEquity * 0.13 + targetDebt * 0.07 + targetGold * 0.09) / 100.0;
        double pessimisticRate = expectedRate - 0.035;
        double optimisticRate = expectedRate + 0.035;

        double expectedAssets = currentAssets;
        double pessimisticAssets = currentAssets;
        double optimisticAssets = currentAssets;

        for (int y = 0; y <= totalYears; y++) {
            // Check if any goal matures in this exact year
            double goalOutflowInYear = 0.0;
            List<String> outflowNames = new ArrayList<>();

            for (FinancialGoalItem g : goals) {
                if (g.getHorizonYears() == y) {
                    double infAdjustedGoal = g.getTargetAmount() * Math.pow(1.06, g.getHorizonYears());
                    goalOutflowInYear += infAdjustedGoal;
                    outflowNames.add(g.getType());
                }
            }

            if (y > 0) {
                // Compound assets for 1 year
                expectedAssets = (expectedAssets + annualInvestCapacity) * (1 + expectedRate);
                pessimisticAssets = (pessimisticAssets + annualInvestCapacity) * (1 + pessimisticRate);
                optimisticAssets = (optimisticAssets + annualInvestCapacity) * (1 + optimisticRate);

                // DEDUCT GOAL OUTFLOW (REALISTIC GOAL DIP!)
                if (goalOutflowInYear > 0) {
                    expectedAssets = Math.max(0, expectedAssets - goalOutflowInYear);
                    pessimisticAssets = Math.max(0, pessimisticAssets - goalOutflowInYear);
                    optimisticAssets = Math.max(0, optimisticAssets - goalOutflowInYear);
                }
            }

            // Only add data points every 2 or 3 years or when a goal outflow occurs
            if (y == 0 || y % 3 == 0 || y == totalYears || goalOutflowInYear > 0) {
                NetWorthYearPoint pt = new NetWorthYearPoint();
                pt.setAge(age + y);
                pt.setYear(2026 + y);

                double paydownLiabilities = Math.max(0, currentLiabilities - (cashflow.getMonthlyEmis() * 12 * y));

                pt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                pt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                pt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));

                if (goalOutflowInYear > 0) {
                    pt.setGoalDipName(String.join(", ", outflowNames));
                    pt.setGoalOutflowAmount(Math.round(goalOutflowInYear));
                }

                trajectory.add(pt);
            }
        }

        response.setNetWorthTrajectory(trajectory);
        response.setProjectedRetirementNetWorth(trajectory.isEmpty() ? 0 : trajectory.get(trajectory.size() - 1).getExpectedNetWorth());

        // ── LAYER 3: NARRATIVE INSIGHTS & REBALANCE STEPS ───────────────────────
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
