import { Trophy, TrendingDown, PiggyBank, Sparkles } from "lucide-react";
import { AvatarWithFrame, FrameType } from "@/components/shared/AvatarWithFrame";
import { cn } from "@/lib/utils";

interface FinancialRankingCardProps {
  person1Name: string;
  person2Name: string;
  person1Expenses: number;
  person2Expenses: number;
  person1Savings: number;
  person2Savings: number;
  person1Balance: number;
  person2Balance: number;
  person1AvatarUrl?: string | null;
  person2AvatarUrl?: string | null;
  person1Frame?: FrameType;
  person2Frame?: FrameType;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
};

export function FinancialRankingCard({
  person1Name,
  person2Name,
  person1Expenses,
  person2Expenses,
  person1Savings,
  person2Savings,
  person1Balance,
  person2Balance,
  person1AvatarUrl,
  person2AvatarUrl,
  person1Frame = "default",
  person2Frame = "default",
}: FinancialRankingCardProps) {
  // Determine winners
  const spendingWinner = person1Expenses < person2Expenses 
    ? "person1" 
    : person2Expenses < person1Expenses 
      ? "person2" 
      : "tie";
  
  const savingsWinner = person1Savings > person2Savings 
    ? "person1" 
    : person2Savings > person1Savings 
      ? "person2" 
      : "tie";
  
  const balanceWinner = person1Balance > person2Balance 
    ? "person1" 
    : person2Balance > person1Balance 
      ? "person2" 
      : "tie";

  // Calculate overall winner (best in 2 out of 3 categories)
  const person1Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person1").length;
  const person2Wins = [spendingWinner, savingsWinner, balanceWinner].filter(w => w === "person2").length;
  const overallWinner = person1Wins > person2Wins 
    ? "person1" 
    : person2Wins > person1Wins 
      ? "person2" 
      : "tie";

  const categories = [
    {
      id: "spending",
      title: "Gastou Menos",
      icon: TrendingDown,
      person1Value: person1Expenses,
      person2Value: person2Expenses,
      winner: spendingWinner,
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      lowerIsBetter: true,
    },
    {
      id: "savings",
      title: "Guardou Mais",
      icon: PiggyBank,
      person1Value: person1Savings,
      person2Value: person2Savings,
      winner: savingsWinner,
      colorClass: "text-pink-500",
      bgClass: "bg-pink-500/10",
      borderClass: "border-pink-500/30",
      lowerIsBetter: false,
    },
    {
      id: "balance",
      title: "Melhor Saldo",
      icon: Sparkles,
      person1Value: person1Balance,
      person2Value: person2Balance,
      winner: balanceWinner,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      lowerIsBetter: false,
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Ranking Financeiro</h3>
        </div>
        <span className="text-xs text-muted-foreground">Este mês</span>
      </div>

      {/* Avatars with overall winner */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <AvatarWithFrame
              name={person1Name}
              avatarUrl={person1AvatarUrl}
              frame={overallWinner === "person1" ? "champion" : person1Frame}
              size="lg"
              gradientFrom="from-pink-400"
              gradientTo="to-pink-600"
            />
            {overallWinner === "person1" && (
              <span className="absolute -top-2 -right-1 text-xl">👑</span>
            )}
          </div>
          <p className="font-semibold text-foreground text-sm mt-2">{person1Name}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl font-bold text-foreground">{person1Wins}</span>
            <span className="text-xs text-muted-foreground">vitória{person1Wins !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">VS</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <AvatarWithFrame
              name={person2Name}
              avatarUrl={person2AvatarUrl}
              frame={overallWinner === "person2" ? "champion" : person2Frame}
              size="lg"
              gradientFrom="from-purple-400"
              gradientTo="to-purple-600"
            />
            {overallWinner === "person2" && (
              <span className="absolute -top-2 -right-1 text-xl">👑</span>
            )}
          </div>
          <p className="font-semibold text-foreground text-sm mt-2">{person2Name}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl font-bold text-foreground">{person2Wins}</span>
            <span className="text-xs text-muted-foreground">vitória{person2Wins !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const p1IsWinner = cat.winner === "person1";
          const p2IsWinner = cat.winner === "person2";
          
          return (
            <div 
              key={cat.id} 
              className={cn(
                "p-4 rounded-2xl border transition-all",
                cat.bgClass,
                cat.borderClass
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", cat.colorClass)} />
                  <span className="text-sm font-medium text-foreground">{cat.title}</span>
                </div>
                {cat.winner !== "tie" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 text-foreground">
                    🏆 {cat.winner === "person1" ? person1Name : person2Name}
                  </span>
                )}
                {cat.winner === "tie" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                    🤝 Empate
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-3 rounded-xl bg-background/50 text-center transition-all",
                  p1IsWinner && "ring-2 ring-pink-500/50"
                )}>
                  <p className="text-xs text-muted-foreground mb-1">{person1Name}</p>
                  <p className={cn(
                    "font-bold text-sm",
                    p1IsWinner ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {formatCurrency(cat.person1Value)}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl bg-background/50 text-center transition-all",
                  p2IsWinner && "ring-2 ring-purple-500/50"
                )}>
                  <p className="text-xs text-muted-foreground mb-1">{person2Name}</p>
                  <p className={cn(
                    "font-bold text-sm",
                    p2IsWinner ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {formatCurrency(cat.person2Value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner announcement */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
        {overallWinner === "tie" ? (
          <>
            <span className="text-2xl mb-2 block">🤝</span>
            <p className="font-semibold text-foreground">Empate!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vocês estão equilibrados este mês
            </p>
          </>
        ) : (
          <>
            <span className="text-2xl mb-2 block">🎉</span>
            <p className="font-semibold text-foreground">
              {overallWinner === "person1" ? person1Name : person2Name} lidera o mês!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Melhor em {overallWinner === "person1" ? person1Wins : person2Wins} de 3 categorias
            </p>
          </>
        )}
      </div>
    </div>
  );
}
