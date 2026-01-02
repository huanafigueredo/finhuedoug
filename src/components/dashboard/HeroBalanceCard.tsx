import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown, Target } from "lucide-react";

interface HeroBalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  savedInGoals: number;
  monthName: string;
  formatCurrency: (value: number) => string;
}

export function HeroBalanceCard({
  balance,
  totalIncome,
  totalExpenses,
  savedInGoals,
  monthName,
  formatCurrency,
}: HeroBalanceCardProps) {
  const total = totalIncome + totalExpenses;
  const incomePercent = total > 0 ? (totalIncome / total) * 100 : 50;

  return (
    <div
      className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-up"
      style={{ animationFillMode: "forwards" }}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            Saldo disponível • {monthName}
          </p>
          <h2
            className={cn(
              "text-4xl sm:text-5xl font-bold tracking-tight",
              balance >= 0 ? "text-foreground" : "text-destructive"
            )}
          >
            {formatCurrency(balance)}
          </h2>
        </div>

        {/* Visual progress bar */}
        <div className="mb-6">
          <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
            <div
              className="h-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${incomePercent}%` }}
            />
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${100 - incomePercent}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Receitas</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Despesas</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          {savedInGoals > 0 && (
            <Link
              to="/metas"
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-warning" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Guardado</span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                  {formatCurrency(savedInGoals)}
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
