import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  isCouple: boolean;
}

interface RecentTransactionsListProps {
  transactions: Transaction[];
  formatCurrency: (value: number) => string;
  delay?: number;
}

export function RecentTransactionsList({
  transactions,
  formatCurrency,
  delay = 0,
}: RecentTransactionsListProps) {
  return (
    <div
      className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">📝</span>
          Lançamentos Recentes
        </h3>
        <Link
          to="/lancamentos"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">
                  {transaction.value > 0 ? "💰" : "💸"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {transaction.description}
                    </span>
                    {transaction.isCouple && (
                      <span className="text-xs">💕</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {transaction.date}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold flex-shrink-0 ml-2",
                  transaction.value > 0 ? "text-success" : "text-foreground"
                )}
              >
                {formatCurrency(transaction.value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum lançamento neste período
        </p>
      )}
    </div>
  );
}
