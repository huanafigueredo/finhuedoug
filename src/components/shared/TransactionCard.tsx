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

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function TransactionCard({
  transaction,
  className,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
}: TransactionCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-actions-dropdown]')) return;
    onClick?.(transaction.id);
  };

  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer",
        "hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-sm font-semibold text-foreground truncate">
              {transaction.description}
            </span>
            {transaction.isCouple && (
              <Heart className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{transaction.date}</span>
            {transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments && (
              <span className="px-1.5 py-0.5 bg-secondary rounded text-xs font-medium">
                {transaction.installmentNumber}/{transaction.totalInstallments}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant={transaction.type} />
          <div data-actions-dropdown>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(transaction.id); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(transaction.id); }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete?.(transaction.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mb-2 sm:mb-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{transaction.person}</span>
        <span>•</span>
        <span>{transaction.category}</span>
        {transaction.bank !== "-" && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {transaction.bank}
            </span>
          </>
        )}
        {transaction.paymentMethod !== "-" && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {transaction.paymentMethod}
            </span>
          </>
        )}
      </div>

      {/* Value Row */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-sm sm:text-base font-bold text-foreground">
          {formatCurrency(transaction.totalValue)}
        </div>
        {transaction.isCouple && (
          <div className="text-[11px] sm:text-xs text-muted-foreground">
            P/ pessoa: <span className="font-medium text-foreground">{formatCurrency(transaction.valuePerPerson)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
