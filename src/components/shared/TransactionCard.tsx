import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2, Copy, Calendar, CreditCard, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Transaction } from "./TransactionRow";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
  style?: React.CSSProperties;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function TransactionCard({
  transaction,
  className,
  style,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
}: TransactionCardProps) {
  const isMobile = useIsMobile();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const hasTriggeredHaptic = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 140;

  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 10 : intensity === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-actions-dropdown]') || target.closest('[data-swipe-actions]')) return;
    if (Math.abs(swipeOffset) > 10) return; // Don't trigger click if swiped
    onClick?.(transaction.id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine if horizontal or vertical swipe on first significant move
    if (!isHorizontalSwipe.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!isHorizontalSwipe.current) return;

    // Only allow left swipe (negative deltaX)
    const newOffset = Math.min(0, Math.max(-MAX_SWIPE, deltaX + swipeOffset));

    // Trigger haptic when crossing threshold
    if (newOffset < -SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      triggerHaptic('medium');
    } else if (newOffset > -SWIPE_THRESHOLD && hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = false;
      triggerHaptic('light');
    }

    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    hasTriggeredHaptic.current = false;

    // Snap to open or closed position
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-MAX_SWIPE);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleSwipeAction = (action: 'edit' | 'delete') => {
    triggerHaptic('heavy');
    setSwipeOffset(0);
    if (action === 'edit') {
      onEdit?.(transaction.id);
    } else {
      onDelete?.(transaction.id);
    }
  };

  const resetSwipe = () => setSwipeOffset(0);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe Actions Background - Only on mobile */}
      {isMobile && (
        <div
          data-swipe-actions
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ width: MAX_SWIPE }}
        >
          <button
            onClick={() => handleSwipeAction('edit')}
            className="flex-1 flex items-center justify-center bg-pink-500 text-white active:bg-pink-600 transition-colors"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleSwipeAction('delete')}
            className="flex-1 flex items-center justify-center bg-destructive text-destructive-foreground active:bg-destructive/90 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Card Content */}
      <div
        className={cn(
          "relative p-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer",
          "hover:shadow-md hover:border-primary/20 active:scale-[0.99]",
          isSwiping ? "" : "transition-transform duration-200",
          className
        )}
        style={{
          ...style,
          transform: isMobile ? `translateX(${swipeOffset}px)` : undefined
        }}
        onClick={handleCardClick}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                {transaction.description}
              </span>
              {transaction.invoiceMonth && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 whitespace-nowrap">
                  Fatura {transaction.invoiceMonth}
                </span>
              )}
              {transaction.isCouple && (
                <Heart className="w-4 h-4 text-primary fill-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{transaction.date}</span>
              {transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments && (
                <span className="px-2 py-0.5 bg-secondary rounded-md text-xs font-medium">
                  {transaction.installmentNumber}/{transaction.totalInstallments}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Badge variant={transaction.type} />
              {transaction.savingsDepositId && <Badge variant="meta" />}
            </div>
            <div data-actions-dropdown>
              <DropdownMenu onOpenChange={(open) => !open && resetSwipe()}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-8 sm:w-8 -mr-2"
                  >
                    <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover min-w-[160px]">
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onEdit?.(transaction.id); }}
                    className="py-3 sm:py-2"
                  >
                    <Pencil className="w-4 h-4 mr-3" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDuplicate?.(transaction.id); }}
                    className="py-3 sm:py-2"
                  >
                    <Copy className="w-4 h-4 mr-3" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete?.(transaction.id); }}
                    className="text-destructive py-3 sm:py-2"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-3 text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{transaction.person}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{transaction.category}</span>
          {transaction.bank !== "-" && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                {transaction.bank}
              </span>
            </>
          )}
          {transaction.paymentMethod !== "-" && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                {transaction.paymentMethod}
              </span>
            </>
          )}
        </div>

        {/* Value Row */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-base sm:text-lg font-bold text-foreground">
            {formatCurrency(transaction.totalValue)}
          </div>
          {transaction.isCouple && (
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
              {transaction.splitPercentages && transaction.splitPercentages.person1 !== 50 ? (
                // Non-50/50 split: show badge and individual amounts
                <>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    {transaction.splitPercentages.person1}/{transaction.splitPercentages.person2}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{transaction.person1Name}: {formatCurrency(transaction.person1Share ?? transaction.valuePerPerson)}</span>
                    <span className="mx-1 text-muted-foreground/50">|</span>
                    <span className="font-medium text-foreground">{transaction.person2Name}: {formatCurrency(transaction.person2Share ?? transaction.valuePerPerson)}</span>
                  </span>
                </>
              ) : (
                // 50/50 split: show single value per person
                <span>P/ pessoa: <span className="font-medium text-foreground">{formatCurrency(transaction.valuePerPerson)}</span></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
