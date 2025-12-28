import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  User, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  Heart,
  ArrowRight
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { parseISO, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function People() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedTab, setSelectedTab] = useState("person1");

  const { data: transactions = [] } = useTransactions();
  const { data: banks = [] } = useBanks();

  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const metrics = useFinancialMetrics(transactions, monthIndex, year);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filter transactions by selected month/year
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = parseISO(t.date);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    });
  }, [transactions, monthIndex, year]);

  // Get person-specific transactions
  const getPersonTransactions = (personName: string) => {
    return filteredTransactions.filter((t) => {
      // Include transactions for this person OR couple transactions
      return t.for_who === personName || t.is_couple === true;
    });
  };

  // Get person-specific expense transactions (for breakdown)
  const getPersonExpenses = (personName: string) => {
    return filteredTransactions.filter((t) => {
      return t.type === "expense" && (t.for_who === personName || t.is_couple === true);
    });
  };

  // Calculate category breakdown for a person
  const getCategoryBreakdown = (personName: string) => {
    const expenses = getPersonExpenses(personName);
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((t) => {
      const category = t.category || "Outros";
      let value = getTransactionMonthValue(t);
      
      // If couple expense, use half
      if (t.is_couple) {
        value = value / 2;
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

  // Calculate bank breakdown for a person
  const getBankBreakdown = (personName: string) => {
    const expenses = getPersonExpenses(personName);
    const bankTotals: Record<string, number> = {};

    expenses.forEach((t) => {
      if (!t.bank_id) return;
      const bank = banks.find((b) => b.id === t.bank_id);
      const bankName = bank?.name || "Outro";
      let value = getTransactionMonthValue(t);
      
      if (t.is_couple) {
        value = value / 2;
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

  // Calculate monthly evolution for a person (last 6 months)
  const getMonthlyEvolution = (personName: string) => {
    const monthsData = [];
    const currentMonthDate = new Date(year, monthIndex, 1);

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(currentMonthDate, i);
      const m = monthDate.getMonth();
      const y = monthDate.getFullYear();

      const monthTransactions = transactions.filter((t) => {
        const date = parseISO(t.date);
        return date.getMonth() === m && date.getFullYear() === y;
      });

      // Personal expenses
      const personalExpenses = monthTransactions
        .filter((t) => t.type === "expense" && t.for_who === personName && !t.is_couple)
        .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

      // Half of couple expenses
      const coupleExpenses = monthTransactions
        .filter((t) => t.type === "expense" && t.is_couple === true)
        .reduce((sum, t) => sum + getTransactionMonthValue(t), 0) / 2;

      // Personal income
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
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Despesas Totais"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            trend={{ value: 0, isPositive: false }}
            className="bg-destructive/5 border-destructive/20"
          />
          <MetricCard
            title="Receitas"
            value={formatCurrency(income)}
            icon={TrendingUp}
            trend={{ value: 0, isPositive: true }}
            className="bg-success/5 border-success/20"
          />
          <MetricCard
            title="Saldo"
            value={formatCurrency(balance)}
            icon={Wallet}
            trend={{ value: 0, isPositive: balance >= 0 }}
            className={balance >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}
          />
          <MetricCard
            title="Gastos Pessoais"
            value={formatCurrency(individualExpenses)}
            icon={User}
            className="bg-primary/5 border-primary/20"
          />
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {categoryData.length > 0 ? (
            <PieChart data={categoryData} title="Gastos por Categoria" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                Sem dados para exibir
              </CardContent>
            </Card>
          )}

          {bankData.length > 0 ? (
            <PieChart data={bankData} title="Gastos por Banco" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gastos por Banco</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                Sem dados para exibir
              </CardContent>
            </Card>
          )}
        </div>

        {/* Evolution Chart */}
        <LineChart
          data={evolutionData}
          lines={[
            { dataKey: "despesas", color: "hsl(var(--destructive))", name: "Despesas" },
            { dataKey: "receitas", color: "hsl(var(--success))", name: "Receitas" },
          ]}
          title="Evolução Mensal (últimos 6 meses)"
        />

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Últimas Transações</CardTitle>
            <Link to={`/lancamentos?for_who=${encodeURIComponent(personName)}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((t) => {
                  const value = t.is_couple ? getTransactionMonthValue(t) / 2 : getTransactionMonthValue(t);
                  return (
                    <div 
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {t.description}
                          </span>
                          {t.is_couple && (
                            <Heart className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(t.date), "dd/MM/yyyy")} • {t.category || "Outros"}
                        </div>
                      </div>
                      <span className={cn(
                        "font-medium tabular-nums ml-4",
                        t.type === "income" ? "text-success" : "text-destructive"
                      )}>
                        {t.type === "income" ? "+" : "-"} {formatCurrency(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação neste período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Perfis Individuais</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Dashboard por Pessoa
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Visualize as finanças individuais de cada pessoa do casal
            </p>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
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
              <SelectTrigger className="w-24">
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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="person1" className="gap-2">
                <User className="w-4 h-4" />
                {metrics.person1Name}
              </TabsTrigger>
              <TabsTrigger value="person2" className="gap-2">
                <User className="w-4 h-4" />
                {metrics.person2Name}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="person1">
              {renderPersonDashboard(
                metrics.person1Name,
                metrics.person1TotalExpenses,
                metrics.person1Income,
                metrics.person1Balance,
                metrics.person1IndividualExpenses
              )}
            </TabsContent>

            <TabsContent value="person2">
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
          <div className="mt-12 p-8 rounded-2xl bg-card border border-border shadow-card text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Resumo do Casal
            </h2>
            <p className="text-muted-foreground mb-6">
              Totais combinados em {selectedMonth}/{selectedYear}
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Despesas</p>
                <p className="text-xl font-display font-bold text-destructive">
                  {formatCurrency(metrics.totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receitas</p>
                <p className="text-xl font-display font-bold text-success">
                  {formatCurrency(metrics.totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                <p className={`text-xl font-display font-bold ${metrics.totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(metrics.totalBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
