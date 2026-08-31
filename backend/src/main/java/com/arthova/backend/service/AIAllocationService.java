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
        currentAlloc.setCashPercent(netWorth.getAssetBreakdownPercent().getRealEstate()); // Property/Cash balance
        response.setCurrentAllocation(currentAlloc);

        // ── LAYER 2: ASSET ALLOCATION & GOAL SOLVER ───────────────────────────
        int age = demo.getAge() > 0 ? demo.getAge() : 28;
        int retirementAge = demo.getTargetRetirementAge() > age ? demo.getTargetRetirementAge() : 55;
        response.setRetirementAge(retirementAge);

        // Risk-adjusted equity target rule of thumb
        double targetEquity = 100.0 - age;
        if ("High".equalsIgnoreCase(riskIns.getRiskAppetite())) {
            targetEquity += 10.0;
        } else if ("Low".equalsIgnoreCase(riskIns.getRiskAppetite())) {
            targetEquity -= 15.0;
        }
        // Clamp Equity between 20% and 80%
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

        // Goal Execution Plan
        List<GoalExecutionPlanItem> goalItems = new ArrayList<>();
        for (FinancialGoalItem goal : goals) {
            GoalExecutionPlanItem item = new GoalExecutionPlanItem();
            item.setGoal(goal.getType());
            item.setOriginalTarget(goal.getTargetAmount());
            item.setHorizonYears(goal.getHorizonYears());

            // 6% inflation adjustment
            double inflationAdjusted = goal.getTargetAmount() * Math.pow(1.06, goal.getHorizonYears());
            item.setInflationAdjustedTarget(Math.round(inflationAdjusted));

            String assetClass;
            double expectedAnnualReturn;

            if (goal.getHorizonYears() <= 3) {
                assetClass = cashflow.getTaxBracketPercent() >= 30
                        ? "Arbitrage Mutual Funds (Equity Tax Slab)"
                        : "Short-Term Fixed Deposits";
                expectedAnnualReturn = 0.07;
            } else if (goal.getHorizonYears() <= 7) {
                assetClass = "Balanced Advantage Funds";
                expectedAnnualReturn = 0.10;
            } else {
                assetClass = "Nifty 50 Index & Flexi-Cap Funds";
                expectedAnnualReturn = 0.13;
            }
            item.setSuggestedAssetClass(assetClass);

            int months = goal.getHorizonYears() * 12;
            double monthlyRate = expectedAnnualReturn / 12.0;
            double requiredSIP = (inflationAdjusted * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
            item.setRequiredMonthlySip(Math.round(requiredSIP));

            goalItems.add(item);
        }
        response.setGoalExecutionPlan(goalItems);

        // Net Worth Trajectory Simulation (Retirement Year Engine)
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

        for (int y = 0; y <= totalYears; y += 3) {
            NetWorthYearPoint pt = new NetWorthYearPoint();
            pt.setAge(age + y);
            pt.setYear(2026 + y);

            if (y == 0) {
                pt.setExpectedNetWorth(Math.round(currentAssets - currentLiabilities));
                pt.setPessimisticNetWorth(Math.round(currentAssets - currentLiabilities));
                pt.setOptimisticNetWorth(Math.round(currentAssets - currentLiabilities));
            } else {
                for (int i = 0; i < 3; i++) {
                    expectedAssets = (expectedAssets + annualInvestCapacity) * (1 + expectedRate);
                    pessimisticAssets = (pessimisticAssets + annualInvestCapacity) * (1 + pessimisticRate);
                    optimisticAssets = (optimisticAssets + annualInvestCapacity) * (1 + optimisticRate);
                }
                double paydownLiabilities = Math.max(0, currentLiabilities - (cashflow.getMonthlyEmis() * 12 * y));
                pt.setExpectedNetWorth(Math.round(expectedAssets - paydownLiabilities));
                pt.setPessimisticNetWorth(Math.round(pessimisticAssets - paydownLiabilities));
                pt.setOptimisticNetWorth(Math.round(optimisticAssets - paydownLiabilities));
            }
            trajectory.add(pt);
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
            insights.add("Tax Slab Optimization (30% Bracket): Recommending Arbitrage Funds over FDs for short-term goals to save 10% in taxes.");
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
}
