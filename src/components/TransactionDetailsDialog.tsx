import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/shared/Badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  Calendar, 
  CreditCard, 
  Pencil, 
  Copy, 
  X,
  User,
  Tag,
  Building2,
  Wallet,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface TransactionDetails {
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
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
}

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDetails | null;
  onEdit?: (id: string) => void;
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
  onEdit,
}: TransactionDetailsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resumo");

  if (!transaction) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCopyDetails = () => {
    let text = `📝 ${transaction.description}\n`;
    text += `📅 ${transaction.date}\n`;
    text += `💰 ${formatCurrency(transaction.totalValue)}\n`;
    if (transaction.category && transaction.category !== "-") {
      text += `📂 ${transaction.category}\n`;
    }
    if (transaction.person && transaction.person !== "-") {
      text += `👤 Pago por: ${transaction.person}\n`;
    }
    if (transaction.forWho && transaction.forWho !== "-") {
      text += `🎯 Para: ${transaction.forWho}\n`;
    }
    if (transaction.observacao) {
      text += `\n📋 Observação:\n${transaction.observacao}`;
    }

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Detalhes copiados para a área de transferência.",
    });
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(transaction.id);
  };

  const hasObservacao = !!transaction.observacao && transaction.observacao.trim().length > 0;
  const hasInstallment = transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-foreground line-clamp-2">
                Detalhes do lançamento
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {transaction.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={transaction.type} />
              {transaction.isCouple && (
                <Heart className="w-4 h-4 text-primary fill-primary" />
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="detalhes">
                Detalhes
                {hasObservacao && (
                  <span className="ml-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[calc(90vh-280px)]">
            <TabsContent value="resumo" className="px-6 py-4 space-y-4 mt-0">
              {/* Valor */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor total</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    transaction.type === "income" ? "text-success" : "text-foreground"
                  )}>
                    {formatCurrency(transaction.totalValue)}
                  </span>
                </div>
                {transaction.isCouple && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Por pessoa</span>
                    <span className="text-lg font-medium text-muted-foreground">
                      {formatCurrency(transaction.valuePerPerson)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailItem 
                  icon={Calendar}
                  label="Data"
                  value={transaction.date}
                />
                <DetailItem 
                  icon={Tag}
                  label="Categoria"
                  value={transaction.category !== "-" ? transaction.category : undefined}
                />
                <DetailItem 
                  icon={User}
                  label="Pago por"
                  value={transaction.person !== "-" ? transaction.person : undefined}
                />
                <DetailItem 
                  icon={User}
                  label="Para quem"
                  value={transaction.forWho !== "-" ? transaction.forWho : undefined}
                />
                <DetailItem 
                  icon={Building2}
                  label="Banco"
                  value={transaction.bank !== "-" ? transaction.bank : undefined}
                />
                <DetailItem 
                  icon={Wallet}
                  label="Pagamento"
                  value={transaction.paymentMethod !== "-" ? transaction.paymentMethod : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="detalhes" className="px-6 py-4 space-y-4 mt-0">
              {/* Parcelas */}
              {hasInstallment && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Parcelamento</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Parcela atual</span>
                    <span className="text-lg font-semibold text-foreground">
                      {transaction.installmentNumber}/{transaction.totalInstallments}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ 
                          width: `${(transaction.installmentNumber! / transaction.totalInstallments!) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {transaction.totalInstallments! - transaction.installmentNumber!} parcelas restantes
                    </p>
                  </div>
                </div>
              )}

              {/* Subcategoria */}
              {transaction.subcategory && transaction.subcategory !== "-" && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Subcategoria</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{transaction.subcategory}</p>
                </div>
              )}

              {/* Observação */}
              {hasObservacao && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Observação</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {transaction.observacao}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!hasInstallment && !hasObservacao && (!transaction.subcategory || transaction.subcategory === "-") && (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum detalhe adicional
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDetails}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar detalhes
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value?: string;
}) {
  if (!value) {
    return (
      <div className="p-3 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground/50">{label}</span>
        </div>
        <p className="text-sm text-muted-foreground/50">-</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
