import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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
      className="relative p-6 sm:p-8 rounded-3xl bg-card border border-border/50 shadow-card overflow-hidden animate-fade-up"
      style={{ animationFillMode: "forwards" }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Saldo de {monthName}
            </p>
            <h2
              className={cn(
                "font-display text-4xl sm:text-5xl font-bold tracking-tight",
                balance >= 0 ? "text-foreground" : "text-destructive"
              )}
            >
              {formatCurrency(balance)}
            </h2>
          </div>
          <span className="text-4xl">{balance >= 0 ? "✨" : "😅"}</span>
        </div>

        {/* Visual progress bar */}
        <div className="mb-6">
          <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
            <div
              className="h-full bg-success transition-all duration-700 ease-out rounded-l-full"
              style={{ width: `${incomePercent}%` }}
            />
            <div
              className="h-full bg-primary transition-all duration-700 ease-out rounded-r-full"
              style={{ width: `${100 - incomePercent}%` }}
            />
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Receitas</span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Despesas</span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          {savedInGoals > 0 && (
            <Link
              to="/metas"
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
            >
              <span className="text-lg">🎯</span>
              <span className="text-sm text-muted-foreground">Guardado</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(savedInGoals)}
              </span>
              <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
