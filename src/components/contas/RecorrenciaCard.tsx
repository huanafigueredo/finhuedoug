import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/categoryEmojis";
import { Recorrencia } from "@/hooks/useRecorrencias";

interface RecorrenciaCardProps {
  recorrencia: Recorrencia;
  formatCurrency: (value: number) => string;
  onEdit: (recorrencia: Recorrencia) => void;
  onToggle: (recorrencia: Recorrencia) => void;
  onDelete: (recorrencia: Recorrencia) => void;
  index?: number;
}

export function RecorrenciaCard({
  recorrencia,
  formatCurrency,
  onEdit,
  onToggle,
  onDelete,
  index = 0,
}: RecorrenciaCardProps) {
  const categoryEmoji = getCategoryEmoji(recorrencia.categoria);

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 shadow-sm animate-fade-up",
        !recorrencia.ativo && "opacity-60"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Category Emoji */}
        <div className="text-2xl">{categoryEmoji}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{recorrencia.titulo}</p>
            {!recorrencia.ativo && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Pausada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>Dia {recorrencia.dia_vencimento}</span>
            {recorrencia.pessoa && (
              <>
                <span>•</span>
                <span>{recorrencia.pessoa}</span>
              </>
            )}
            {recorrencia.categoria && (
              <>
                <span>•</span>
                <span>{recorrencia.categoria}</span>
              </>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <p className="font-semibold">{formatCurrency(recorrencia.valor_padrao)}</p>
          <p className="text-xs text-muted-foreground">
            {recorrencia.tipo === "despesa" ? "Despesa" : "Receita"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-8 text-xs"
          onClick={() => onEdit(recorrencia)}
        >
          ✏️ Editar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-8 text-xs"
          onClick={() => onToggle(recorrencia)}
        >
          {recorrencia.ativo ? "⏸️ Pausar" : "▶️ Ativar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
          onClick={() => onDelete(recorrencia)}
        >
          🗑️ Excluir
        </Button>
      </div>
    </div>
  );
}
