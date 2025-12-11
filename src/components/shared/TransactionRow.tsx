import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2, CreditCard, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  person: string;
  forWho: string;
  category: string;
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
}

export function TransactionRow({
  transaction,
  className,
  onEdit,
  onDelete,
  onDuplicate,
}: TransactionRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <tr className={cn("border-b border-primary/5 hover:bg-primary/5 transition-colors", className)}>
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
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 w-fit">
            <CreditCard className="w-3 h-3 text-accent" />
            <span className="text-xs font-medium text-accent">
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
      <td className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-primary/10">
            <DropdownMenuItem onClick={() => onEdit?.(transaction.id)} className="hover:bg-primary/5">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(transaction.id)} className="hover:bg-primary/5">
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(transaction.id)}
              className="text-destructive hover:bg-destructive/10"
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
