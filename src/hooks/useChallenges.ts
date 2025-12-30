import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export interface Challenge {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "weekly" | "monthly";
  xp_reward: number;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  period_start: string;
  period_end: string;
  challenge?: Challenge;
}

export function useChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: isLoadingChallenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("type", { ascending: true });

      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user?.id,
  });

  const { data: userChallenges = [], isLoading: isLoadingUserChallenges } = useQuery({
    queryKey: ["user-challenges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(today), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("user_challenges")
        .select("*, challenge:challenges(*)")
        .eq("user_id", user.id)
        .or(`period_start.eq.${weekStart},period_start.eq.${monthStart}`);

      if (error) throw error;
      return data as (UserChallenge & { challenge: Challenge })[];
    },
    enabled: !!user?.id,
  });

  const initializeChallengesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

      const existingPeriods = new Set(
        userChallenges.map((uc) => `${uc.challenge_id}-${uc.period_start}`)
      );

      const newChallenges: Omit<UserChallenge, "id" | "challenge">[] = [];

      for (const challenge of challenges) {
        const periodStart = challenge.type === "weekly" ? weekStart : monthStart;
        const periodEnd = challenge.type === "weekly" ? weekEnd : monthEnd;
        const key = `${challenge.id}-${periodStart}`;

        if (!existingPeriods.has(key)) {
          newChallenges.push({
            user_id: user.id,
            challenge_id: challenge.id,
            progress: 0,
            completed: false,
            completed_at: null,
            period_start: periodStart,
            period_end: periodEnd,
          });
        }
      }

      if (newChallenges.length > 0) {
        const { error } = await supabase
          .from("user_challenges")
          .insert(newChallenges);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      challengeId,
      progress,
    }: {
      challengeId: string;
      progress: number;
    }) => {
      if (!user?.id) return;

      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) return;

      const today = new Date();
      const periodStart =
        challenge.type === "weekly"
          ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
          : format(startOfMonth(today), "yyyy-MM-dd");

      const userChallenge = userChallenges.find(
        (uc) =>
          uc.challenge_id === challengeId && uc.period_start === periodStart
      );

      if (!userChallenge) return;

      const completed = progress >= challenge.requirement_value;

      const { error } = await supabase
        .from("user_challenges")
        .update({
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", userChallenge.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
    },
  });

  const weeklyChallenges = userChallenges.filter(
    (uc) => uc.challenge?.type === "weekly"
  );
  const monthlyChallenges = userChallenges.filter(
    (uc) => uc.challenge?.type === "monthly"
  );

  return {
    challenges,
    userChallenges,
    weeklyChallenges,
    monthlyChallenges,
    isLoading: isLoadingChallenges || isLoadingUserChallenges,
    initializeChallenges: initializeChallengesMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
  };
}
