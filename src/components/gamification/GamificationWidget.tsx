import { Link } from "react-router-dom";
import { ArrowUpRight, Trophy } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { XPProgressBar } from "./XPProgressBar";
import { StreakCounter } from "./StreakCounter";
import { Skeleton } from "@/components/ui/skeleton";

export function GamificationWidget() {
  const {
    gamification,
    userAchievements,
    achievements,
    xpProgress,
    isLoading,
  } = useGamification();

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    );
  }

  if (!gamification || !xpProgress) return null;

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <Link
      to="/gamificacao"
      className="block p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group animate-fade-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Gamificação</span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* XP Progress */}
      <XPProgressBar
        level={gamification.level}
        currentXp={gamification.xp}
        percentage={xpProgress.percentage}
        nextLevelXp={xpProgress.nextLevelXp}
        compact
      />

      {/* Stats row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <StreakCounter
          currentStreak={gamification.current_streak}
          longestStreak={gamification.longest_streak}
          streakFreezeAvailable={gamification.streak_freeze_available}
          compact
        />

        <div className="flex items-center gap-1.5">
          <span className="text-lg">🏆</span>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
