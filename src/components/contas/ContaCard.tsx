import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCategoryEmoji, getUrgencyInfo } from "@/lib/categoryEmojis";
import { useSwipeActions } from "@/hooks/useSwipeActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContaAgendada } from "@/hooks/useContasAgendadas";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContaCardProps {
  conta: ContaAgendada;
  formatCurrency: (value: number) => string;
  onConfirmar: (conta: ContaAgendada) => void;
  onIgnorar: (conta: ContaAgendada) => void;
  index?: number;
}

export function ContaCard({
  conta,
  formatCurrency,
  onConfirmar,
  onIgnorar,
  index = 0,
}: ContaCardProps) {
  const isMobile = useIsMobile();
  const [isActioning, setIsActioning] = useState(false);

  const daysUntilDue = differenceInDays(
    parseISO(conta.data_vencimento),
    new Date()
  );
  const urgency = getUrgencyInfo(daysUntilDue);
  const categoryEmoji = getCategoryEmoji(conta.recorrencia?.categoria);

  const handleSwipeLeft = () => {
    setIsActioning(true);
    onIgnorar(conta);
  };

  const handleSwipeRight = () => {
    setIsActioning(true);
    onConfirmar(conta);
  };

  const { swipeX, isSwiping, handlers, isSwipedLeft, isSwipedRight } =
    useSwipeActions({
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
      threshold: 80,
    });

  const formattedDate = format(parseISO(conta.data_vencimento), "dd MMM", {
    locale: ptBR,
  });

  return (
    <div
      className="relative overflow-hidden rounded-xl animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Swipe Background Actions */}
      {isMobile && (
        <>
          {/* Left action - Ignorar */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-20 flex items-center justify-center bg-destructive/90 text-white transition-opacity",
              isSwipedLeft ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="text-2xl">⏭️</span>
          </div>
          {/* Right action - Confirmar */}
          <div
            className={cn(
              "absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-success/90 text-white transition-opacity",
              isSwipedRight ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="text-2xl">✅</span>
          </div>
        </>
      )}

      {/* Main Card Content */}
      <div
        className={cn(
          "relative bg-card border rounded-xl p-4 shadow-sm transition-transform",
          isSwiping && "transition-none",
          isActioning && "opacity-50"
        )}
        style={{
          transform: isMobile ? `translateX(${swipeX}px)` : undefined,
        }}
        onTouchStart={isMobile ? handlers.onTouchStart : undefined}
        onTouchMove={isMobile ? handlers.onTouchMove : undefined}
        onTouchEnd={isMobile ? handlers.onTouchEnd : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Category Emoji */}
          <div className="text-2xl">{categoryEmoji}</div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">
                {conta.recorrencia?.titulo || "Conta"}
              </p>
              <Badge variant={urgency.variant} className="text-xs shrink-0">
                {urgency.emoji} {urgency.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formattedDate}</span>
              {conta.recorrencia?.pessoa && (
                <>
                  <span>•</span>
                  <span>{conta.recorrencia.pessoa}</span>
                </>
              )}
            </div>
          </div>

          {/* Value and Actions */}
          <div className="text-right shrink-0">
            <p className="font-semibold">{formatCurrency(conta.valor)}</p>
            {!isMobile && (
              <div className="flex gap-1 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => onIgnorar(conta)}
                >
                  Ignorar
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onConfirmar(conta)}
                >
                  Pagar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Observation */}
        {conta.observacao && (
          <p className="text-xs text-muted-foreground mt-2 pl-9 truncate">
            {conta.observacao}
          </p>
        )}
      </div>
    </div>
  );
}
