import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conta {
  id: string;
  data_vencimento: string;
  valor: number;
  recorrencia?: {
    titulo: string;
  } | null;
}

interface UpcomingBillsListProps {
  contas: Conta[];
  formatCurrency: (value: number) => string;
  delay?: number;
}

export function UpcomingBillsList({
  contas,
  formatCurrency,
  delay = 0,
}: UpcomingBillsListProps) {
  return (
    <div
      className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">📅</span>
          Contas em Aberto
        </h3>
        <Link
          to="/contas"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver todas
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {contas.length > 0 ? (
        <div className="space-y-2">
          {contas.slice(0, 3).map((conta) => {
            const dueDate = parseISO(conta.data_vencimento);
            const daysUntilDue = differenceInDays(dueDate, new Date());
            const isUrgent = daysUntilDue <= 2;

            return (
              <div
                key={conta.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                  isUrgent
                    ? "bg-destructive/10 hover:bg-destructive/15"
                    : "bg-secondary/50 hover:bg-secondary/70"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">
                    {isUrgent ? "⚠️" : "📌"}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {conta.recorrencia?.titulo}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        isUrgent ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {format(dueDate, "dd/MM", { locale: ptBR })}
                      {isUrgent && daysUntilDue === 0 && " • Vence hoje!"}
                      {isUrgent && daysUntilDue === 1 && " • Vence amanhã!"}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-2">
                  {formatCurrency(conta.valor)}
                </span>
              </div>
            );
          })}
          {contas.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{contas.length - 3} outras contas
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhuma conta a vencer nos próximos 7 dias ✨
        </p>
      )}
    </div>
  );
}
