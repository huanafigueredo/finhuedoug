import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Target, 
  Plus, 
  TrendingUp, 
  CheckCircle,
  Sparkles,
  Calendar,
  Loader2,
  History,
  User,
  Trash2,
  ChevronDown,
  Pencil,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useSavingsGoals, 
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  SavingsGoal,
  GoalOwnerFilter,
} from "@/hooks/useSavingsGoals";
import { useCreateSavingsDeposit, useSavingsDeposits, useDeleteSavingsDeposit, SavingsDeposit } from "@/hooks/useSavingsDeposits";
import { useBanks } from "@/hooks/useBanks";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { usePersonNames } from "@/hooks/useUserSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💻", "📱", "🎓", "💍", "🎁", "🏖️", "💰", "🎮"];

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

interface GoalItemProps {
  goal: SavingsGoal;
  showDepositor?: boolean;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
  isDeleting?: boolean;
}

function GoalItem({ goal, showDepositor, onEdit, onDelete, isDeleting }: GoalItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<SavingsDeposit | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [depositor, setDepositor] = useState<"person1" | "person2">("person1");
  const createDeposit = useCreateSavingsDeposit();
  const deleteDeposit = useDeleteSavingsDeposit();
  const { toast } = useToast();
  const { person1, person2 } = usePersonNames();
  const { data: deposits = [] } = useSavingsDeposits(goal.id);
  const { data: banks = [] } = useBanks();

  const getDepositorName = (depositedBy: string) => {
    return depositedBy === "person1" ? person1 : person2;
  };

  const handleDeleteDeposit = async () => {
    if (!depositToDelete) return;
    
    try {
      await deleteDeposit.mutateAsync({
        id: depositToDelete.id,
        goalId: depositToDelete.goal_id,
        amount: depositToDelete.amount,
      });
      toast({
        title: "Depósito removido",
        description: `Depósito de ${formatCurrency(depositToDelete.amount)} foi removido.`,
      });
      setDepositToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível remover o depósito.",
        variant: "destructive",
      });
    }
  };

  const percentage = Math.min(
    Math.round((goal.current_amount / goal.target_amount) * 100),
    100
  );
  const isCompleted = goal.current_amount >= goal.target_amount;
  const remaining = goal.target_amount - goal.current_amount;

  const daysRemaining = goal.deadline
    ? differenceInDays(parseISO(goal.deadline), new Date())
    : null;

  const formatCurrencyInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const cents = parseInt(cleaned) || 0;
    if (cents === 0) return "";
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/\D/g, "");
    return parseInt(cleaned) || 0;
  };

  const handleAddAmount = async () => {
    const cents = parseCurrencyInput(addAmount);
    if (cents <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeposit.mutateAsync({ 
        goal_id: goal.id, 
        amount: cents,
        deposited_by: showDepositor ? depositor : "person1",
      });
      const depositorName = depositor === "person1" ? person1 : person2;
      toast({
        title: "Valor adicionado! 🎉",
        description: showDepositor 
          ? `R$ ${formatCurrencyInput(addAmount)} adicionado por ${depositorName} à meta "${goal.title}"`
          : `R$ ${formatCurrencyInput(addAmount)} adicionado à meta "${goal.title}"`,
      });
      setAddAmount("");
      setIsAddingOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível adicionar o valor.",
        variant: "destructive",
      });
    }
  };

  // Calcular contribuições por pessoa
  const person1Deposits = deposits
    .filter(d => d.deposited_by === "person1")
    .reduce((sum, d) => sum + d.amount, 0);
  const person2Deposits = deposits
    .filter(d => d.deposited_by === "person2")
    .reduce((sum, d) => sum + d.amount, 0);

  const bankName = goal.bank_id ? banks.find(b => b.id === goal.bank_id)?.name : null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn(
          "rounded-xl border transition-all",
          isCompleted 
            ? "bg-success/5 border-success/20" 
            : "bg-card border-border hover:border-primary/30"
        )}>
          <CollapsibleTrigger className="w-full p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{goal.icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{goal.title}</span>
                  {isCompleted && (
                    <Badge variant="success" className="text-[10px] py-0 h-4">
                      <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                      Concluída
                    </Badge>
                  )}
                </div>
                <Progress
                  value={percentage}
                  className={cn(
                    "h-1.5 mt-1.5",
                    isCompleted && "[&>div]:bg-success",
                    !isCompleted && "[&>div]:bg-primary"
                  )}
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                  <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                  <span className="text-primary font-medium">{percentage}%</span>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                isOpen && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
              {/* Info adicional */}
              <div className="flex flex-wrap gap-2 pt-3 text-xs text-muted-foreground">
                {!isCompleted && remaining > 0 && (
                  <span className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md">
                    Faltam {formatCurrency(remaining)}
                  </span>
                )}
                {daysRemaining !== null && daysRemaining > 0 && !isCompleted && (
                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                    <Calendar className="w-3 h-3" />
                    {daysRemaining} dias
                  </span>
                )}
                {bankName && (
                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                    <Building2 className="w-3 h-3" />
                    {bankName}
                  </span>
                )}
              </div>

              {/* Contribuições por pessoa (metas casal) */}
              {showDepositor && deposits.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {person1}: {formatCurrency(person1Deposits)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    {person2}: {formatCurrency(person2Deposits)}
                  </span>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                {!isCompleted && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setIsAddingOpen(true)}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Depositar
                  </Button>
                )}
                {deposits.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsHistoryOpen(true)}
                    className="h-8 text-xs"
                  >
                    <History className="w-3 h-3 mr-1" />
                    Histórico
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(goal)}
                  className="h-8 text-xs"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(goal)}
                  disabled={isDeleting}
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="w-3 h-3 mr-1" />
                  )}
                  Excluir
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Dialog Adicionar Depósito */}
      <Dialog open={isAddingOpen} onOpenChange={setIsAddingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{goal.icon}</span>
              Adicionar à meta
            </DialogTitle>
            <DialogDescription>
              Meta: {goal.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {showDepositor && (
              <div className="space-y-2">
                <Label>Quem está depositando?</Label>
                <Select value={depositor} onValueChange={(v) => setDepositor(v as "person1" | "person2")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person1">{person1}</SelectItem>
                    <SelectItem value="person2">{person2}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor a adicionar</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={addAmount}
                  onChange={(e) => setAddAmount(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Atual: {formatCurrency(goal.current_amount)} → 
              Novo: {formatCurrency(goal.current_amount + parseCurrencyInput(addAmount))}
            </div>
            <Button
              onClick={handleAddAmount}
              disabled={createDeposit.isPending}
              className="w-full"
            >
              {createDeposit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Adicionar valor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{goal.icon}</span>
              Histórico de Depósitos
            </DialogTitle>
            <DialogDescription>
              {goal.title} - {deposits.length} depósito{deposits.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          
          {deposits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum depósito registrado ainda.
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-3 pr-4">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                        deposit.deposited_by === "person1" 
                          ? "bg-primary/20 text-primary" 
                          : "bg-secondary text-secondary-foreground"
                      )}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {getDepositorName(deposit.deposited_by)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(deposit.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-success">
                        +{formatCurrency(deposit.amount)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDepositToDelete(deposit)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {deposits.length > 0 && (
            <div className="pt-3 border-t border-border/50 mt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {person1}: {formatCurrency(person1Deposits)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    {person2}: {formatCurrency(person2Deposits)}
                  </span>
                </div>
                <span className="font-semibold text-success">
                  Total: {formatCurrency(goal.current_amount)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão de depósito */}
      <AlertDialog open={!!depositToDelete} onOpenChange={() => setDepositToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover depósito?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover o depósito de{" "}
              <strong>{depositToDelete && formatCurrency(depositToDelete.amount)}</strong>{" "}
              feito por{" "}
              <strong>{depositToDelete && getDepositorName(depositToDelete.deposited_by)}</strong>.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeposit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDeposit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface SavingsGoalsCardProps {
  className?: string;
  showConfigLink?: boolean;
  ownerFilter?: GoalOwnerFilter;
  showDepositor?: boolean;
  ownerLabel?: string;
}

export function SavingsGoalsCard({ 
  className, 
  showConfigLink = true,
  ownerFilter,
  showDepositor = false,
  ownerLabel,
}: SavingsGoalsCardProps) {
  const { data: goals = [], isLoading } = useSavingsGoals(ownerFilter);
  const { data: banks = [] } = useBanks();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrencyInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    const cents = parseInt(cleaned) || 0;
    if (cents === 0) return "";
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/\D/g, "");
    return parseInt(cleaned) || 0;
  };

  const resetForm = () => {
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setDeadline("");
    setSelectedIcon("🎯");
    setSelectedBankId(null);
    setEditingGoal(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(formatCurrencyInput(String(goal.target_amount)));
    setCurrentAmount(formatCurrencyInput(String(goal.current_amount)));
    setDeadline(goal.deadline || "");
    setSelectedIcon(goal.icon);
    setSelectedBankId(goal.bank_id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título para a meta.",
        variant: "destructive",
      });
      return;
    }

    const targetCents = parseCurrencyInput(targetAmount);
    if (targetCents <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor alvo maior que zero.",
        variant: "destructive",
      });
      return;
    }

    const currentCents = parseCurrencyInput(currentAmount);

    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          id: editingGoal.id,
          title: title.trim(),
          target_amount: targetCents,
          current_amount: currentCents,
          deadline: deadline || null,
          icon: selectedIcon,
          bank_id: selectedBankId,
        });
        toast({
          title: "Meta atualizada!",
          description: `A meta "${title}" foi atualizada com sucesso.`,
        });
      } else {
        await createGoal.mutateAsync({
          title: title.trim(),
          target_amount: targetCents,
          current_amount: currentCents,
          deadline: deadline || null,
          icon: selectedIcon,
          owner: ownerFilter || "couple",
          bank_id: selectedBankId,
        });
        toast({
          title: "Meta criada! 🎯",
          description: `A meta "${title}" foi criada com sucesso.`,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar a meta.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (goal: SavingsGoal) => {
    setDeletingId(goal.id);
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast({
        title: "Meta removida",
        description: `A meta "${goal.title}" foi removida.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível remover a meta.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.current_amount < g.target_amount);
  const completedGoals = goals.filter(g => g.current_amount >= g.target_amount);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  return (
    <>
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-success" />
              </div>
              {ownerLabel ? `Metas de ${ownerLabel}` : "Metas de Economia"}
            </CardTitle>
            {showConfigLink && (
              <Link
                to="/metas"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todas
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Botão Nova Meta */}
          <Button
            variant="outline"
            size="sm"
            onClick={openAddDialog}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>

          {goals.length === 0 ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma meta definida
              </p>
            </div>
          ) : (
            <>
              {/* Lista de metas ativas */}
              <div className="space-y-2">
                {activeGoals.map((goal, index) => (
                  <div key={goal.id} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <GoalItem 
                      goal={goal} 
                      showDepositor={showDepositor}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      isDeleting={deletingId === goal.id}
                    />
                  </div>
                ))}
              </div>

              {/* Lista de metas concluídas */}
              {completedGoals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium pt-2">
                    Concluídas ({completedGoals.length})
                  </p>
                  {completedGoals.map((goal, index) => (
                    <div key={goal.id} className="animate-fade-up" style={{ animationDelay: `${(activeGoals.length + index) * 50}ms` }}>
                      <GoalItem 
                        goal={goal} 
                        showDepositor={showDepositor}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                        isDeleting={deletingId === goal.id}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Resumo */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total guardado</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(totalSaved)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar Meta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar Meta" : "Nova Meta"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Atualize os detalhes da sua meta."
                : `Defina uma nova meta ${ownerLabel ? `para ${ownerLabel}` : ""}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Seletor de Ícone */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                      selectedIcon === emoji
                        ? "bg-primary/15 ring-2 ring-primary"
                        : "bg-secondary hover:bg-secondary/70"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Viagem de férias"
                maxLength={50}
              />
            </div>

            {/* Valor Alvo */}
            <div className="space-y-2">
              <Label>Valor alvo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Valor Atual */}
            <div className="space-y-2">
              <Label>Valor já guardado (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Prazo */}
            <div className="space-y-2">
              <Label>Prazo (opcional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Banco */}
            <div className="space-y-2">
              <Label>Banco (opcional)</Label>
              <Select
                value={selectedBankId || "none"}
                onValueChange={(value) => setSelectedBankId(value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex items-center gap-2">
                        {bank.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: bank.color }}
                          />
                        )}
                        {bank.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={createGoal.isPending || updateGoal.isPending}
              className="w-full"
            >
              {(createGoal.isPending || updateGoal.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              {editingGoal ? "Salvar" : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
