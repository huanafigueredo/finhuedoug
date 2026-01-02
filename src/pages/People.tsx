import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { PieChart } from "@/components/charts/PieChart";
import { LineChart } from "@/components/charts/LineChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingDown, 
  TrendingUp, 
  Heart,
  ArrowRight,
  Receipt,
  PiggyBank
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useSplitCalculation } from "@/hooks/useSplitCalculation";
import { parseISO, subMonths, format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { usePersonNames } from "@/hooks/useCoupleMembers";

// Import fallback avatars
import avatarPerson1 from "@/assets/avatar-person1.jpg";
import avatarPerson2 from "@/assets/avatar-person2.jpg";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const categoryColors: Record<string, string> = {
  "Alimentação": "#10B981",
  "Transporte": "#3B82F6",
  "Moradia": "#8B5CF6",
  "Saúde": "#EF4444",
  "Lazer": "#F59E0B",
  "Educação": "#06B6D4",
  "Vestuário": "#EC4899",
  "Outros": "#6B7280",
};

function getTransactionMonthValue(t: any): number {
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  return Number(t.total_value);
}

// Helper function to calculate installment info for a given filter month/year
function calculateInstallmentForMonth(
  firstInstallmentDate: Date,
  startInstallment: number,
  totalInstallments: number,
  filterMonth: number,
  filterYear: number
): { currentInstallment: number; isInRange: boolean } | null {
  const firstMonth = firstInstallmentDate.getMonth() + 1;
  const firstYear = firstInstallmentDate.getFullYear();
  
  const filterDate = new Date(filterYear, filterMonth - 1, 1);
  const firstDate = new Date(firstYear, firstMonth - 1, 1);
  const monthsDiff = differenceInMonths(filterDate, firstDate);
  
  const currentInstallment = startInstallment + monthsDiff;
  const isInRange = currentInstallment >= startInstallment && currentInstallment <= totalInstallments;
  
  return { currentInstallment, isInRange };
}

// Check if transaction should appear in the filtered month
function shouldShowInMonth(t: any, filterMonth: number, filterYear: number): boolean {
  const rawDate = parseISO(t.date);
  const isNewStyleInstallment = t.is_installment && t.total_installments && !t.is_generated_installment;
  
  if (isNewStyleInstallment) {
    const startInstallment = t.installment_number || 1;
    const result = calculateInstallmentForMonth(
      rawDate,
      startInstallment,
      t.total_installments,
      filterMonth + 1,
      filterYear
    );
    return result?.isInRange ?? false;
  }
  
  // Regular transaction - match by date
  return rawDate.getMonth() === filterMonth && rawDate.getFullYear() === filterYear;
}

// Simple avatar display component (non-editable)
function PersonAvatar({ name, avatar, size = "lg" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <div 
      className={cn(
        "rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-display font-bold text-primary overflow-hidden ring-4 ring-card shadow-lg",
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

export default function People() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedTab, setSelectedTab] = useState("person1");

  const { data: transactions = [] } = useTransactions();
  const { data: banks = [] } = useBanks();
  const { calculateSplitForTransaction } = useSplitCalculation();

  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const metrics = useFinancialMetrics(transactions, monthIndex, year);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filter transactions by selected month/year (including dynamic installments)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => shouldShowInMonth(t, monthIndex, year));
  }, [transactions, monthIndex, year]);

  // Get person-specific transactions
  const getPersonTransactions = (personName: string) => {
    return filteredTransactions.filter((t) => {
      return t.for_who === personName || t.is_couple === true;
    });
  };

  // Get person-specific expense transactions (for breakdown)
  // Exclude savings goal deposits (internal transfers)
  const getPersonExpenses = (personName: string) => {
    return filteredTransactions.filter((t) => {
      return t.type === "expense" && !t.savings_deposit_id && (t.for_who === personName || t.is_couple === true);
    });
  };

  // Calculate category breakdown for a person using split rules
  const getCategoryBreakdown = (personName: string) => {
    const expenses = getPersonExpenses(personName);
    const categoryTotals: Record<string, number> = {};
    const isPerson1 = personName === metrics.person1Name;

    expenses.forEach((t) => {
      const category = t.category || "Outros";
      let value = getTransactionMonthValue(t);
      
      if (t.is_couple) {
        // Use split calculation for couple expenses (with custom percentages)
        const split = calculateSplitForTransaction(
          value, 
          t.category, 
          t.subcategory,
          t.custom_person1_percentage,
          t.custom_person2_percentage
        );
        value = isPerson1 ? split.person1 : split.person2;
      }
      
      categoryTotals[category] = (categoryTotals[category] || 0) + value;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Calculate bank breakdown for a person using split rules
  const getBankBreakdown = (personName: string) => {
    const expenses = getPersonExpenses(personName);
    const bankTotals: Record<string, number> = {};
    const isPerson1 = personName === metrics.person1Name;

    expenses.forEach((t) => {
      if (!t.bank_id) return;
      const bank = banks.find((b) => b.id === t.bank_id);
      const bankName = bank?.name || "Outro";
      let value = getTransactionMonthValue(t);
      
      if (t.is_couple) {
        // Use split calculation for couple expenses (with custom percentages)
        const split = calculateSplitForTransaction(
          value, 
          t.category, 
          t.subcategory,
          t.custom_person1_percentage,
          t.custom_person2_percentage
        );
        value = isPerson1 ? split.person1 : split.person2;
      }
      
      bankTotals[bankName] = (bankTotals[bankName] || 0) + value;
    });

    return Object.entries(bankTotals)
      .map(([name, value]) => {
        const bank = banks.find((b) => b.name === name);
        return {
          name,
          value,
          color: bank?.color || "#6B7280",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Get last 5 transactions for a person
  const getRecentTransactions = (personName: string) => {
    return getPersonTransactions(personName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  // Calculate monthly evolution for a person (last 6 months) using split rules
  const getMonthlyEvolution = (personName: string) => {
    const monthsData = [];
    const currentMonthDate = new Date(year, monthIndex, 1);
    const isPerson1 = personName === metrics.person1Name;

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentMonthDate, i);
      const m = monthDate.getMonth();
      const y = monthDate.getFullYear();

      // Use the same installment projection logic
      const monthTransactions = transactions.filter((t) => shouldShowInMonth(t, m, y));

      // Exclude savings goal deposits from expenses
      const personalExpenses = monthTransactions
        .filter((t) => t.type === "expense" && t.for_who === personName && !t.is_couple && !t.savings_deposit_id)
        .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

      // Calculate couple expenses using split rules (with custom percentages)
      const coupleExpenses = monthTransactions
        .filter((t) => t.type === "expense" && t.is_couple === true && !t.savings_deposit_id)
        .reduce((sum, t) => {
          const value = getTransactionMonthValue(t);
          const split = calculateSplitForTransaction(
            value, 
            t.category, 
            t.subcategory,
            t.custom_person1_percentage,
            t.custom_person2_percentage
          );
          return sum + (isPerson1 ? split.person1 : split.person2);
        }, 0);

      const income = monthTransactions
        .filter((t) => t.type === "income" && t.for_who === personName)
        .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

      monthsData.push({
        name: format(monthDate, "MMM", { locale: ptBR }),
        despesas: personalExpenses + coupleExpenses,
        receitas: income,
      });
    }

    return monthsData;
  };

  // Get custom avatar URLs from settings
  const personSettings = usePersonNames();
  
  // Get avatar based on person (custom or fallback)
  const getAvatar = (personName: string) => {
    if (personName === metrics.person1Name) {
      return personSettings.person1Avatar || avatarPerson1;
    }
    if (personName === metrics.person2Name) {
      return personSettings.person2Avatar || avatarPerson2;
    }
    return undefined;
  };
  
  // Get member ID for upload component
  const getMemberId = (personName: string): string | undefined => {
    if (personName === metrics.person1Name) {
      return personSettings.person1Id || undefined;
    }
    if (personName === metrics.person2Name) {
      return personSettings.person2Id || undefined;
    }
    return undefined;
  };

  // Render person dashboard
  const renderPersonDashboard = (
    personName: string,
    totalExpenses: number,
    income: number,
    balance: number,
    individualExpenses: number
  ) => {
    const categoryData = getCategoryBreakdown(personName);
    const bankData = getBankBreakdown(personName);
    const recentTransactions = getRecentTransactions(personName);
    const evolutionData = getMonthlyEvolution(personName);

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Person Header with Avatar */}
        <div className="flex items-center gap-4 p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card animate-fade-up">
          <AvatarUpload 
            name={personName} 
            avatar={getAvatar(personName)} 
            memberId={getMemberId(personName)}
            size="lg"
            editable={true}
          />
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {personName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Resumo financeiro de {selectedMonth}/{selectedYear}
            </p>
            <p className="text-xs text-primary/70 mt-1">
              Clique no avatar para alterar
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <MetricCard
            title="Despesas Totais"
            value={formatCurrency(totalExpenses)}
            emoji="💸"
            variant="primary"
            delay={100}
          />
          <MetricCard
            title="Receitas"
            value={formatCurrency(income)}
            emoji="💰"
            variant="success"
            delay={200}
          />
          <MetricCard
            title="Saldo"
            value={formatCurrency(balance)}
            emoji={balance >= 0 ? "🎉" : "😅"}
            variant={balance >= 0 ? "success" : "primary"}
            delay={300}
          />
          <MetricCard
            title="Gastos Pessoais"
            value={formatCurrency(individualExpenses)}
            emoji="🧾"
            variant="info"
            delay={400}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="animate-fade-up opacity-0" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
            {categoryData.length > 0 ? (
              <PieChart data={categoryData} title="Gastos por Categoria" />
            ) : (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40 sm:h-48 text-muted-foreground text-sm">
                  Sem dados
                </CardContent>
              </Card>
            )}
          </div>

          <div className="animate-fade-up opacity-0" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
            {bankData.length > 0 ? (
              <PieChart data={bankData} title="Gastos por Banco" />
            ) : (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Gastos por Banco</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40 sm:h-48 text-muted-foreground text-sm">
                  Sem dados
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="animate-fade-up opacity-0" style={{ animationDelay: "700ms", animationFillMode: "forwards" }}>
          <LineChart
            data={evolutionData}
            lines={[
              { dataKey: "despesas", color: "hsl(var(--destructive))", name: "Despesas" },
              { dataKey: "receitas", color: "hsl(var(--success))", name: "Receitas" },
            ]}
            title="Evolução Mensal (últimos 6 meses)"
          />
        </div>

        {/* Recent Transactions */}
        <div className="animate-fade-up opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Últimas Transações</CardTitle>
              <Link to={`/lancamentos?for_who=${encodeURIComponent(personName)}`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                  Ver todas <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {recentTransactions.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recentTransactions.map((t, index) => {
                    const baseValue = getTransactionMonthValue(t);
                    let value = baseValue;
                    if (t.is_couple) {
                      const split = calculateSplitForTransaction(
                        baseValue, 
                        t.category, 
                        t.subcategory,
                        t.custom_person1_percentage,
                        t.custom_person2_percentage
                      );
                      value = personName === metrics.person1Name ? split.person1 : split.person2;
                    }
                    return (
                      <div 
                        key={t.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 hover:scale-[1.01]"
                        style={{ animationDelay: `${850 + index * 50}ms` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-medium text-foreground truncate text-sm">
                              {t.description}
                            </span>
                            {t.is_couple && (
                              <Heart className="w-3 h-3 text-primary fill-primary shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(t.date), "dd/MM")} • {t.category || "Outros"}
                          </div>
                        </div>
                        <span className={cn(
                          "font-semibold tabular-nums ml-2 text-sm",
                          t.type === "income" ? "text-success" : "text-destructive"
                        )}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                  Nenhuma transação neste período
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6 shadow-sm">
              <Heart className="w-4 h-4 text-primary animate-pulse-soft" />
              <span className="text-sm font-medium text-primary">Perfis Individuais</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Dashboard por Pessoa 👫
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Visualize as finanças individuais de cada pessoa
            </p>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 sm:w-28">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for each person */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full max-w-sm sm:max-w-md mx-auto grid-cols-2 mb-6 sm:mb-8 h-14 p-1.5 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <TabsTrigger value="person1" className="gap-2 sm:gap-3 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300">
                <PersonAvatar 
                  name={metrics.person1Name} 
                  avatar={personSettings.person1Avatar || avatarPerson1} 
                  size="sm" 
                />
                <span className="hidden sm:inline">{metrics.person1Name}</span>
              </TabsTrigger>
              <TabsTrigger value="person2" className="gap-2 sm:gap-3 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300">
                <PersonAvatar 
                  name={metrics.person2Name} 
                  avatar={personSettings.person2Avatar || avatarPerson2} 
                  size="sm" 
                />
                <span className="hidden sm:inline">{metrics.person2Name}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="person1" 
              className="transition-all duration-500 ease-out data-[state=active]:animate-slide-in-right data-[state=inactive]:animate-fade-out"
            >
              {renderPersonDashboard(
                metrics.person1Name,
                metrics.person1TotalExpenses,
                metrics.person1Income,
                metrics.person1Balance,
                metrics.person1IndividualExpenses
              )}
            </TabsContent>

            <TabsContent 
              value="person2" 
              className="transition-all duration-500 ease-out data-[state=active]:animate-slide-in-left data-[state=inactive]:animate-fade-out"
            >
              {renderPersonDashboard(
                metrics.person2Name,
                metrics.person2TotalExpenses,
                metrics.person2Income,
                metrics.person2Balance,
                metrics.person2IndividualExpenses
              )}
            </TabsContent>
          </Tabs>

          {/* Summary Card */}
          <div className="mt-8 sm:mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border/50 shadow-card text-center animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Resumo do Casal 💕
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Totais em {selectedMonth}/{selectedYear}
            </p>
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
              <div className="p-3 sm:p-4 rounded-xl bg-card/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Despesas</p>
                <p className="text-lg sm:text-2xl font-display font-bold text-destructive">
                  {formatCurrency(metrics.totalExpenses)}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-card/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Receitas</p>
                <p className="text-lg sm:text-2xl font-display font-bold text-success">
                  {formatCurrency(metrics.totalIncome)}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-card/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Saldo</p>
                <p className={`text-lg sm:text-2xl font-display font-bold ${metrics.totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(metrics.totalBalance)}
                </p>
              </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
