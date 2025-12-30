import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification, calculateLevel } from "./useGamification";
import { useChallenges } from "./useChallenges";
import { useCoupleRanking } from "./useCoupleRanking";
import { toast } from "@/hooks/use-toast";
import {
  celebrateAchievement,
  celebrateLevelUp,
  celebrateChallenge,
  celebrateGoalCompleted,
} from "@/lib/celebrations";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

interface GamificationEventParams {
  actionType:
    | "transaction_created"
    | "goal_created"
    | "goal_completed"
    | "deposit_made"
    | "login";
  personName?: "person1" | "person2";
  metadata?: Record<string, any>;
}

export function useGamificationEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    gamification,
    achievements,
    userAchievements,
    unlockedAchievementIds,
    addXp,
  } = useGamification();
  const { challenges, userChallenges, updateProgress } = useChallenges();
  const { updateMonthlyXp } = useCoupleRanking();

  // Check and unlock achievements based on current data
  const checkAchievements = useCallback(
    async (actionType: string, metadata?: Record<string, any>) => {
      if (!user?.id || !gamification) return;

      // Get current stats for achievement checks
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id, type, category, date")
        .order("date", { ascending: false });

      const { data: goals } = await supabase
        .from("savings_goals")
        .select("id, current_amount, target_amount");

      const transactionsCount = transactions?.length || 0;
      const goalsCount = goals?.length || 0;
      const completedGoals =
        goals?.filter((g) => g.current_amount >= g.target_amount).length || 0;

      // Calculate total saved
      const totalSaved =
        goals?.reduce((sum, g) => sum + (g.current_amount || 0), 0) || 0;
      const totalSavedReais = totalSaved / 100; // Convert from cents

      // Check each achievement
      for (const achievement of achievements) {
        if (unlockedAchievementIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.requirement_type) {
          case "transactions_count":
            shouldUnlock = transactionsCount >= achievement.requirement_value;
            break;
          case "goals_count":
            shouldUnlock = goalsCount >= achievement.requirement_value;
            break;
          case "goals_completed":
            shouldUnlock = completedGoals >= achievement.requirement_value;
            break;
          case "total_saved":
            shouldUnlock = totalSavedReais >= achievement.requirement_value;
            break;
          case "streak_days":
            shouldUnlock =
              (gamification.current_streak || 0) >= achievement.requirement_value;
            break;
        }

        if (shouldUnlock) {
          await unlockAchievement(achievement.id, achievement);
        }
      }
    },
    [user?.id, gamification, achievements, unlockedAchievementIds]
  );

  // Unlock a specific achievement
  const unlockAchievement = useCallback(
    async (achievementId: string, achievement: any) => {
      if (!user?.id) return;

      // Check if already unlocked
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement_id", achievementId)
        .maybeSingle();

      if (existing) return;

      // Insert the unlock record
      const { error } = await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievementId,
      });

      if (error) {
        console.error("Error unlocking achievement:", error);
        return;
      }

      // Add XP
      const currentXp = gamification?.xp || 0;
      const newXp = currentXp + achievement.xp_reward;
      const oldLevel = calculateLevel(currentXp);
      const newLevel = calculateLevel(newXp);

      await supabase
        .from("user_gamification")
        .update({ xp: newXp, level: newLevel })
        .eq("user_id", user.id);

      // Celebrate!
      celebrateAchievement();

      toast({
        title: `🏆 Conquista Desbloqueada!`,
        description: `${achievement.icon} ${achievement.name} - +${achievement.xp_reward} XP`,
      });

      // Check for level up
      if (newLevel > oldLevel) {
        setTimeout(() => {
          celebrateLevelUp();
          toast({
            title: `🎉 Subiu de Nível!`,
            description: `Você alcançou o nível ${newLevel}!`,
          });
        }, 1500);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
    },
    [user?.id, gamification, queryClient]
  );

  // Update challenge progress
  const updateChallengeProgress = useCallback(
    async (actionType: string, personName?: "person1" | "person2") => {
      if (!user?.id || !challenges.length) return;

      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(today), "yyyy-MM-dd");

      for (const challenge of challenges) {
        const periodStart =
          challenge.type === "weekly" ? weekStart : monthStart;

        const userChallenge = userChallenges.find(
          (uc) =>
            uc.challenge_id === challenge.id && uc.period_start === periodStart
        );

        if (!userChallenge || userChallenge.completed) continue;

        let shouldIncrement = false;
        let incrementAmount = 1;

        switch (challenge.requirement_type) {
          case "daily_transactions":
            if (actionType === "transaction_created") {
              shouldIncrement = true;
            }
            break;
          case "goal_deposits":
            if (actionType === "deposit_made") {
              shouldIncrement = true;
            }
            break;
        }

        if (shouldIncrement) {
          const newProgress = userChallenge.progress + incrementAmount;
          const wasCompleted = userChallenge.completed;
          const isNowCompleted = newProgress >= challenge.requirement_value;

          await supabase
            .from("user_challenges")
            .update({
              progress: newProgress,
              completed: isNowCompleted,
              completed_at: isNowCompleted ? new Date().toISOString() : null,
            })
            .eq("id", userChallenge.id);

          // If just completed, celebrate and add XP
          if (!wasCompleted && isNowCompleted) {
            celebrateChallenge();

            toast({
              title: `🎯 Desafio Concluído!`,
              description: `${challenge.icon} ${challenge.name} - +${challenge.xp_reward} XP`,
            });

            // Add XP
            const currentXp = gamification?.xp || 0;
            const newXp = currentXp + challenge.xp_reward;
            const newLevel = calculateLevel(newXp);

            await supabase
              .from("user_gamification")
              .update({ xp: newXp, level: newLevel })
              .eq("user_id", user.id);

            // Update monthly XP for ranking
            if (personName) {
              await updateMonthlyXp({
                personName,
                xpToAdd: challenge.xp_reward,
                challengeCompleted: true,
              });
            }

            queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
          }

          queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
        }
      }
    },
    [user?.id, challenges, userChallenges, gamification, updateMonthlyXp, queryClient]
  );

  // Update streak on activity
  const updateStreak = useCallback(async () => {
    if (!user?.id || !gamification) return;

    const today = new Date().toISOString().split("T")[0];
    const lastActivity = gamification.last_activity_date;

    if (lastActivity === today) return; // Already updated today

    let newStreak = gamification.current_streak;
    let longestStreak = gamification.longest_streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastActivity === yesterdayStr) {
      // Continue streak
      newStreak += 1;
    } else if (lastActivity && gamification.streak_freeze_available) {
      // Check if we can use streak freeze
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

      if (lastActivity === twoDaysAgoStr) {
        // Use streak freeze
        newStreak += 1;
        await supabase
          .from("user_gamification")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, longestStreak),
            last_activity_date: today,
            streak_freeze_available: false,
            streak_freeze_used_at: today,
          })
          .eq("user_id", user.id);

        toast({
          title: "🧊 Streak Freeze Usado!",
          description: "Sua sequência foi preservada!",
        });

        queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
        return;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    longestStreak = Math.max(newStreak, longestStreak);

    await supabase
      .from("user_gamification")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
      })
      .eq("user_id", user.id);

    queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
  }, [user?.id, gamification, queryClient]);

  // Main event handler
  const triggerGamificationEvent = useCallback(
    async ({ actionType, personName, metadata }: GamificationEventParams) => {
      if (!user?.id) return;

      // Update streak on any activity
      await updateStreak();

      // Check achievements
      await checkAchievements(actionType, metadata);

      // Update challenge progress
      await updateChallengeProgress(actionType, personName);

      // Special handling for goal completion
      if (actionType === "goal_completed") {
        celebrateGoalCompleted();
        toast({
          title: "🎉 Meta Alcançada!",
          description: "Parabéns! Você atingiu sua meta de economia!",
        });
      }

      // Add base XP for actions
      let baseXp = 0;
      switch (actionType) {
        case "transaction_created":
          baseXp = 5;
          break;
        case "deposit_made":
          baseXp = 10;
          break;
        case "goal_created":
          baseXp = 15;
          break;
        case "goal_completed":
          baseXp = 50;
          break;
      }

      if (baseXp > 0 && personName) {
        await updateMonthlyXp({
          personName,
          xpToAdd: baseXp,
        });
      }
    },
    [user?.id, updateStreak, checkAchievements, updateChallengeProgress, updateMonthlyXp]
  );

  return {
    triggerGamificationEvent,
    checkAchievements,
    updateStreak,
  };
}
