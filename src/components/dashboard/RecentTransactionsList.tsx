import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, ArrowUpRight as ArrowOut, Users } from "lucide-react";
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
      className="p-4 sm:p-6 rounded-xl bg-card border border-border/50 transition-all duration-200 hover:border-border animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Lançamentos Recentes
        </h3>
        <Link
          to="/lancamentos"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowOut className="w-4 h-4" />
        </Link>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-1">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    transaction.value > 0
                      ? "bg-success/10"
                      : "bg-muted"
                  )}
                >
                  {transaction.value > 0 ? (
                    <ArrowDownLeft className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {transaction.description}
                    </span>
                    {transaction.isCouple && (
                      <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
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
