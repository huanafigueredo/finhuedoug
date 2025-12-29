import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  CheckCircle,
  Calendar,
  Building2,
} from "lucide-react";
import { 
  useSavingsGoals, 
  useCreateSavingsGoal, 
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  SavingsGoal,
  GoalOwnerFilter,
} from "@/hooks/useSavingsGoals";
import { useBanks } from "@/hooks/useBanks";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💻", "📱", "🎓", "💍", "🎁", "🏖️", "💰", "🎮"];

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

interface SavingsGoalsConfigSectionProps {
  ownerFilter?: GoalOwnerFilter;
  ownerLabel?: string;
}

export function SavingsGoalsConfigSection({ ownerFilter, ownerLabel }: SavingsGoalsConfigSectionProps) {
  const { toast } = useToast();
  const { data: goals = [], isLoading } = useSavingsGoals(ownerFilter);
  const { data: banks = [] } = useBanks();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

    setSavingId(editingGoal?.id || "new");
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
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (goal: SavingsGoal) => {
    setSavingId(goal.id);
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
      setSavingId(null);
    }
  };

  const activeGoals = goals.filter((g) => g.current_amount < g.target_amount);
  const completedGoals = goals.filter((g) => g.current_amount >= g.target_amount);

  const sectionTitle = ownerLabel ? `Metas de ${ownerLabel}` : "Metas de Economia";

  return (
    <>
      <AccordionItem
        value="savings-goals"
        className="rounded-2xl bg-card border border-border shadow-card overflow-hidden"
      >
        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              {sectionTitle}
            </span>
            <Badge variant="secondary" className="text-xs">
              {goals.length} meta{goals.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Defina metas de economia para acompanhar seu progresso rumo aos seus objetivos financeiros.
          </p>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Goals */}
              {activeGoals.map((goal) => {
                const percentage = Math.round((goal.current_amount / goal.target_amount) * 100);
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-xl bg-secondary/30 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{goal.icon}</span>
                        <span className="text-sm font-medium text-foreground">
                          {goal.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditDialog(goal)}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                          disabled={savingId === goal.id}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          disabled={savingId === goal.id}
                        >
                          {savingId === goal.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2 [&>div]:bg-primary" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </span>
                      <span className="text-primary">{percentage}%</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Prazo: {format(parseISO(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                    {goal.bank_id && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {banks.find(b => b.id === goal.bank_id)?.name || "Banco"}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Completed Goals */}
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-success/5 border border-success/20 space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{goal.icon}</span>
                      <span className="text-sm font-medium text-foreground">
                        {goal.title}
                      </span>
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Concluída
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(goal)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        disabled={savingId === goal.id}
                      >
                        {savingId === goal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-success">
                    🎉 {formatCurrency(goal.current_amount)} guardados!
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={openAddDialog}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar Meta" : "Nova Meta de Economia"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Atualize os detalhes da sua meta."
                : `Defina uma nova meta ${ownerLabel ? `para ${ownerLabel}` : ""} para acompanhar seu progresso.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Icon Selector */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
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

            {/* Title */}
            <div className="space-y-2">
              <Label>Título da meta</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Viagem de férias"
                maxLength={50}
              />
            </div>

            {/* Target Amount */}
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

            {/* Current Amount */}
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

            {/* Deadline */}
            <div className="space-y-2">
              <Label>Prazo (opcional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Bank Selector */}
            <div className="space-y-2">
              <Label>Banco onde está guardado (opcional)</Label>
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
              disabled={savingId !== null}
              className="w-full"
            >
              {savingId !== null ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              {editingGoal ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
