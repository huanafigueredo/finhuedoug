import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Heart, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  category: string;
  bank: string;
  paymentMethod: string;
  totalValue: number;
  valuePerPerson: number;
  isCouple: boolean;
  type: "income" | "expense";
}

interface TransactionRowProps {
  transaction: Transaction;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransactionRow({
  transaction,
  className,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <tr className={cn("border-b border-border hover:bg-secondary/30 transition-colors", className)}>
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(transaction.id)}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(transaction.id)}
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
