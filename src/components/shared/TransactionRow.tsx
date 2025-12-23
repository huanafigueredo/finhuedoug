import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2, CreditCard, Copy, MessageSquare, Info } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
        <InstallmentValueCell transaction={transaction} formatCurrency={formatCurrency} />
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

// Component for displaying installment value column
function InstallmentValueCell({ 
  transaction, 
  formatCurrency 
}: { 
  transaction: Transaction; 
  formatCurrency: (value: number) => string;
}) {
  // For installment transactions, show the installment value
  // For non-installment, show the same as total value
  const displayValue = transaction.isInstallment && transaction.installmentValue
    ? transaction.installmentValue
    : transaction.totalValue;
  
  const isCoupleInstallment = transaction.isCouple && transaction.isInstallment && 
    transaction.installmentNumber && transaction.totalInstallments;
  
  const installmentValuePerPerson = isCoupleInstallment && transaction.installmentValue
    ? transaction.installmentValue / 2
    : transaction.valuePerPerson;

  // If it's a couple + installment, show popover with details
  if (isCoupleInstallment) {
    return (
      <div className="flex items-center gap-1.5">
        <span>{formatCurrency(displayValue)}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-3" 
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                Detalhes do Parcelamento
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor total da compra</span>
                  <span className="font-medium text-foreground">{formatCurrency(transaction.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor da parcela</span>
                  <span className="font-medium text-foreground">{formatCurrency(displayValue)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-muted-foreground">Parcela por pessoa</span>
                  <span className="font-medium text-primary">{formatCurrency(installmentValuePerPerson)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Status
                  </span>
                  <span className="font-medium text-foreground">
                    {transaction.installmentNumber}/{transaction.totalInstallments}
                  </span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return <span>{formatCurrency(displayValue)}</span>;
}
