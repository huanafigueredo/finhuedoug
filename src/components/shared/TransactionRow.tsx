import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2, CreditCard, Copy, MessageSquare } from "lucide-react";
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
}

interface TransactionRowProps {
  transaction: Transaction;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function TransactionRow({
  transaction,
  className,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
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

  return (
    <tr 
      className={cn(
        "border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer", 
        className
      )}
      onClick={handleRowClick}
    >
      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {transaction.date}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {transaction.description}
          </span>
          {transaction.isCouple && (
            <Heart className="w-4 h-4 text-primary fill-primary" />
          )}
          {hasObservacao && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tem observação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-foreground">{transaction.person}</td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {transaction.category}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{transaction.bank}</td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {transaction.paymentMethod}
      </td>
      {/* Installment Column */}
      <td className="px-4 py-4">
        {transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments ? (
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {transaction.installmentNumber}/{transaction.totalInstallments}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
        {formatCurrency(transaction.totalValue)}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {transaction.isCouple ? formatCurrency(transaction.valuePerPerson) : "-"}
      </td>
      <td className="px-4 py-4">
        <Badge variant={transaction.type} />
      </td>
      <td className="px-4 py-4" data-actions-dropdown>
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
    </tr>
  );
}
