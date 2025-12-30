import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Save, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { 
  useCategoryBudgets, 
  useUpsertCategoryBudget, 
  useDeleteCategoryBudget 
} from "@/hooks/useCategoryBudgets";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BudgetInput {
  categoryId: string;
  categoryName: string;
  budgetAmount: string;
  existingBudgetId?: string;
  hasChanges: boolean;
}

export function BudgetConfigCard() {
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories("expense");
  const { data: budgets = [], isLoading: budgetsLoading } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();

  const [budgetInputs, setBudgetInputs] = useState<BudgetInput[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length > 0) {
      const inputs = categories.map((cat) => {
        const existingBudget = budgets.find((b) => b.category_id === cat.id);
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          budgetAmount: existingBudget 
            ? formatCurrencyInput(existingBudget.budget_amount / 100) 
            : "",
          existingBudgetId: existingBudget?.id,
          hasChanges: false,
        };
      });
      setBudgetInputs(inputs);
    }
  }, [categories, budgets]);

  const formatCurrencyInput = (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value.replace(/\D/g, "")) / 100 : value;
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/\D/g, "");
    return parseInt(cleaned) || 0;
  };

  const handleInputChange = (categoryId: string, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const cents = parseInt(cleaned) || 0;
    const formatted = formatCurrencyInput(cents / 100);

    setBudgetInputs((prev) =>
      prev.map((input) =>
        input.categoryId === categoryId
          ? { ...input, budgetAmount: formatted, hasChanges: true }
          : input
      )
    );
  };

  const handleSave = async (input: BudgetInput) => {
    const cents = parseCurrencyInput(input.budgetAmount);
    
    if (cents === 0 && input.existingBudgetId) {
      setSavingId(input.categoryId);
      try {
        await deleteBudget.mutateAsync(input.existingBudgetId);
        toast({
          title: "Orçamento removido",
          description: `O orçamento de ${input.categoryName} foi removido.`,
        });
        setBudgetInputs((prev) =>
          prev.map((i) =>
            i.categoryId === input.categoryId
              ? { ...i, hasChanges: false, existingBudgetId: undefined }
              : i
          )
        );
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível remover o orçamento.",
          variant: "destructive",
        });
      } finally {
        setSavingId(null);
      }
      return;
    }

    if (cents === 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(input.categoryId);
    try {
      await upsertBudget.mutateAsync({
        category_id: input.categoryId,
        budget_amount: cents,
      });
      toast({
        title: "Orçamento salvo!",
        description: `Orçamento de ${input.categoryName}: R$ ${formatCurrencyInput(cents / 100)}`,
      });
      setBudgetInputs((prev) =>
        prev.map((i) =>
          i.categoryId === input.categoryId ? { ...i, hasChanges: false } : i
        )
      );
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (input: BudgetInput) => {
    if (!input.existingBudgetId) return;

    setSavingId(input.categoryId);
    try {
      await deleteBudget.mutateAsync(input.existingBudgetId);
      toast({
        title: "Orçamento removido",
        description: `O orçamento de ${input.categoryName} foi removido.`,
      });
      setBudgetInputs((prev) =>
        prev.map((i) =>
          i.categoryId === input.categoryId
            ? { ...i, budgetAmount: "", hasChanges: false, existingBudgetId: undefined }
            : i
        )
      );
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível remover o orçamento.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const isLoading = categoriesLoading || budgetsLoading;
  const definedBudgets = budgetInputs.filter((b) => b.existingBudgetId);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            Configurar Limites
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {definedBudgets.length} definidos
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Defina limites mensais para cada categoria. Alertas em 80% e 100%.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Carregando categorias...
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {budgetInputs.map((input, index) => (
              <div
                key={input.categoryId}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                  "animate-fade-up opacity-0",
                  input.existingBudgetId 
                    ? "bg-success/5 border border-success/20" 
                    : "bg-secondary/30 border border-transparent"
                )}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {input.categoryName}
                    </span>
                    {input.existingBudgetId && !input.hasChanges && (
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={input.budgetAmount}
                      onChange={(e) => handleInputChange(input.categoryId, e.target.value)}
                      placeholder="0,00"
                      className="w-28 sm:w-32 pl-9 text-right h-9"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant={input.hasChanges ? "default" : "ghost"}
                    onClick={() => handleSave(input)}
                    disabled={savingId === input.categoryId || (!input.hasChanges && !input.existingBudgetId)}
                    className="shrink-0 h-9 w-9"
                  >
                    {savingId === input.categoryId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  {input.existingBudgetId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(input)}
                      disabled={savingId === input.categoryId}
                      className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
