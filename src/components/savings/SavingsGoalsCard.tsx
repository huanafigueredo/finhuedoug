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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useSavingsGoals, 
  SavingsGoal,
  GoalOwnerFilter,
} from "@/hooks/useSavingsGoals";
import { useCreateSavingsDeposit, useSavingsDeposits } from "@/hooks/useSavingsDeposits";
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

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

interface GoalItemProps {
  goal: SavingsGoal;
  showDepositor?: boolean;
}

function GoalItem({ goal, showDepositor }: GoalItemProps) {
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [depositor, setDepositor] = useState<"person1" | "person2">("person1");
  const createDeposit = useCreateSavingsDeposit();
  const { toast } = useToast();
  const { person1, person2 } = usePersonNames();
  const { data: deposits = [] } = useSavingsDeposits(goal.id);

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

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{goal.icon}</span>
            <span className="text-sm font-medium text-foreground">
              {goal.title}
            </span>
            {isCompleted && (
              <Badge variant="success" className="text-xs py-0 h-5">
                <CheckCircle className="w-3 h-3 mr-1" />
                Concluída
              </Badge>
            )}
          </div>
          {!isCompleted && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAddingOpen(true)}
              className="h-7 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
          )}
        </div>

        <div className="relative">
          <Progress
            value={percentage}
            className={cn(
              "h-2",
              isCompleted && "[&>div]:bg-success",
              !isCompleted && "[&>div]:bg-primary"
            )}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
          </span>
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <span className="text-primary">
                Faltam {formatCurrency(remaining)}
              </span>
            )}
            {daysRemaining !== null && daysRemaining > 0 && !isCompleted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {daysRemaining}d
              </span>
            )}
          </div>
        </div>

        {/* Mostrar contribuições por pessoa em metas do casal */}
        {showDepositor && deposits.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">
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
      </div>

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
            {/* Seletor de quem está depositando (apenas para metas do casal) */}
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
    </>
  );
}

interface SavingsGoalsCardProps {
  className?: string;
  showConfigLink?: boolean;
  ownerFilter?: GoalOwnerFilter;
  showDepositor?: boolean;
}

export function SavingsGoalsCard({ 
  className, 
  showConfigLink = true,
  ownerFilter,
  showDepositor = false,
}: SavingsGoalsCardProps) {
  const { data: goals = [], isLoading } = useSavingsGoals(ownerFilter);

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-success" />
            </div>
            Metas de Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-success" />
            </div>
            Metas de Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma meta definida
            </p>
            {showConfigLink && (
              <Link
                to="/metas"
                className="text-sm text-primary hover:underline"
              >
                Criar metas →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(
    (g) => g.current_amount < g.target_amount
  );
  const completedGoals = goals.filter(
    (g) => g.current_amount >= g.target_amount
  );

  // Mostrar até 3 metas ativas + resumo de concluídas
  const displayGoals = activeGoals.slice(0, 3);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-success" />
            </div>
            Metas de Economia
          </CardTitle>
          {showConfigLink && (
            <Link
              to="/metas"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Gerenciar
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goals List */}
        <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
          {displayGoals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} showDepositor={showDepositor} />
          ))}
        </div>

        {activeGoals.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{activeGoals.length - 3} outras metas ativas
          </p>
        )}

        {/* Summary Footer */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total guardado</p>
              <p className="font-semibold text-success">
                {formatCurrency(totalSaved)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {completedGoals.length} meta{completedGoals.length !== 1 ? "s" : ""} concluída{completedGoals.length !== 1 ? "s" : ""}
              </p>
              <p className="font-semibold text-foreground">
                {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% do total
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
