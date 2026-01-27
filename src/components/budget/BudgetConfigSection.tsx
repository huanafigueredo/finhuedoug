import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Heart, Save, Trash2, ArrowRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  useCategoryBudgets,
  useUpsertCategoryBudget,
  useDeleteCategoryBudget
} from "@/hooks/useCategoryBudgets";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePersonNames } from "@/hooks/useCoupleMembers";
import { Separator } from "@/components/ui/separator";

interface BudgetInput {
  categoryId: string;
  categoryName: string;

  // Segmented values (formatted strings)
  person1Amount: string;
  person2Amount: string;
  coupleAmount: string;

  existingBudgetId?: string;
  hasChanges: boolean;
}

export function BudgetConfigSection() {
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories("expense");
  const { data: budgets = [], isLoading: budgetsLoading } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();
  const personSettings = usePersonNames();

  const [budgetInputs, setBudgetInputs] = useState<BudgetInput[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const person1Name = personSettings.person1 || "Pessoa 1";
  const person2Name = personSettings.person2 || "Pessoa 2";

  // Inicializar inputs com categorias e orçamentos existentes
  useEffect(() => {
    if (categories.length > 0) {
      const inputs = categories.map((cat) => {
        const existingBudget = budgets.find((b) => b.category_id === cat.id);

        // Se existir um budget_amount mas os segmentos forem 0 (legado),
        // colocamos tudo no Casal como default? Ou dividimos?
        // Vamos checar se é legado: (total > 0 && p1==0 && p2==0 && couple==0)
        const isLegacy = existingBudget && existingBudget.budget_amount > 0 &&
          (!existingBudget.person1_budget) &&
          (!existingBudget.person2_budget) &&
          (!existingBudget.couple_budget);

        let p1Val = existingBudget?.person1_budget || 0;
        let p2Val = existingBudget?.person2_budget || 0;
        let coupleVal = existingBudget?.couple_budget || 0;

        if (isLegacy) {
          // Fallback: atribui tudo ao casal, convertendo de Reais (legado) para Centavos
          coupleVal = existingBudget.budget_amount * 100;
        }

        return {
          categoryId: cat.id,
          categoryName: cat.name,

          person1Amount: p1Val > 0 ? formatCurrencyInput(p1Val / 100) : "",
          person2Amount: p2Val > 0 ? formatCurrencyInput(p2Val / 100) : "",
          coupleAmount: coupleVal > 0 ? formatCurrencyInput(coupleVal / 100) : "",

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
    return parseInt(cleaned) || 0; // Retorna centavos
  };

  const handleInputChange = (categoryId: string, field: 'person1Amount' | 'person2Amount' | 'coupleAmount', value: string) => {
    // Permitir apenas números
    const cleaned = value.replace(/\D/g, "");
    const cents = parseInt(cleaned) || 0;
    const formatted = formatCurrencyInput(cents / 100);

    setBudgetInputs((prev) =>
      prev.map((input) =>
        input.categoryId === categoryId
          ? { ...input, [field]: formatted, hasChanges: true }
          : input
      )
    );
  };

  const handleSave = async (input: BudgetInput) => {
    const p1 = parseCurrencyInput(input.person1Amount); // cents
    const p2 = parseCurrencyInput(input.person2Amount); // cents
    const couple = parseCurrencyInput(input.coupleAmount); // cents
    const totalCents = p1 + p2 + couple;

    if (totalCents === 0 && input.existingBudgetId) {
      // Deletar orçamento existente se valor total for 0
      setSavingId(input.categoryId);
      try {
        await deleteBudget.mutateAsync(input.existingBudgetId);
        toast({
          title: "Orçamento removido",
          description: `O orçamento de ${input.categoryName} foi zerado e removido.`,
        });
        setBudgetInputs((prev) =>
          prev.map((i) =>
            i.categoryId === input.categoryId
              ? { ...i, hasChanges: false, existingBudgetId: undefined, person1Amount: "", person2Amount: "", coupleAmount: "" }
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

    if (totalCents === 0) {
      // Apenas limpa flag de changes se não salvou nada
      setBudgetInputs((prev) =>
        prev.map((i) =>
          i.categoryId === input.categoryId ? { ...i, hasChanges: false } : i
        )
      );
      return;
    }

    setSavingId(input.categoryId);
    try {
      await upsertBudget.mutateAsync({
        category_id: input.categoryId,

        // Salva a SOMA no budget_amount para compatibilidade com outros lugares do app
        budget_amount: totalCents,

        // Salva os segmentos
        person1_budget: p1,
        person2_budget: p2,
        couple_budget: couple,
      });

      toast({
        title: "Orçamentos definidos!",
        description: `Total para ${input.categoryName}: R$ ${formatCurrencyInput(totalCents / 100)}`,
      });

      setBudgetInputs((prev) =>
        prev.map((i) =>
          i.categoryId === input.categoryId ? { ...i, hasChanges: false } : i
        )
      );
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Verifique se você rodou o comando SQL no Supabase para criar as novas colunas.",
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
            ? { ...i, person1Amount: "", person2Amount: "", coupleAmount: "", hasChanges: false, existingBudgetId: undefined }
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
    <div className="space-y-6">
      <div className="px-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Planejamento Detalhado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Defina metas de gastos individuais e para o casal.
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            {definedBudgets.length} categorias
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-20" />
          <p>Carregando categorias...</p>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {budgetInputs.map((input) => {
            const p1Val = parseCurrencyInput(input.person1Amount);
            const p2Val = parseCurrencyInput(input.person2Amount);
            const cVal = parseCurrencyInput(input.coupleAmount);
            const total = (p1Val + p2Val + cVal) / 100;

            return (
              <div
                key={input.categoryId}
                className={cn(
                  "flex flex-col gap-4 p-5 rounded-2xl transition-all border shadow-sm",
                  input.existingBudgetId
                    ? "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                    : "bg-slate-50/50 dark:bg-slate-900/20 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                )}
              >
                {/* Header: Name + Total + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-bold text-slate-700 dark:text-slate-200">
                        {input.categoryName}
                      </Label>
                      {total > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Total: R$ {formatCurrencyInput(total)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={input.hasChanges ? "default" : "ghost"}
                      onClick={() => handleSave(input)}
                      disabled={savingId === input.categoryId || (!input.hasChanges && !input.existingBudgetId)}
                      className={cn(
                        "h-8 px-3 rounded-lg transition-all text-xs font-medium",
                        input.hasChanges ? "shadow-md shadow-primary/20" : "opacity-70 hover:opacity-100 text-slate-400"
                      )}
                    >
                      {savingId === input.categoryId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {input.hasChanges ? "Salvar" : "Salvo"}
                    </Button>

                    {input.existingBudgetId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(input)}
                        disabled={savingId === input.categoryId}
                        className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Inputs Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Person 1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <User className="w-2.5 h-2.5" />
                      </div>
                      <span className="truncate max-w-[80px]">{person1Name.split(' ')[0]}</span>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={input.person1Amount}
                        onChange={(e) => handleInputChange(input.categoryId, 'person1Amount', e.target.value)}
                        placeholder="0,00"
                        className="h-9 pl-7 pr-2 text-sm text-right bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Person 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <User className="w-2.5 h-2.5" />
                      </div>
                      <span className="truncate max-w-[80px]">{person2Name.split(' ')[0]}</span>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={input.person2Amount}
                        onChange={(e) => handleInputChange(input.categoryId, 'person2Amount', e.target.value)}
                        placeholder="0,00"
                        className="h-9 pl-7 pr-2 text-sm text-right bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Couple */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
                        <Heart className="w-2.5 h-2.5" />
                      </div>
                      <span>Casal</span>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={input.coupleAmount}
                        onChange={(e) => handleInputChange(input.categoryId, 'coupleAmount', e.target.value)}
                        placeholder="0,00"
                        className="h-9 pl-7 pr-2 text-sm text-right bg-white dark:bg-slate-950 border-rose-200 dark:border-rose-900/50 focus:border-rose-500 focus:ring-rose-500/20 rounded-xl transition-all shadow-sm shadow-rose-100/50 dark:shadow-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
