import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGamification, Achievement } from "@/hooks/useGamification";
import { useChallenges } from "@/hooks/useChallenges";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Flame, Medal } from "lucide-react";

export default function Gamification() {
  const {
    gamification,
    achievements,
    userAchievements,
    unlockedAchievementIds,
    xpProgress,
    isLoading: isLoadingGamification,
  } = useGamification();

  const {
    weeklyChallenges,
    monthlyChallenges,
    isLoading: isLoadingChallenges,
    initializeChallenges,
  } = useChallenges();

  // Initialize challenges on mount
  useEffect(() => {
    initializeChallenges();
  }, []);

  const isLoading = isLoadingGamification || isLoadingChallenges;

  // Group achievements by category
  const achievementsByCategory = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );

  const categoryInfo = {
    consistency: { label: "Consistência", icon: "🔄", color: "blue" },
    saving: { label: "Guardar Mais", icon: "💰", color: "green" },
    spending: { label: "Gastar Menos", icon: "📉", color: "pink" },
    revenue: { label: "Gerar Receita", icon: "💵", color: "amber" },
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-4xl py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!gamification || !xpProgress) {
    return (
      <AppLayout>
        <div className="container max-w-4xl py-6 text-center">
          <p className="text-muted-foreground">
            Erro ao carregar dados de gamificação.
          </p>
        </div>
      </AppLayout>
    );
  }

  const completedWeekly = weeklyChallenges.filter((c) => c.completed).length;
  const completedMonthly = monthlyChallenges.filter((c) => c.completed).length;

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 animate-fade-up">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gamificação</h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
        </div>

        {/* XP and Level Card */}
        <div
          className="p-6 rounded-3xl bg-card border border-border/50 shadow-card animate-fade-up"
          style={{ animationDelay: "50ms" }}
        >
          <XPProgressBar
            level={gamification.level}
            currentXp={gamification.xp}
            percentage={xpProgress.percentage}
            nextLevelXp={xpProgress.nextLevelXp}
          />
        </div>

        {/* Streak Card */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <StreakCounter
            currentStreak={gamification.current_streak}
            longestStreak={gamification.longest_streak}
            streakFreezeAvailable={gamification.streak_freeze_available}
          />
        </div>

        {/* Stats Summary */}
        <div
          className="grid grid-cols-3 gap-3 animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Medal className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {userAchievements.length}
            </p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {completedWeekly}/{weeklyChallenges.length}
            </p>
            <p className="text-xs text-muted-foreground">Semanais</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {completedMonthly}/{monthlyChallenges.length}
            </p>
            <p className="text-xs text-muted-foreground">Mensais</p>
          </div>
        </div>

        {/* Tabs for Achievements and Challenges */}
        <Tabs
          defaultValue="achievements"
          className="animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="achievements" className="gap-2">
              <Medal className="w-4 h-4" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Target className="w-4 h-4" />
              Desafios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-6">
            {Object.entries(achievementsByCategory).map(
              ([category, categoryAchievements]) => {
                const info =
                  categoryInfo[category as keyof typeof categoryInfo];
                const unlockedInCategory = categoryAchievements.filter((a) =>
                  unlockedAchievementIds.has(a.id)
                ).length;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info?.icon}</span>
                        <h3 className="font-semibold text-foreground">
                          {info?.label || category}
                        </h3>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {unlockedInCategory}/{categoryAchievements.length}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {categoryAchievements.map((achievement) => {
                        const userAchievement = userAchievements.find(
                          (ua) => ua.achievement_id === achievement.id
                        );
                        return (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            isUnlocked={unlockedAchievementIds.has(
                              achievement.id
                            )}
                            unlockedAt={userAchievement?.unlocked_at}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            {/* Weekly Challenges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h3 className="font-semibold text-foreground">
                    Desafios Semanais
                  </h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedWeekly}/{weeklyChallenges.length} completos
                </span>
              </div>

              <div className="grid gap-3">
                {weeklyChallenges.map((uc) => (
                  <ChallengeCard
                    key={uc.id}
                    challenge={uc.challenge!}
                    userChallenge={uc}
                  />
                ))}
                {weeklyChallenges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum desafio semanal ativo
                  </p>
                )}
              </div>
            </div>

            {/* Monthly Challenges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗓️</span>
                  <h3 className="font-semibold text-foreground">
                    Desafios Mensais
                  </h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedMonthly}/{monthlyChallenges.length} completos
                </span>
              </div>

              <div className="grid gap-3">
                {monthlyChallenges.map((uc) => (
                  <ChallengeCard
                    key={uc.id}
                    challenge={uc.challenge!}
                    userChallenge={uc}
                  />
                ))}
                {monthlyChallenges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum desafio mensal ativo
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
