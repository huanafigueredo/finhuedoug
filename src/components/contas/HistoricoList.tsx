import { ContaAgendada } from "@/hooks/useContasAgendadas";
import { getCategoryEmoji } from "@/lib/categoryEmojis";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface HistoricoListProps {
  contas: ContaAgendada[];
  formatCurrency: (value: number) => string;
}

export function HistoricoList({ contas, formatCurrency }: HistoricoListProps) {
  if (contas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <span className="text-4xl block mb-2">📋</span>
        <p>Nenhum histórico neste período</p>
      </div>
    );
  }

  // Group by status
  const confirmadas = contas.filter((c) => c.status === "confirmado");
  const ignoradas = contas.filter((c) => c.status === "ignorado");

  return (
    <div className="space-y-6">
      {/* Confirmadas */}
      {confirmadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            ✅ Pagas ({confirmadas.length})
          </h3>
          <div className="space-y-2">
            {confirmadas.map((conta, index) => (
              <HistoricoItem
                key={conta.id}
                conta={conta}
                formatCurrency={formatCurrency}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ignoradas */}
      {ignoradas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            ⏭️ Ignoradas ({ignoradas.length})
          </h3>
          <div className="space-y-2">
            {ignoradas.map((conta, index) => (
              <HistoricoItem
                key={conta.id}
                conta={conta}
                formatCurrency={formatCurrency}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricoItem({
  conta,
  formatCurrency,
  index,
}: {
  conta: ContaAgendada;
  formatCurrency: (value: number) => string;
  index: number;
}) {
  const categoryEmoji = getCategoryEmoji(conta.recorrencia?.categoria);
  const isPago = conta.status === "confirmado";

  const formattedDate = conta.confirmado_em
    ? format(parseISO(conta.confirmado_em), "dd/MM", { locale: ptBR })
    : null;

  return (
    <div
      className="bg-card border rounded-xl p-3 shadow-sm flex items-center gap-3 animate-fade-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Status + Emoji */}
      <div className="relative">
        <span className="text-xl">{categoryEmoji}</span>
        <span className="absolute -bottom-1 -right-1 text-xs">
          {isPago ? "✅" : "⏭️"}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {conta.recorrencia?.titulo || "Conta"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {formattedDate && <span>Pago em {formattedDate}</span>}
          {conta.recorrencia?.pessoa && (
            <>
              <span>•</span>
              <span>{conta.recorrencia.pessoa}</span>
            </>
          )}
        </div>
      </div>

      {/* Value + Link */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm">{formatCurrency(conta.valor)}</p>
        {isPago && conta.lancamento_id && (
          <Link
            to={`/lancamentos?id=${conta.lancamento_id}`}
            className="text-xs text-primary hover:underline"
          >
            Ver lançamento
          </Link>
        )}
      </div>
    </div>
  );
}
