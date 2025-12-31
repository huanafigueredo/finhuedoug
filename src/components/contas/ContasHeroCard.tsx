import { cn } from "@/lib/utils";

interface ContasHeroCardProps {
  totalPendente: number;
  totalPago: number;
  proximoVencimento: { titulo: string; data: string; valor: number } | null;
  temAtrasadas: boolean;
  formatCurrency: (value: number) => string;
}

export function ContasHeroCard({
  totalPendente,
  totalPago,
  proximoVencimento,
  temAtrasadas,
  formatCurrency,
}: ContasHeroCardProps) {
  const total = totalPendente + totalPago;
  const percentPago = total > 0 ? (totalPago / total) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-4 sm:p-5 shadow-card">
      {/* Status Icon */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-2xl sm:text-3xl">
        {temAtrasadas ? "🚨" : totalPendente === 0 ? "✅" : "📅"}
      </div>

      {/* Main Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="pr-10">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Total a pagar este mês
          </p>
          <p className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight",
            temAtrasadas && "text-destructive"
          )}>
            {formatCurrency(totalPendente)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
            <span>Pago: {formatCurrency(totalPago)}</span>
            <span>{percentPago.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${percentPago}%` }}
            />
          </div>
        </div>

        {/* Next Due */}
        {proximoVencimento && (
          <div className="pt-2 sm:pt-3 border-t border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Próximo</p>
                <p className="font-medium text-xs sm:text-sm truncate">{proximoVencimento.titulo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">{proximoVencimento.data}</p>
                <p className="font-semibold text-xs sm:text-sm">{formatCurrency(proximoVencimento.valor)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
