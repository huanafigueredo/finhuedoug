import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2, Copy, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  observacao?: string | null;
  person: string;
  forWho: string;
  category: string;
  subcategory?: string | null;
  bank: string;
  paymentMethod: string;
  totalValue: number;
  valuePerPerson: number;
  isCouple: boolean;
  type: "income" | "expense";
  // Installment fields
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentValue?: number;
  // Savings goal link
  savingsDepositId?: string | null;
  // Split fields for proportional/custom division
  person1Share?: number;
  person2Share?: number;
  person1Name?: string;
  person2Name?: string;
  splitPercentages?: { person1: number; person2: number };
}

interface TransactionRowProps {
  transaction: Transaction;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClick?: (id: string) => void;
  asFragment?: boolean;
}

export function TransactionRow({
  transaction,
  className,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
  asFragment = false,
}: TransactionRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const hasObservacao = !!transaction.observacao && transaction.observacao.trim().length > 0;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on the actions dropdown
    const target = e.target as HTMLElement;
    if (target.closest('[data-actions-dropdown]')) return;
    onClick?.(transaction.id);
  };

  const cells = (
    <>
      <td className="px-3 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {transaction.date}
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {transaction.description}
          </span>
          {transaction.isCouple && (
            <Heart className="w-4 h-4 text-primary fill-primary shrink-0" />
          )}
          {hasObservacao && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tem observação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-foreground truncate">{transaction.person}</td>
      <td className="px-3 py-4 text-sm text-muted-foreground truncate">
        {transaction.category}
      </td>
      <td className="px-3 py-4 text-sm text-muted-foreground truncate">{transaction.bank}</td>
      <td className="px-3 py-4 text-sm text-muted-foreground truncate">
        {transaction.paymentMethod}
      </td>
      {/* Installment Column */}
      <td className="px-2 py-4">
        {transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments ? (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {transaction.installmentNumber}/{transaction.totalInstallments}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      {/* Value Column - now shows installment value for installments */}
      <td className="px-2 py-4 text-sm font-medium text-foreground whitespace-nowrap text-right">
        {formatCurrency(transaction.totalValue)}
      </td>
      {/* Per Person Column */}
      <td className="px-2 py-4 text-xs text-muted-foreground whitespace-nowrap text-right">
        {transaction.isCouple && transaction.person1Share !== undefined && transaction.person2Share !== undefined ? (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center justify-end gap-1">
              {transaction.splitPercentages && transaction.splitPercentages.person1 !== 50 && (
                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary">
                  {transaction.splitPercentages.person1}/{transaction.splitPercentages.person2}
                </span>
              )}
              {transaction.person1Name}: {formatCurrency(transaction.person1Share)}
            </span>
            <span>{transaction.person2Name}: {formatCurrency(transaction.person2Share)}</span>
          </div>
        ) : transaction.isCouple ? (
          formatCurrency(transaction.valuePerPerson)
        ) : "-"}
      </td>
      <td className="px-2 py-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={transaction.type} />
          {transaction.savingsDepositId && <Badge variant="meta" />}
        </div>
      </td>
      <td className="px-2 py-4" data-actions-dropdown>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      </td>
    </>
  );

  if (asFragment) {
    return cells;
  }

  return (
    <tr 
      className={cn(
        "border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer", 
        className
      )}
      onClick={handleRowClick}
    >
      {cells}
    </tr>
  );
}
