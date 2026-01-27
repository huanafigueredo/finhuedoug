import { AppLayout } from "@/components/layout/AppLayout";
import { BudgetConfigSection } from "@/components/budget/BudgetConfigSection";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";
import { BudgetAIAdvisor } from "@/components/budget/BudgetAIAdvisor";
import { BudgetMonthSelector } from "@/components/budget/BudgetMonthSelector";
import { useBudgetProgress, PersonFilter } from "@/hooks/useBudgetProgress";
import { useTransactions } from "@/hooks/useTransactions";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useSplitSettings } from "@/hooks/useSplitSettings";
import { useCoupleMembers } from "@/hooks/useCoupleMembers";
import { useCategorySplits, getCategorySplit } from "@/hooks/useCategorySplits";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, TrendingUp, TrendingDown, DollarSign, Calendar, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { shouldShowInMonth, getTransactionMonthValue } from "@/lib/transactionUtils";

// Import fallback avatars
import avatarPerson1 from "@/assets/avatar-person1.jpg";
import avatarPerson2 from "@/assets/avatar-person2.jpg";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Refinada: Avatar com anel suave e sombra colorida
function PersonAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-950 flex items-center justify-center font-display font-bold text-primary overflow-hidden ring-2 ring-white dark:ring-gray-900 shadow-lg shadow-black/5",
        sizeClasses[size]
      )}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default function Orcamentos() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedTab, setSelectedTab] = useState<PersonFilter>("all");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [detailsCategory, setDetailsCategory] = useState<string | null>(null);

  const { data: transactions = [] } = useTransactions();
  const personSettings = usePersonNames();

  // Hooks for value calculation consistency
  const { data: splitSettings } = useSplitSettings();
  const { data: members = [] } = useCoupleMembers();
  const { data: categorySplits = [] } = useCategorySplits();

  const monthIndex = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const person1Name = personSettings.person1 || "Huana";
  const person2Name = personSettings.person2 || "Douglas";
  const person1Avatar = personSettings.person1Avatar || avatarPerson1;
  const person2Avatar = personSettings.person2Avatar || avatarPerson2;

  const budgetSummary = useBudgetProgress(
    transactions,
    monthIndex,
    year,
    selectedTab,
    person1Name,
    person2Name
  );

  // ... (handlePrevMonth, handleNextMonth kept same by context usually, but ensuring below matches block)

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getFilterLabel = () => {
    switch (selectedTab) {
      case "person1": return person1Name;
      case "person2": return person2Name;
      case "couple": return "Casal";
      default: return "Todos";
    }
  };

  // Helper to calculate split matching useBudgetProgress logic
  const calculatePersonValue = (t: any, baseValue: number) => {
    // If not filtering by person or not a couple expense, return full value
    if (selectedTab === 'all' || selectedTab === 'couple' || !t.is_couple) {
      return baseValue;
    }

    // Custom transaction split
    if (t.custom_person1_percentage !== undefined && t.custom_person1_percentage !== null) {
      const p1Pct = t.custom_person1_percentage;
      return selectedTab === 'person1'
        ? baseValue * (p1Pct / 100)
        : baseValue * ((100 - p1Pct) / 100);
    }

    // Category rule
    const categoryRule = getCategorySplit(categorySplits, t.category, t.subcategory);
    if (categoryRule) {
      const pct = selectedTab === 'person1' ? categoryRule.person1_percentage : categoryRule.person2_percentage;
      return baseValue * (pct / 100);
    }

    // Global settings fallback
    const mode = splitSettings?.mode || "50-50";
    if (mode === "proporcional") {
      const person1 = members.find((m) => m.position === 1);
      const person2 = members.find((m) => m.position === 2);
      const income1 = person1?.monthly_income_cents || 0;
      const income2 = person2?.monthly_income_cents || 0;
      const totalIncome = income1 + income2;
      if (totalIncome === 0) return baseValue / 2;

      const ratio = selectedTab === 'person1' ? (income1 / totalIncome) : (income2 / totalIncome);
      return baseValue * ratio;
    }

    if (mode === "personalizado" && splitSettings) {
      const pct = selectedTab === 'person1'
        ? (splitSettings.person1_percentage || 50)
        : (splitSettings.person2_percentage || 50);
      return baseValue * (pct / 100);
    }

    // Default 50/50
    return baseValue / 2;
  };

  const filteredTransactions = detailsCategory
    ? transactions.filter(t => {
      const cat = t.category || "Outros";
      const catName = budgetSummary.budgetProgress.find(b => b.categoryId === detailsCategory)?.categoryName;
      // Strict category match
      if (cat !== catName) return false;

      // Check Month Scope & Type
      if (!shouldShowInMonth(t, monthIndex, year)) return false;
      if (t.type !== 'expense') return false;
      if (t.savings_deposit_id) return false;

      // Filter by Person (Strict logic matching useBudgetProgress)
      switch (selectedTab) {
        case "person1":
          return t.paid_by === person1Name ||
            t.for_who === person1Name ||
            t.for_who === "Casal" ||
            t.is_couple === true;
        case "person2":
          return t.paid_by === person2Name ||
            t.for_who === person2Name ||
            t.for_who === "Casal" ||
            t.is_couple === true;
        case "couple":
          return t.for_who === "Casal" || t.is_couple === true;
        case "all":
        default:
          return true;
      }
    })
    : [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <div className="container max-w-6xl mx-auto px-6 py-12 pb-32 space-y-10">

          {/* Header Section Clean */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-1">
              <h1 className="font-display text-4xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                Gestão Financeira
              </h1>
              <p className="text-slate-500 font-medium">
                Visão geral de orçamentos e gastos
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
              <BudgetMonthSelector
                currentDate={currentDate}
                onNextMonth={handleNextMonth}
                onPrevMonth={handlePrevMonth}
              />
            </div>
          </div>

          {/* Floating Pill Tabs */}
          <div className="flex justify-center -mt-2">
            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as PersonFilter)}
              className="w-full max-w-xl"
            >
              <TabsList className="grid w-full grid-cols-4 h-14 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800">
                <TabsTrigger
                  value="all"
                  className="rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all duration-300"
                >
                  <Users className="w-4 h-4 sm:mr-2 opacity-70" />
                  <span className="hidden sm:inline font-medium">Todos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="person1"
                  className="rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all duration-300"
                >
                  <div className="sm:mr-2 scale-90 sm:scale-100">
                    <PersonAvatar name={person1Name} avatar={person1Avatar} size="sm" />
                  </div>
                  <span className="hidden sm:inline font-medium">{person1Name}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="person2"
                  className="rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all duration-300"
                >
                  <div className="sm:mr-2 scale-90 sm:scale-100">
                    <PersonAvatar name={person2Name} avatar={person2Avatar} size="sm" />
                  </div>
                  <span className="hidden sm:inline font-medium">{person2Name}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="couple"
                  className="rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 transition-all duration-300"
                >
                  <Heart className="w-4 h-4 sm:mr-2 text-rose-500" />
                  <span className="hidden sm:inline font-medium">Casal</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Hero Statistics - Ultra Clean */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 group transition-transform hover:-translate-y-1 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 duration-700">
                <Wallet className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 pl-1">Planejado</p>
              <p className="text-4xl md:text-5xl font-light font-display text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(budgetSummary.totalBudgeted / 100)}
              </p>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                Teto de gastos mensal
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 group transition-transform hover:-translate-y-1 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 duration-700">
                <TrendingDown className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 pl-1">Realizado</p>
              <p className="text-4xl md:text-5xl font-light font-display text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(budgetSummary.totalSpent / 100)}
              </p>
              <div className="mt-4 flex items-center text-xs font-medium text-amber-500/80">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                Consumo atual
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 group transition-transform hover:-translate-y-1 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 duration-700">
                {budgetSummary.totalRemaining >= 0
                  ? <TrendingUp className="w-32 h-32 -mr-8 -mt-8" />
                  : <TrendingDown className="w-32 h-32 -mr-8 -mt-8" />
                }
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 pl-1">Disponível</p>
              <p className={cn(
                "text-4xl md:text-5xl font-light font-display tracking-tight transition-colors duration-500",
                budgetSummary.totalRemaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {formatCurrency(budgetSummary.totalRemaining / 100)}
              </p>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                {budgetSummary.totalRemaining >= 0 ? (
                  <span className="text-emerald-600/70 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                    Dentro do orçamento
                  </span>
                ) : (
                  <span className="text-rose-600/70 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-400 mr-2 animate-pulse"></span>
                    Orçamento estourado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Advisor Section */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <BudgetAIAdvisor summary={budgetSummary} personName={getFilterLabel()} />
          </div>

          {/* Main Grid */}
          <div className="animate-fade-up space-y-6" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-display font-light text-slate-800 dark:text-slate-200">
                Detalhamento por Categoria
              </h2>
            </div>

            <BudgetProgressCard
              summary={budgetSummary}
              onEditBudget={() => setIsConfigOpen(true)}
              onCategorySelect={(id) => setDetailsCategory(id)}
              className="bg-transparent" // Override card bg to blend with page
            />
          </div>

          {/* Config Sheet (Drawer) */}
          <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l border-slate-200 dark:border-slate-800">
              <SheetHeader className="mb-8 mt-4">
                <SheetTitle className="text-2xl font-display font-light">Configurar Limites</SheetTitle>
                <SheetDescription>
                  Defina o teto de gastos mensal para cada categoria.
                </SheetDescription>
              </SheetHeader>
              <BudgetConfigSection />
            </SheetContent>
          </Sheet>

          {/* Transaction Details Dialog Clean */}
          <Dialog open={!!detailsCategory} onOpenChange={(open) => !open && setDetailsCategory(null)}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sm:rounded-3xl p-0">
              <div className="sticky top-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display font-light flex items-center gap-3">
                    {budgetSummary.budgetProgress.find(b => b.categoryId === detailsCategory)?.categoryName}
                    <span className="text-xs font-sans font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {selectedTab === 'all' ? 'Todas as Pessoas' : getFilterLabel()}
                    </span>
                  </DialogTitle>
                  <DialogDescription>
                    Histórico detalhado deste mês
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-1">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(t => {
                    const baseValue = getTransactionMonthValue(t);
                    const displayValue = calculatePersonValue(t, baseValue);

                    if (displayValue === 0) return null;

                    const isPartial = displayValue !== baseValue;

                    return (
                      <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{t.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-400 font-medium">
                                {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                              </p>
                              {isPartial && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500 font-medium border border-slate-200 dark:border-slate-700">
                                  Parcial
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-lg font-light text-slate-900 dark:text-slate-100 font-display">
                          {formatCurrency(displayValue)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Wallet className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma transação encontrada</p>
                    <p className="text-sm text-slate-400">Nenhum gasto registrado nesta categoria para este período.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </AppLayout>
  );
}
