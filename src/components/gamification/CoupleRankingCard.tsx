import { cn } from "@/lib/utils";
import { Trophy, Crown, TrendingUp } from "lucide-react";

interface CoupleRankingCardProps {
  person1Name: string;
  person2Name: string;
  person1Data: {
    xp_earned: number;
    achievements_count: number;
    challenges_completed: number;
  };
  person2Data: {
    xp_earned: number;
    achievements_count: number;
    challenges_completed: number;
  };
  historicalWins: {
    person1: number;
    person2: number;
    ties: number;
  };
  currentLeader: "person1" | "person2" | "tie";
}

export function CoupleRankingCard({
  person1Name,
  person2Name,
  person1Data,
  person2Data,
  historicalWins,
  currentLeader,
}: CoupleRankingCardProps) {
  const totalXp = person1Data.xp_earned + person2Data.xp_earned;
  const person1Percentage = totalXp > 0 ? (person1Data.xp_earned / totalXp) * 100 : 50;

  const getLeaderEmoji = (person: "person1" | "person2") => {
    if (currentLeader === "tie") return "🤝";
    return currentLeader === person ? "👑" : "";
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Ranking do Casal</h3>
        </div>
        <span className="text-xs text-muted-foreground">Este mês</span>
      </div>

      {/* VS Section */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Person 1 */}
        <div className="flex-1 text-center">
          <div className="relative inline-block mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
              {person1Name.charAt(0).toUpperCase()}
            </div>
            {currentLeader === "person1" && (
              <Crown className="absolute -top-2 -right-1 w-5 h-5 text-amber-500 rotate-12" />
            )}
          </div>
          <p className="font-semibold text-foreground text-sm">{person1Name}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {person1Data.xp_earned}
            <span className="text-xs text-muted-foreground ml-1">XP</span>
          </p>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">VS</span>
          </div>
        </div>

        {/* Person 2 */}
        <div className="flex-1 text-center">
          <div className="relative inline-block mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {person2Name.charAt(0).toUpperCase()}
            </div>
            {currentLeader === "person2" && (
              <Crown className="absolute -top-2 -right-1 w-5 h-5 text-amber-500 rotate-12" />
            )}
          </div>
          <p className="font-semibold text-foreground text-sm">{person2Name}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {person2Data.xp_earned}
            <span className="text-xs text-muted-foreground ml-1">XP</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-700 ease-out"
            style={{ width: `${person1Percentage}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${100 - person1Percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
          <p className="text-xs text-muted-foreground">Conquistas</p>
          <p className="font-bold text-foreground">{person1Data.achievements_count}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-xs text-muted-foreground">Conquistas</p>
          <p className="font-bold text-foreground">{person2Data.achievements_count}</p>
        </div>
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
          <p className="text-xs text-muted-foreground">Desafios</p>
          <p className="font-bold text-foreground">{person1Data.challenges_completed}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-xs text-muted-foreground">Desafios</p>
          <p className="font-bold text-foreground">{person2Data.challenges_completed}</p>
        </div>
      </div>

      {/* Historical Wins */}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center mb-2">
          Histórico de Vitórias
        </p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-lg font-bold text-pink-500">{historicalWins.person1}</p>
            <p className="text-xs text-muted-foreground">{person1Name}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-muted-foreground">{historicalWins.ties}</p>
            <p className="text-xs text-muted-foreground">Empates</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-500">{historicalWins.person2}</p>
            <p className="text-xs text-muted-foreground">{person2Name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
