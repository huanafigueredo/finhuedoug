import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePersonNames } from "./useUserSettings";

export interface MonthlyFinancialRanking {
  id: string;
  user_id: string;
  month: number;
  year: number;
  person1_expenses: number;
  person1_savings: number;
  person1_balance: number;
  person2_expenses: number;
  person2_savings: number;
  person2_balance: number;
  spending_winner: string | null;
  savings_winner: string | null;
  balance_winner: string | null;
  overall_winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveRankingInput {
  month: number;
  year: number;
  person1_expenses: number;
  person1_savings: number;
  person1_balance: number;
  person2_expenses: number;
  person2_savings: number;
  person2_balance: number;
}

export function useFinancialRankingHistory() {
  const queryClient = useQueryClient();
  const { person1, person2 } = usePersonNames();

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ["financial-ranking-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_financial_rankings")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as MonthlyFinancialRanking[];
    },
  });

  const saveRankingMutation = useMutation({
    mutationFn: async (input: SaveRankingInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Calculate winners
      const spendingWinner = input.person1_expenses < input.person2_expenses
        ? "person1"
        : input.person2_expenses < input.person1_expenses
          ? "person2"
          : "tie";

      const savingsWinner = input.person1_savings > input.person2_savings
        ? "person1"
        : input.person2_savings > input.person1_savings
          ? "person2"
          : "tie";

      const balanceWinner = input.person1_balance > input.person2_balance
        ? "person1"
        : input.person2_balance > input.person1_balance
          ? "person2"
          : "tie";

      const person1Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person1").length;
      const person2Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person2").length;
      const overallWinner = person1Wins > person2Wins
        ? "person1"
        : person2Wins > person1Wins
          ? "person2"
          : "tie";

      const { data, error } = await supabase
        .from("monthly_financial_rankings")
        .upsert({
          user_id: user.id,
          month: input.month,
          year: input.year,
          person1_expenses: input.person1_expenses,
          person1_savings: input.person1_savings,
          person1_balance: input.person1_balance,
          person2_expenses: input.person2_expenses,
          person2_savings: input.person2_savings,
          person2_balance: input.person2_balance,
          spending_winner: spendingWinner,
          savings_winner: savingsWinner,
          balance_winner: balanceWinner,
          overall_winner: overallWinner,
        } as any, {
          onConflict: "user_id,month,year",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-ranking-history"] });
    },
  });

  // Calculate historical wins
  const historicalWins = rankings.reduce(
    (acc, ranking) => {
      if (ranking.overall_winner === "person1") acc.person1++;
      else if (ranking.overall_winner === "person2") acc.person2++;
      else acc.ties++;
      return acc;
    },
    { person1: 0, person2: 0, ties: 0 }
  );

  // Get previous month ranking for comparison
  const getPreviousRanking = (currentMonth: number, currentYear: number) => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return rankings.find(r => r.month === prevMonth && r.year === prevYear);
  };

  return {
    rankings,
    isLoading,
    saveRanking: saveRankingMutation.mutate,
    saveRankingAsync: saveRankingMutation.mutateAsync,
    historicalWins,
    getPreviousRanking,
    person1Name: person1,
    person2Name: person2,
  };
}
