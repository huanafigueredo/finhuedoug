import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserGamification {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_available: boolean;
  streak_freeze_used_at: string | null;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: "spending" | "saving" | "revenue" | "consistency";
  xp_reward: number;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  if (xp >= 4000) return 8;
  if (xp >= 2500) return 7;
  if (xp >= 1500) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

// Get XP required for next level
export function getXpForNextLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, Infinity];
  return thresholds[level] || Infinity;
}

// Get level name
export function getLevelName(level: number): string {
  const names = [
    "",
    "Iniciante Financeiro",
    "Organizador",
    "Planejador",
    "Economista",
    "Investidor",
    "Estrategista",
    "Mestre Financeiro",
    "Guru Financeiro",
  ];
  return names[level] || "Guru Financeiro";
}

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: gamification, isLoading: isLoadingGamification } = useQuery({
    queryKey: ["user-gamification", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no record exists, create one
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("user_gamification")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as UserGamification;
      }

      return data as UserGamification;
    },
    enabled: !!user?.id,
  });

  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!user?.id,
  });

  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
    enabled: !!user?.id,
  });

  const addXpMutation = useMutation({
    mutationFn: async (xpToAdd: number) => {
      if (!user?.id || !gamification) return;

      const newXp = gamification.xp + xpToAdd;
      const newLevel = calculateLevel(newXp);

      const { error } = await supabase
        .from("user_gamification")
        .update({
          xp: newXp,
          level: newLevel,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      return { newXp, newLevel };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
    },
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) return;

      // Check if already unlocked
      const existing = userAchievements.find(
        (ua) => ua.achievement_id === achievementId
      );
      if (existing) return null;

      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select("*, achievement:achievements(*)")
        .single();

      if (error) throw error;

      // Add XP from achievement
      const achievement = achievements.find((a) => a.id === achievementId);
      if (achievement) {
        await addXpMutation.mutateAsync(achievement.xp_reward);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
    },
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !gamification) return;

      const today = new Date().toISOString().split("T")[0];
      const lastActivity = gamification.last_activity_date;

      let newStreak = gamification.current_streak;
      let longestStreak = gamification.longest_streak;

      if (lastActivity === today) {
        // Already updated today
        return gamification;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActivity === yesterdayStr) {
        // Continue streak
        newStreak += 1;
      } else if (lastActivity && gamification.streak_freeze_available) {
        // Check if we can use streak freeze (missed only 1 day)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

        if (lastActivity === twoDaysAgoStr) {
          // Use streak freeze
          newStreak += 1;
          const { error } = await supabase
            .from("user_gamification")
            .update({
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, longestStreak),
              last_activity_date: today,
              streak_freeze_available: false,
              streak_freeze_used_at: today,
            })
            .eq("user_id", user.id);

          if (error) throw error;
          return;
        } else {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // No previous activity or streak broken
        newStreak = 1;
      }

      longestStreak = Math.max(newStreak, longestStreak);

      const { error } = await supabase
        .from("user_gamification")
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
    },
  });

  const unlockedAchievementIds = new Set(
    userAchievements.map((ua) => ua.achievement_id)
  );

  const xpProgress = gamification
    ? {
        current: gamification.xp,
        currentLevelXp: getXpForNextLevel(gamification.level - 1),
        nextLevelXp: getXpForNextLevel(gamification.level),
        percentage:
          gamification.level >= 8
            ? 100
            : ((gamification.xp - getXpForNextLevel(gamification.level - 1)) /
                (getXpForNextLevel(gamification.level) -
                  getXpForNextLevel(gamification.level - 1))) *
              100,
      }
    : null;

  return {
    gamification,
    achievements,
    userAchievements,
    unlockedAchievementIds,
    xpProgress,
    isLoading:
      isLoadingGamification || isLoadingAchievements || isLoadingUserAchievements,
    addXp: addXpMutation.mutateAsync,
    unlockAchievement: unlockAchievementMutation.mutateAsync,
    updateStreak: updateStreakMutation.mutateAsync,
    getLevelName,
    calculateLevel,
  };
}
