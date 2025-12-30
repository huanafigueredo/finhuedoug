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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-5 shadow-card">
      {/* Status Icon */}
      <div className="absolute top-4 right-4 text-3xl">
        {temAtrasadas ? "🚨" : totalPendente === 0 ? "✅" : "📅"}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            Total a pagar este mês
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            temAtrasadas && "text-destructive"
          )}>
            {formatCurrency(totalPendente)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pago: {formatCurrency(totalPago)}</span>
            <span>{percentPago.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${percentPago}%` }}
            />
          </div>
        </div>

        {/* Next Due */}
        {proximoVencimento && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Próximo vencimento</p>
                <p className="font-medium text-sm">{proximoVencimento.titulo}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{proximoVencimento.data}</p>
                <p className="font-semibold text-sm">{formatCurrency(proximoVencimento.valor)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
