package com.arthova.backend.dto;

import lombok.Data;
import java.util.List;

public class AIAllocationDTO {

    @Data
    public static class UserDemographics {
        private int age = 28;
        private int targetRetirementAge = 55;
        private String maritalStatus = "married";
        private int childrenCount = 1;
        private boolean dependentParents = true;
    }

    @Data
    public static class FinancialCashflow {
        private double monthlyIncome = 120000;
        private double monthlyExpenses = 45000;
        private double monthlyEmis = 22000;
        private double taxBracketPercent = 30;
    }

    @Data
    public static class AssetBreakdownPercent {
        private double equity = 20;
        private double fdDebt = 60;
        private double gold = 10;
        private double realEstate = 10;
    }

    @Data
    public static class NetWorthBreakdown {
        private double totalCurrentAssets = 1000000;
        private AssetBreakdownPercent assetBreakdownPercent = new AssetBreakdownPercent();
        private double totalLiabilities = 1500000;
        private boolean hasHighInterestDebt = false;
    }

    @Data
    public static class RiskAndInsurance {
        private String riskAppetite = "Medium"; // Low, Medium, High
        private boolean hasHealthInsurance = true;
        private boolean hasLifeInsurance = true;
        private boolean hasEmergencyFund = false;
    }

    @Data
    public static class FinancialGoalItem {
        private String type;
        private double targetAmount;
        private int horizonYears;
    }

    @Data
    public static class UserProfilePayload {
        private UserDemographics userDemographics = new UserDemographics();
        private FinancialCashflow financialCashflow = new FinancialCashflow();
        private NetWorthBreakdown netWorthBreakdown = new NetWorthBreakdown();
        private RiskAndInsurance riskAndInsurance = new RiskAndInsurance();
        private List<FinancialGoalItem> financialGoals;
    }

    @Data
    public static class RecommendedAllocation {
        private double equityPercent;
        private double debtPercent;
        private double goldPercent;
        private double cashPercent;
    }

    @Data
    public static class GoalExecutionPlanItem {
        private String goal;
        private double originalTarget;
        private double inflationAdjustedTarget;
        private int horizonYears;
        private String suggestedAssetClass;
        private double requiredMonthlySip;
    }

    @Data
    public static class NetWorthYearPoint {
        private int age;
        private int year;
        private String ageLabel;
        private double expectedNetWorth;
        private double pessimisticNetWorth;
        private double optimisticNetWorth;
        private boolean isGoalDip;
        private String goalDipName;
        private double goalOutflowAmount;
    }

    @Data
    public static class AssetClassRecommendation {
        private String assetClass;
        private double recommendedPercent;
        private String whyRecommended;
        private List<String> topInstruments;
        private String expectedReturn;
        private String riskLevel;
        private String taxRule;
    }

    @Data
    public static class AssetRecommendationReason {
        private String assetClass;
        private String goalType;
        private String horizonLabel;
        private String reasoning;
        private String taxAdvantage;
        private String riskProfile;
    }

    @Data
    public static class AIRecommendationResponse {
        private double netMonthlySurplus;
        private double emergencyBufferNeeded;
        private RecommendedAllocation currentAllocation;
        private RecommendedAllocation recommendedAllocation;
        private List<GoalExecutionPlanItem> goalExecutionPlan;
        private List<NetWorthYearPoint> netWorthTrajectory;
        private List<AssetClassRecommendation> assetClassRecommendations;
        private List<AssetRecommendationReason> assetRecommendations;
        private double projectedRetirementNetWorth;
        private int retirementAge;
        private List<String> aiInsights;
        private List<String> rebalanceActions;
    }
}
