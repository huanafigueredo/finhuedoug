import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  PartyPopper,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ComprovantesCard } from "@/components/comprovantes/ComprovantesCard";
import { ItensCompraCard } from "@/components/comprovantes/ItensCompraCard";
import { useItensLancamento } from "@/hooks/useComprovantes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import confetti from 'canvas-confetti';
import { TransactionSplitEditor } from "@/components/transaction/TransactionSplitEditor";
import { useUpdateTransactionSplit } from "@/hooks/useUpdateTransactionSplit";

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
  installmentValue?: number;
  tags?: string[];
  resumo_curto?: string;
  status_extracao?: string;
  // New fields for dynamic installments
  firstInstallmentDate?: Date;
  startInstallment?: number;
  // Savings goal link
  savingsDepositId?: string | null;
  // Split fields for proportional/custom division
  person1Share?: number;
  person2Share?: number;
  person1Name?: string;
  person2Name?: string;
  splitPercentages?: { person1: number; person2: number };
}

// Hook to fetch savings goal info via deposit
function useSavingsGoalFromDeposit(savingsDepositId: string | null | undefined) {
  return useQuery({
    queryKey: ["savings-goal-from-deposit", savingsDepositId],
    queryFn: async () => {
      if (!savingsDepositId) return null;

      // 1. Get the deposit to find goal_id
      const { data: deposit, error: depositError } = await supabase
        .from("savings_deposits")
        .select("goal_id")
        .eq("id", savingsDepositId)
        .single();

      if (depositError || !deposit) return null;

      // 2. Get the goal info
      const { data: goal, error: goalError } = await supabase
        .from("savings_goals")
        .select("id, title, icon, current_amount, target_amount")
        .eq("id", deposit.goal_id)
        .single();

      if (goalError) return null;
      return goal;
    },
    enabled: !!savingsDepositId,
  });
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
  const { data: linkedGoal } = useSavingsGoalFromDeposit(transaction?.savingsDepositId);
  const [showCelebration, setShowCelebration] = useState(false);
  const updateSplitMutation = useUpdateTransactionSplit();
  
  const handleSaveSplit = async (person1Percentage: number, person2Percentage: number) => {
    if (!transaction) return;
    
    await updateSplitMutation.mutateAsync({
      transactionId: transaction.id,
      person1Percentage,
      person2Percentage,
    });
    
    toast({
      title: "Divisão atualizada",
      description: `Nova divisão: ${person1Percentage}/${person2Percentage}`,
    });
  };

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

  const isMobile = useIsMobile();

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
    
    if (transaction.tags && transaction.tags.length > 0) {
      text += `🏷️ Tags: ${transaction.tags.join(', ')}\n`;
    }
    
    if (transaction.resumo_curto) {
      text += `📋 Resumo: ${transaction.resumo_curto}\n`;
    }
    
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

  const modalTitle = "Detalhes do lançamento";

  const footerButtons = (
    <div className="flex items-center justify-between w-full gap-3">
      <Button
        variant="outline"
        size="lg"
        onClick={handleCopyDetails}
        className="flex-1 gap-2 rounded-xl h-11"
      >
        <Copy className="w-4 h-4" />
        <span className="hidden sm:inline">Copiar detalhes</span>
        <span className="sm:hidden">Copiar</span>
      </Button>
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onOpenChange(false)}
          className="flex-1 h-11 rounded-xl"
        >
          Fechar
        </Button>
        <Button
          size="lg"
          onClick={handleEdit}
          className="flex-1 gap-2 h-11 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
      </div>
    </div>
  );

  const dialogContent = (
    <div className="px-6 py-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Info */}
        <div className="md:col-span-7 space-y-8">
          {/* Main Value Display */}
          <div className={cn(
            "p-8 rounded-3xl border border-border/50 relative overflow-hidden transition-all",
            transaction.type === "income" ? "bg-success/5 border-success/10" : "bg-muted/20"
          )}>
            <div className="flex items-center justify-between mb-4 relative z-10">
               <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                 {transaction.type === "income" ? "Valor recebido" : "Valor total"}
               </span>
               <Badge variant={transaction.type} className="h-6" />
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-2xl font-bold text-muted-foreground">R$</span>
              <span className={cn(
                "text-5xl font-black tracking-tighter",
                transaction.type === "income" ? "text-success" : "text-foreground"
              )}>
                {transaction.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {/* Background Decoration Icon */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] scale-[4]">
               {transaction.type === "income" ? <PartyPopper size={48} /> : <FileText size={48} />}
            </div>

            {transaction.isCouple && (
              <div className="mt-8 pt-6 border-t border-border/50 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Divisão do Casal</span>
                  </div>
                  {transaction.splitPercentages && transaction.splitPercentages.person1 !== 50 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground">PROPORCIONAL</span>
                  )}
                </div>
                
                {transaction.person1Share !== undefined && transaction.person2Share !== undefined ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{transaction.person1Name} ({transaction.splitPercentages?.person1 || 50}%)</p>
                      <p className="text-xl font-black text-foreground">{formatCurrency(transaction.person1Share)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{transaction.person2Name} ({transaction.splitPercentages?.person2 || 50}%)</p>
                      <p className="text-xl font-black text-foreground">{formatCurrency(transaction.person2Share)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-black">{formatCurrency(transaction.valuePerPerson)} <span className="text-xs font-medium text-muted-foreground">p/ pessoa</span></p>
                )}
                
                <div className="mt-4">
                  <TransactionSplitEditor
                    currentPerson1Percentage={transaction.splitPercentages?.person1 || 50}
                    currentPerson2Percentage={transaction.splitPercentages?.person2 || 50}
                    onSave={handleSaveSplit}
                    isLoading={updateSplitMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observations */}
          <ObservacoesSection observacao={transaction.observacao} />

          {/* Itens da Compra */}
          <ItensCompraCard 
            lancamentoId={transaction.id}
            tags={transaction.tags}
            resumoCurto={transaction.resumo_curto}
            statusExtracao={transaction.status_extracao}
          />
        </div>

        {/* RIGHT COLUMN: Metadata & Sections */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-6 p-6 rounded-3xl bg-muted/40 border border-border/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Informações do Registro
            </h3>

            <div className="grid grid-cols-1 gap-5">
              <DetailItem icon={Calendar} label="Data do Lançamento" value={transaction.date} />
              <DetailItem icon={Tag} label="Categoria Principal" value={transaction.category !== "-" ? transaction.category : "Sem categoria"} />
              {(transaction.subcategory && transaction.subcategory !== "-") && (
                <DetailItem icon={Tag} label="Subcategoria" value={transaction.subcategory} />
              )}
              <DetailItem icon={User} label="Quem efetuou o pagamento" value={transaction.person !== "-" ? transaction.person : "Não informado"} />
              <DetailItem icon={Target} label="Destinado para" value={transaction.forWho !== "-" ? transaction.forWho : "Geral"} />
              <DetailItem icon={CreditCard} label="Método & Instituição" value={`${transaction.paymentMethod} • ${transaction.bank}`} />
            </div>
          </div>

          {hasInstallment && (
            <InstallmentSection 
              transaction={transaction}
              isLastInstallment={isLastInstallment}
            />
          )}

          {linkedGoal && (
            <SavingsGoalSection goal={linkedGoal} />
          )}

          <div className="p-2">
             <ComprovantesCard lancamentoId={transaction.id} />
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] rounded-t-[32px]">
          <DrawerHeader className="px-6 pt-4 pb-2 text-center border-b border-border/50">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
            <DrawerTitle className="text-xl font-black">{modalTitle}</DrawerTitle>
            <p className="text-sm text-muted-foreground font-medium mt-1">{transaction.description}</p>
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-auto px-0">
             <div className="pb-32">
               {dialogContent}
             </div>
          </ScrollArea>
          <DrawerFooter className="absolute bottom-0 left-0 right-0 pt-4 pb-8 px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl ring-1 ring-black/5">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black tracking-tight">{modalTitle}</DialogTitle>
              <p className="text-lg text-muted-foreground font-medium">{transaction.description}</p>
            </div>
            {isLastInstallment && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success border border-success/20 animate-bounce">
                <PartyPopper className="w-5 h-5" />
                <span className="text-sm font-black">QUITAÇÃO!</span>
              </div>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(92vh-180px)]">
          {dialogContent}
        </ScrollArea>
        <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/10">
          {footerButtons}
        </DialogFooter>
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
    <div className="flex items-start gap-3 group">
      <div className="p-2 rounded-xl bg-background border border-border/50 group-hover:border-primary/30 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value || "---"}</p>
      </div>
    </div>
  );
}

function ObservacoesSection({ observacao }: { observacao?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = observacao && observacao.trim().length > 0;
  const isLong = hasContent && observacao.length > 200;

  return (
    <div className="p-6 rounded-3xl bg-muted/40 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Observações</h3>
      </div>
      {hasContent ? (
        <div className="space-y-2">
          <p className={cn(
            "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
            !expanded && isLong && "line-clamp-6"
          )}>
            {observacao}
          </p>
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10"
            >
              {expanded ? "Ver menos" : "Ver mais detalhes"}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic font-medium">Nenhuma observação registrada.</p>
      )}
    </div>
  );
}

function InstallmentSection({ 
  transaction, 
  isLastInstallment 
}: { 
  transaction: TransactionDetails;
  isLastInstallment: boolean | undefined;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateEndDate = () => {
    if (!transaction.totalInstallments || !transaction.installmentNumber) {
      return null;
    }
    
    try {
      let baseDate: Date;
      if (transaction.firstInstallmentDate) {
        baseDate = transaction.firstInstallmentDate;
        const startInstallment = transaction.startInstallment || 1;
        const monthsToEnd = transaction.totalInstallments - startInstallment;
        const endDate = addMonths(baseDate, monthsToEnd);
        return format(endDate, "MMMM 'de' yyyy", { locale: ptBR });
      }
      
      const parts = transaction.date.split('/');
      if (parts.length !== 3) return null;
      const currentDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const monthsToAdd = transaction.totalInstallments - transaction.installmentNumber;
      const endDate = addMonths(currentDate, monthsToAdd);
      return format(endDate, "MMMM 'de' yyyy", { locale: ptBR });
    } catch { return null; }
  };

  const endDate = calculateEndDate();
  const installmentValue = transaction.installmentValue || (transaction.totalValue / (transaction.totalInstallments || 1));
  const progress = (transaction.installmentNumber! / transaction.totalInstallments!) * 100;

  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all",
      isLastInstallment ? "bg-success/5 border-success/20" : "bg-muted/40 border-border/50"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", isLastInstallment ? "bg-success/20" : "bg-primary/20")}>
             {isLastInstallment ? <PartyPopper className="w-4 h-4 text-success" /> : <CreditCard className="w-4 h-4 text-primary" />}
          </div>
          <h3 className={cn("text-xs font-black uppercase tracking-widest", isLastInstallment ? "text-success" : "text-muted-foreground")}>
            {isLastInstallment ? "Última Parcela!" : "Parcelamento"}
          </h3>
        </div>
        <Badge variant={isLastInstallment ? "success" : "default"}>{transaction.installmentNumber} de {transaction.totalInstallments}</Badge>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <span className="text-xs font-bold text-muted-foreground uppercase">Valor Mensal</span>
           <span className={cn("text-xl font-black", isLastInstallment ? "text-success" : "text-primary")}>{formatCurrency(installmentValue)}</span>
        </div>
        
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
              <span>Progresso</span>
              <span>{progress.toFixed(0)}%</span>
           </div>
           <div className="h-3 rounded-full bg-background border border-border/50 overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000 ease-out", isLastInstallment ? "bg-success" : "bg-primary")}
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {endDate && !isLastInstallment && (
          <p className="text-xs text-center text-muted-foreground font-medium pt-2 border-t border-border/20">
            Quitação prevista para <span className="text-foreground font-black capitalize">{endDate}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function SavingsGoalSection({ 
  goal 
}: { 
  goal: { id: string; title: string; icon: string | null; current_amount: number; target_amount: number } 
}) {
  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueInCents / 100);
  };

  const progress = goal.target_amount > 0 
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0;

  return (
    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Meta de Economia</h3>
        </div>
        <Link to="/metas">
          <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            METAS <ArrowUpRight className="ml-1 w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
           <span className="text-3xl bg-background w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm border border-border/30">{goal.icon || "🎯"}</span>
           <div className="space-y-1">
             <p className="text-sm font-black text-foreground">{goal.title}</p>
             <p className="text-xs font-bold text-muted-foreground">{formatCurrency(goal.current_amount)} acumulados</p>
           </div>
        </div>

        <div className="space-y-2">
           <div className="h-2.5 rounded-full bg-background border border-border/50 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
           </div>
           <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
              <span>{progress.toFixed(0)}% concluído</span>
              <span>Alvo: {formatCurrency(goal.target_amount)}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
