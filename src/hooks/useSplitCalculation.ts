import { useCallback, useMemo } from "react";
import { useSplitSettings, SplitMode } from "./useSplitSettings";
import { useCoupleMembers } from "./useCoupleMembers";
import { useCategorySplits, getCategorySplit } from "./useCategorySplits";

export interface SplitResult {
  person1: number;
  person2: number;
  person1Percentage: number;
  person2Percentage: number;
  mode: SplitMode;
}

export function useSplitCalculation() {
  const { data: settings, isLoading: settingsLoading } = useSplitSettings();
  const { data: members = [], isLoading: membersLoading } = useCoupleMembers();
  const { data: categorySplits = [], isLoading: categorySplitsLoading } = useCategorySplits();

  const isLoading = settingsLoading || membersLoading || categorySplitsLoading;

  // Calculate global split (without category context)
  const calculateSplit = useCallback(
    (totalAmount: number): SplitResult => {
      const mode: SplitMode = settings?.mode || "50-50";

      // Proporcional mode - based on income
      if (mode === "proporcional") {
        const person1 = members.find((m) => m.position === 1);
        const person2 = members.find((m) => m.position === 2);
        
        const income1 = person1?.monthly_income_cents || 0;
        const income2 = person2?.monthly_income_cents || 0;
        const totalIncome = income1 + income2;

        // If no income set, fallback to 50-50
        if (totalIncome === 0) {
          return {
            person1: totalAmount / 2,
            person2: totalAmount / 2,
            person1Percentage: 50,
            person2Percentage: 50,
            mode,
          };
        }

        const p1Pct = (income1 / totalIncome) * 100;
        const p2Pct = (income2 / totalIncome) * 100;

        return {
          person1: totalAmount * (income1 / totalIncome),
          person2: totalAmount * (income2 / totalIncome),
          person1Percentage: Math.round(p1Pct),
          person2Percentage: Math.round(p2Pct),
          mode,
        };
      }

      // Personalizado mode - custom percentages
      if (mode === "personalizado" && settings) {
        const p1Pct = settings.person1_percentage;
        const p2Pct = settings.person2_percentage;

        return {
          person1: totalAmount * (p1Pct / 100),
          person2: totalAmount * (p2Pct / 100),
          person1Percentage: p1Pct,
          person2Percentage: p2Pct,
          mode,
        };
      }

      // Default: 50-50
      return {
        person1: totalAmount / 2,
        person2: totalAmount / 2,
        person1Percentage: 50,
        person2Percentage: 50,
        mode: "50-50",
      };
    },
    [settings, members]
  );

  // Calculate split with category context (uses category rules if available)
  // Now also accepts optional custom split percentages from the transaction itself
  const calculateSplitForTransaction = useCallback(
    (
      totalAmount: number,
      category?: string | null,
      subcategory?: string | null,
      customPerson1Percentage?: number | null,
      customPerson2Percentage?: number | null
    ): SplitResult => {
      // First check for transaction-level custom split
      if (customPerson1Percentage !== undefined && customPerson1Percentage !== null &&
          customPerson2Percentage !== undefined && customPerson2Percentage !== null) {
        return {
          person1: totalAmount * (customPerson1Percentage / 100),
          person2: totalAmount * (customPerson2Percentage / 100),
          person1Percentage: customPerson1Percentage,
          person2Percentage: customPerson2Percentage,
          mode: "personalizado",
        };
      }

      // Check for category-specific rule
      const categoryRule = getCategorySplit(categorySplits, category, subcategory);

      if (categoryRule) {
        const p1Pct = categoryRule.person1_percentage;
        const p2Pct = categoryRule.person2_percentage;

        return {
          person1: totalAmount * (p1Pct / 100),
          person2: totalAmount * (p2Pct / 100),
          person1Percentage: p1Pct,
          person2Percentage: p2Pct,
          mode: "personalizado", // Category rules are treated as custom
        };
      }

      // Fallback to global split
      return calculateSplit(totalAmount);
    },
    [categorySplits, calculateSplit]
  );

  const currentPercentages = useMemo(() => {
    return calculateSplit(100);
  }, [calculateSplit]);

  return {
    calculateSplit,
    calculateSplitForTransaction,
    settings,
    members,
    categorySplits,
    isLoading,
    currentPercentages,
    mode: settings?.mode || "50-50",
  };
}
