import { History, Trophy, TrendingDown, PiggyBank, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthlyFinancialRanking } from "@/hooks/useFinancialRankingHistory";

interface RankingHistoryCardProps {
  rankings: MonthlyFinancialRanking[];
  person1Name: string;
  person2Name: string;
  historicalWins: {
    person1: number;
    person2: number;
    ties: number;
  };
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value / 100); // Convert cents to reais
};

export function RankingHistoryCard({
  rankings,
  person1Name,
  person2Name,
  historicalWins,
}: RankingHistoryCardProps) {
  const getWinnerName = (winner: string | null) => {
    if (winner === "person1") return person1Name;
    if (winner === "person2") return person2Name;
    return "Empate";
  };

  const getWinnerEmoji = (winner: string | null) => {
    if (winner === "person1" || winner === "person2") return "👑";
    return "🤝";
  };

  const getWinnerColor = (winner: string | null) => {
    if (winner === "person1") return "text-pink-500";
    if (winner === "person2") return "text-blue-500";
    return "text-muted-foreground";
  };

  if (rankings.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Histórico de Rankings</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum histórico disponível ainda. O ranking será salvo automaticamente ao final de cada mês.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-foreground">Histórico de Rankings</h3>
        </div>
        <span className="text-xs text-muted-foreground">Últimos {rankings.length} meses</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
          <p className="text-2xl font-bold text-pink-500">{historicalWins.person1}</p>
          <p className="text-xs text-muted-foreground">{person1Name}</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-2xl font-bold text-muted-foreground">{historicalWins.ties}</p>
          <p className="text-xs text-muted-foreground">Empates</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-500">{historicalWins.person2}</p>
          <p className="text-xs text-muted-foreground">{person2Name}</p>
        </div>
      </div>

      {/* Monthly List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {rankings.map((ranking) => (
          <div
            key={ranking.id}
            className="p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">
                  {monthNames[ranking.month - 1]} {ranking.year}
                </span>
              </div>
              <div className={cn("flex items-center gap-1", getWinnerColor(ranking.overall_winner))}>
                <span>{getWinnerEmoji(ranking.overall_winner)}</span>
                <span className="text-sm font-semibold">
                  {getWinnerName(ranking.overall_winner)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* Spending */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                <TrendingDown className="w-3 h-3 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground truncate">Gastos</p>
                  <p className={cn("font-medium", getWinnerColor(ranking.spending_winner))}>
                    {getWinnerName(ranking.spending_winner)}
                  </p>
                </div>
              </div>

              {/* Savings */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                <PiggyBank className="w-3 h-3 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground truncate">Poupou</p>
                  <p className={cn("font-medium", getWinnerColor(ranking.savings_winner))}>
                    {getWinnerName(ranking.savings_winner)}
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground truncate">Saldo</p>
                  <p className={cn("font-medium", getWinnerColor(ranking.balance_winner))}>
                    {getWinnerName(ranking.balance_winner)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
