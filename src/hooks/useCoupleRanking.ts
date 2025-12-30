import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "./useUserSettings";

export interface MonthlyXP {
  id: string;
  user_id: string;
  person_name: string;
  month: number;
  year: number;
  xp_earned: number;
  achievements_count: number;
  challenges_completed: number;
}

export function useCoupleRanking() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: monthlyXpData = [], isLoading } = useQuery({
    queryKey: ["monthly-xp", user?.id, currentMonth, currentYear],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("monthly_xp")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      return data as MonthlyXP[];
    },
    enabled: !!user?.id,
  });

  const updateMonthlyXpMutation = useMutation({
    mutationFn: async ({
      personName,
      xpToAdd,
      achievementUnlocked,
      challengeCompleted,
    }: {
      personName: "person1" | "person2";
      xpToAdd?: number;
      achievementUnlocked?: boolean;
      challengeCompleted?: boolean;
    }) => {
      if (!user?.id) return;

      // Find existing record for this month
      const existing = monthlyXpData.find(
        (m) =>
          m.person_name === personName &&
          m.month === currentMonth &&
          m.year === currentYear
      );

      if (existing) {
        const updates: Partial<MonthlyXP> = {};
        if (xpToAdd) updates.xp_earned = existing.xp_earned + xpToAdd;
        if (achievementUnlocked)
          updates.achievements_count = existing.achievements_count + 1;
        if (challengeCompleted)
          updates.challenges_completed = existing.challenges_completed + 1;

        const { error } = await supabase
          .from("monthly_xp")
          .update(updates)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("monthly_xp").insert({
          user_id: user.id,
          person_name: personName,
          month: currentMonth,
          year: currentYear,
          xp_earned: xpToAdd || 0,
          achievements_count: achievementUnlocked ? 1 : 0,
          challenges_completed: challengeCompleted ? 1 : 0,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-xp"] });
    },
  });

  // Get current month data
  const currentMonthData = {
    person1: monthlyXpData.find(
      (m) =>
        m.person_name === "person1" &&
        m.month === currentMonth &&
        m.year === currentYear
    ) || {
      xp_earned: 0,
      achievements_count: 0,
      challenges_completed: 0,
    },
    person2: monthlyXpData.find(
      (m) =>
        m.person_name === "person2" &&
        m.month === currentMonth &&
        m.year === currentYear
    ) || {
      xp_earned: 0,
      achievements_count: 0,
      challenges_completed: 0,
    },
  };

  // Calculate historical wins
  const getHistoricalWins = () => {
    const wins = { person1: 0, person2: 0, ties: 0 };
    const monthsProcessed = new Set<string>();

    monthlyXpData.forEach((entry) => {
      const key = `${entry.year}-${entry.month}`;
      if (monthsProcessed.has(key)) return;

      const person1Data = monthlyXpData.find(
        (m) =>
          m.person_name === "person1" &&
          m.month === entry.month &&
          m.year === entry.year
      );
      const person2Data = monthlyXpData.find(
        (m) =>
          m.person_name === "person2" &&
          m.month === entry.month &&
          m.year === entry.year
      );

      const p1Xp = person1Data?.xp_earned || 0;
      const p2Xp = person2Data?.xp_earned || 0;

      if (p1Xp > p2Xp) wins.person1++;
      else if (p2Xp > p1Xp) wins.person2++;
      else if (p1Xp > 0 && p2Xp > 0) wins.ties++;

      monthsProcessed.add(key);
    });

    return wins;
  };

  const historicalWins = getHistoricalWins();

  // Determine current month leader
  const getCurrentLeader = (): "person1" | "person2" | "tie" => {
    const p1 = currentMonthData.person1.xp_earned;
    const p2 = currentMonthData.person2.xp_earned;
    if (p1 > p2) return "person1";
    if (p2 > p1) return "person2";
    return "tie";
  };

  return {
    monthlyXpData,
    currentMonthData,
    historicalWins,
    currentLeader: getCurrentLeader(),
    isLoading,
    updateMonthlyXp: updateMonthlyXpMutation.mutateAsync,
    person1Name: settings?.person_1_name || "Pessoa 1",
    person2Name: settings?.person_2_name || "Pessoa 2",
  };
}
