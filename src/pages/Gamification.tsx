import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGamification, Achievement } from "@/hooks/useGamification";
import { useChallenges } from "@/hooks/useChallenges";
import { useRewards } from "@/hooks/useRewards";
import { useCoupleRanking } from "@/hooks/useCoupleRanking";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { RewardCard } from "@/components/gamification/RewardCard";
import { CoupleRankingCard } from "@/components/gamification/CoupleRankingCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Medal, Gift, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Gamification() {
  const { toast } = useToast();

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

  const {
    themes,
    frames,
    badges,
    userRewards,
    availableToUnlock,
    unlockedRewardIds,
    isLoading: isLoadingRewards,
    unlockReward,
    equipReward,
  } = useRewards();

  const {
    currentMonthData,
    historicalWins,
    currentLeader,
    person1Name,
    person2Name,
    isLoading: isLoadingRanking,
  } = useCoupleRanking();

  // Initialize challenges on mount
  useEffect(() => {
    initializeChallenges();
  }, []);

  const isLoading =
    isLoadingGamification || isLoadingChallenges || isLoadingRewards || isLoadingRanking;

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

  const handleUnlockReward = async (rewardId: string, rewardName: string) => {
    try {
      await unlockReward(rewardId);
      toast({
        title: "🎉 Recompensa Desbloqueada!",
        description: `Você desbloqueou: ${rewardName}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear a recompensa.",
        variant: "destructive",
      });
    }
  };

  const handleEquipReward = async (rewardId: string, type: string) => {
    try {
      await equipReward({ rewardId, type });
      toast({
        title: "Equipado!",
        description: "Recompensa equipada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível equipar a recompensa.",
        variant: "destructive",
      });
    }
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
  const totalUnlockedRewards = userRewards.length;

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
              Acompanhe seu progresso, conquistas e recompensas
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
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <StreakCounter
            currentStreak={gamification.current_streak}
            longestStreak={gamification.longest_streak}
            streakFreezeAvailable={gamification.streak_freeze_available}
          />
        </div>

        {/* Stats Summary */}
        <div
          className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/50 text-center">
            <Medal className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {userAchievements.length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Conquistas</p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/50 text-center">
            <Target className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {completedWeekly + completedMonthly}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Desafios</p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/50 text-center">
            <Gift className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {totalUnlockedRewards}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Recompensas</p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/50 text-center">
            <Users className="w-5 h-5 mx-auto text-pink-500 mb-1" />
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {historicalWins.person1 + historicalWins.person2}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Disputas</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="ranking"
          className="animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="ranking" className="gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4 hidden sm:block" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1 text-xs sm:text-sm">
              <Medal className="w-4 h-4 hidden sm:block" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1 text-xs sm:text-sm">
              <Target className="w-4 h-4 hidden sm:block" />
              Desafios
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1 text-xs sm:text-sm">
              <Gift className="w-4 h-4 hidden sm:block" />
              Loja
            </TabsTrigger>
          </TabsList>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-6">
            <CoupleRankingCard
              person1Name={person1Name}
              person2Name={person2Name}
              person1Data={currentMonthData.person1}
              person2Data={currentMonthData.person2}
              historicalWins={historicalWins}
              currentLeader={currentLeader}
            />

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-medium text-foreground text-sm">Como funciona?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ganhe XP registrando transações, completando desafios e desbloqueando conquistas.
                    Quem ganhar mais XP no mês leva o troféu! 🏆
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {Object.entries(achievementsByCategory).map(
              ([category, categoryAchievements]) => {
                const info = categoryInfo[category as keyof typeof categoryInfo];
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
                            isUnlocked={unlockedAchievementIds.has(achievement.id)}
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

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            {/* Weekly Challenges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h3 className="font-semibold text-foreground">Desafios Semanais</h3>
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
                  <h3 className="font-semibold text-foreground">Desafios Mensais</h3>
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

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            {/* Available to unlock notification */}
            {availableToUnlock.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <p className="font-medium text-foreground">
                    {availableToUnlock.length} recompensa(s) disponível(is) para desbloquear!
                  </p>
                </div>
              </div>
            )}

            {/* Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <h3 className="font-semibold text-foreground">Temas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((reward) => {
                  const isUnlocked = unlockedRewardIds.has(reward.id);
                  const userReward = userRewards.find((ur) => ur.reward_id === reward.id);
                  const canUnlock = availableToUnlock.some((r) => r.id === reward.id);

                  return (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      isUnlocked={isUnlocked}
                      isEquipped={userReward?.is_equipped || false}
                      canUnlock={canUnlock}
                      currentXp={gamification.xp}
                      currentLevel={gamification.level}
                      onUnlock={() => handleUnlockReward(reward.id, reward.name)}
                      onEquip={() => handleEquipReward(reward.id, reward.type)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Frames */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖼️</span>
                <h3 className="font-semibold text-foreground">Molduras de Avatar</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {frames.map((reward) => {
                  const isUnlocked = unlockedRewardIds.has(reward.id);
                  const userReward = userRewards.find((ur) => ur.reward_id === reward.id);
                  const canUnlock = availableToUnlock.some((r) => r.id === reward.id);

                  return (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      isUnlocked={isUnlocked}
                      isEquipped={userReward?.is_equipped || false}
                      canUnlock={canUnlock}
                      currentXp={gamification.xp}
                      currentLevel={gamification.level}
                      onUnlock={() => handleUnlockReward(reward.id, reward.name)}
                      onEquip={() => handleEquipReward(reward.id, reward.type)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏅</span>
                <h3 className="font-semibold text-foreground">Badges Especiais</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((reward) => {
                  const isUnlocked = unlockedRewardIds.has(reward.id);
                  const userReward = userRewards.find((ur) => ur.reward_id === reward.id);
                  const canUnlock = availableToUnlock.some((r) => r.id === reward.id);

                  return (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      isUnlocked={isUnlocked}
                      isEquipped={userReward?.is_equipped || false}
                      canUnlock={canUnlock}
                      currentXp={gamification.xp}
                      currentLevel={gamification.level}
                      onUnlock={() => handleUnlockReward(reward.id, reward.name)}
                      onEquip={() => handleEquipReward(reward.id, reward.type)}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
