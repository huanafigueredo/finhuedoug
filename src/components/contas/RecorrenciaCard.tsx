import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/categoryEmojis";
import { Recorrencia } from "@/hooks/useRecorrencias";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const categoryEmoji = getCategoryEmoji(recorrencia.categoria);

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-3 sm:p-4 shadow-sm animate-fade-up",
        !recorrencia.ativo && "opacity-60"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Category Emoji */}
        <div className="text-xl sm:text-2xl shrink-0">{categoryEmoji}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
              {recorrencia.titulo}
            </p>
            {!recorrencia.ativo && (
              <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                Pausada
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span>Dia {recorrencia.dia_vencimento}</span>
            {recorrencia.pessoa && (
              <>
                <span>•</span>
                <span className="truncate max-w-[60px] sm:max-w-none">{recorrencia.pessoa}</span>
              </>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm sm:text-base">{formatCurrency(recorrencia.valor_padrao)}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {recorrencia.tipo === "despesa" ? "Despesa" : "Receita"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50",
        isMobile ? "flex-wrap" : ""
      )}>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 sm:h-8 text-[10px] sm:text-xs",
            isMobile ? "flex-1 min-w-[80px]" : "flex-1"
          )}
          onClick={() => onEdit(recorrencia)}
        >
          ✏️ Editar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 sm:h-8 text-[10px] sm:text-xs",
            isMobile ? "flex-1 min-w-[80px]" : "flex-1"
          )}
          onClick={() => onToggle(recorrencia)}
        >
          {recorrencia.ativo ? "⏸️ Pausar" : "▶️ Ativar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 sm:h-8 text-[10px] sm:text-xs text-destructive hover:text-destructive",
            isMobile ? "flex-1 min-w-[80px]" : "flex-1"
          )}
          onClick={() => onDelete(recorrencia)}
        >
          🗑️ Excluir
        </Button>
      </div>
    </div>
  );
}
