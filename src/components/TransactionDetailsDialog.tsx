import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  Calendar, 
  CreditCard, 
  Pencil, 
  Copy,
  User,
  Tag,
  FileText,
  PartyPopper
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ComprovantesCard } from "@/components/comprovantes/ComprovantesCard";
import { ItensCompraCard } from "@/components/comprovantes/ItensCompraCard";
import { useItensLancamento } from "@/hooks/useComprovantes";
import confetti from 'canvas-confetti';

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
  tags?: string[];
  resumo_curto?: string;
  status_extracao?: string;
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
  const { data: itensLancamento } = useItensLancamento(transaction?.id);
  const [showCelebration, setShowCelebration] = useState(false);

  // Check if this is the last installment and show celebration
  const isLastInstallment = transaction?.isInstallment && 
    transaction?.installmentNumber === transaction?.totalInstallments;

  // Trigger celebration for last installment (only once per session)
  useEffect(() => {
    if (open && isLastInstallment && transaction?.id) {
      const celebratedKey = `installment_celebrated_${transaction.id}`;
      const alreadyCelebrated = sessionStorage.getItem(celebratedKey);
      
      if (!alreadyCelebrated) {
        setShowCelebration(true);
        sessionStorage.setItem(celebratedKey, 'true');
        
        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Show celebration toast
        toast({
          title: "🎉 Obaa, sua última parcela chegou!!",
          description: "Parabéns por quitar este parcelamento!",
        });
        
        // Hide celebration after animation
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  }, [open, isLastInstallment, transaction?.id, toast]);

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
    if (transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments) {
      text += `💳 Parcela: ${transaction.installmentNumber}/${transaction.totalInstallments}\n`;
    }
    
    // Add tags
    if (transaction.tags && transaction.tags.length > 0) {
      text += `🏷️ Tags: ${transaction.tags.join(', ')}\n`;
    }
    
    // Add resumo curto
    if (transaction.resumo_curto) {
      text += `📋 Resumo: ${transaction.resumo_curto}\n`;
    }
    
    // Add extracted items
    if (itensLancamento && itensLancamento.length > 0) {
      text += `\n🛒 Itens da compra:\n`;
      itensLancamento.forEach(item => {
        let itemText = `  • ${item.nome_item}`;
        if (item.quantidade) itemText += ` (${item.quantidade}x)`;
        if (item.valor) itemText += ` - R$ ${item.valor.toFixed(2)}`;
        text += itemText + '\n';
      });
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

  const hasInstallment = transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        {/* Bloco A - Cabeçalho */}
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

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="px-6 py-4 space-y-4">
            {/* Bloco B - Valores */}
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

            {/* Bloco C - Informações principais em grade */}
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
            </div>

            {/* Bloco D - Informações adicionais */}
            {(transaction.subcategory && transaction.subcategory !== "-") && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Subcategoria</span>
                </div>
                <p className="text-sm text-muted-foreground">{transaction.subcategory}</p>
              </div>
            )}

            {hasInstallment && (
              <div className={cn(
                "p-4 rounded-xl",
                isLastInstallment ? "bg-success/10 border border-success/20" : "bg-secondary/50"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {isLastInstallment ? (
                    <PartyPopper className="w-4 h-4 text-success" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isLastInstallment ? "text-success" : "text-foreground"
                  )}>
                    {isLastInstallment ? "🎉 Última Parcela!" : "Parcelamento"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Parcela atual</span>
                  <span className={cn(
                    "text-lg font-semibold",
                    isLastInstallment ? "text-success" : "text-foreground"
                  )}>
                    {transaction.installmentNumber}/{transaction.totalInstallments}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        isLastInstallment ? "bg-success" : "bg-primary"
                      )}
                      style={{ 
                        width: `${(transaction.installmentNumber! / transaction.totalInstallments!) * 100}%` 
                      }}
                    />
                  </div>
                  <p className={cn(
                    "text-xs mt-1",
                    isLastInstallment ? "text-success font-medium" : "text-muted-foreground"
                  )}>
                    {isLastInstallment 
                      ? "Parabéns! Você quitou este parcelamento!" 
                      : `${transaction.totalInstallments! - transaction.installmentNumber!} parcelas restantes`}
                  </p>
                </div>
              </div>
            )}

            {/* Bloco E - Comprovantes */}
            <ComprovantesCard lancamentoId={transaction.id} />

            {/* Bloco F - Itens da compra */}
            <ItensCompraCard 
              lancamentoId={transaction.id}
              tags={transaction.tags}
              resumoCurto={transaction.resumo_curto}
              statusExtracao={transaction.status_extracao}
            />

            {/* Bloco G - Observações */}
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Observações</span>
              </div>
              {transaction.observacao && transaction.observacao.trim().length > 0 ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {transaction.observacao}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">
                  Sem observações
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

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
  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          "w-3.5 h-3.5",
          value ? "text-muted-foreground" : "text-muted-foreground/50"
        )} />
        <span className={cn(
          "text-xs",
          value ? "text-muted-foreground" : "text-muted-foreground/50"
        )}>{label}</span>
      </div>
      <p className={cn(
        "text-sm truncate",
        value ? "font-medium text-foreground" : "text-muted-foreground/50"
      )}>
        {value || "Não informado"}
      </p>
    </div>
  );
}
