import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetricCard } from "@/components/shared/MetricCard";
import { PieChart } from "@/components/charts/PieChart";
import { LineChart } from "@/components/charts/LineChart";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  User,
  CreditCard,
  Heart,
  ArrowUpRight,
  FileText,
  AlertCircle,
  Calendar,
  Sparkles,
  PiggyBank,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useContasAVencer } from "@/hooks/useContasAgendadas";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

export default function Dashboard() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions();
  const { data: banks = [] } = useBanks();
  const { data: contasAVencer = [] } = useContasAVencer();

  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const metrics = useFinancialMetrics(transactions, monthIndex, year);
  const budgetSummary = useBudgetProgress(transactions, monthIndex, year);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = parseISO(t.date);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    });
  }, [transactions, monthIndex, year]);

  const getMonthValue = (t: any): number => {
    if (t.is_installment && t.installment_value && !t.is_generated_installment) {
      return Number(t.installment_value);
    }
    return Number(t.total_value);
  };

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const cat = t.category || "Outros";
        categoryMap[cat] = (categoryMap[cat] || 0) + getMonthValue(t);
      });

    const colors = [
      "hsl(330, 75%, 55%)",
      "hsl(145, 60%, 42%)",
      "hsl(210, 80%, 55%)",
      "hsl(40, 90%, 55%)",
      "hsl(280, 60%, 55%)",
      "hsl(0, 72%, 55%)",
    ];

    return Object.entries(categoryMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredTransactions]);

  const bankData = useMemo(() => {
    const bankMap: Record<string, { value: number; color: string }> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense" && t.bank_id)
      .forEach((t) => {
        const bank = banks.find((b) => b.id === t.bank_id);
        const bankName = bank?.name || "Outros";
        const bankColor = bank?.color || "hsl(0, 0%, 60%)";
        
        if (!bankMap[bankName]) {
          bankMap[bankName] = { value: 0, color: bankColor };
        }
        bankMap[bankName].value += getMonthValue(t);
      });

    return Object.entries(bankMap).map(([name, { value, color }]) => ({
      name,
      value,
      color,
    }));
  }, [filteredTransactions, banks]);

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => {
        const monthValue = getMonthValue(t);
        return {
          id: t.id,
          description: t.description,
          value: t.type === "income" ? monthValue : -monthValue,
          date: format(parseISO(t.date), "dd/MM", { locale: ptBR }),
          isCouple: t.is_couple || false,
        };
      });
  }, [filteredTransactions]);

  const evolutionData = useMemo(() => {
    const result: { name: string; total: number }[] = [];
    const year = parseInt(selectedYear);
    const currentMonthIndex = months.indexOf(selectedMonth);

    for (let i = 5; i >= 0; i--) {
      let monthIdx = currentMonthIndex - i;
      let yearOffset = 0;
      
      if (monthIdx < 0) {
        monthIdx += 12;
        yearOffset = -1;
      }

      const monthTransactions = transactions.filter((t) => {
        const date = parseISO(t.date);
        return date.getMonth() === monthIdx && date.getFullYear() === year + yearOffset;
      });

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => {
          if (t.is_installment && t.installment_value && !t.is_generated_installment) {
            return sum + Number(t.installment_value);
          }
          return sum + Number(t.total_value);
        }, 0);

      result.push({
        name: months[monthIdx].substring(0, 3),
        total: expenses,
      });
    }

    return result;
  }, [transactions, selectedMonth, selectedYear]);

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header with animation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-up">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Olá! 💕
              </h1>
              <p className="text-muted-foreground">
                Aqui está o resumo financeiro de vocês
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link to="/chat-ia">
                <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm group">
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse-soft" />
                  <span className="hidden sm:inline">Perguntar ao</span> Chat IA
                </Button>
              </Link>
              
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
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metric Cards - Row 1: Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <MetricCard
              title="Total de Despesas"
              value={formatCurrency(metrics.totalExpenses)}
              icon={TrendingDown}
              emoji="💸"
              variant="primary"
              delay={0}
            />
            <MetricCard
              title="Total de Receitas"
              value={formatCurrency(metrics.totalIncome)}
              icon={TrendingUp}
              emoji="💰"
              variant="success"
              delay={100}
            />
            <MetricCard
              title="Saldo do Mês"
              value={formatCurrency(metrics.totalBalance)}
              icon={Wallet}
              emoji={metrics.totalBalance >= 0 ? "🎉" : "😅"}
              variant="accent"
              delay={200}
            />
          </div>

          {/* Metric Cards - Row 2: Per Person */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <MetricCard
              title={`Gastos ${metrics.person1Name}`}
              value={formatCurrency(metrics.person1TotalExpenses)}
              subtitle="Individual + metade casal"
              icon={User}
              variant="primary"
              delay={300}
            />
            <MetricCard
              title={`Gastos ${metrics.person2Name}`}
              value={formatCurrency(metrics.person2TotalExpenses)}
              subtitle="Individual + metade casal"
              icon={User}
              variant="primary"
              delay={400}
            />
            <MetricCard
              title={`Saldo ${metrics.person1Name}`}
              value={formatCurrency(metrics.person1Balance)}
              subtitle={`Rec: ${formatCurrency(metrics.person1Income)}`}
              icon={PiggyBank}
              variant={metrics.person1Balance >= 0 ? "success" : "primary"}
              delay={500}
            />
            <MetricCard
              title={`Saldo ${metrics.person2Name}`}
              value={formatCurrency(metrics.person2Balance)}
              subtitle={`Rec: ${formatCurrency(metrics.person2Income)}`}
              icon={PiggyBank}
              variant={metrics.person2Balance >= 0 ? "success" : "primary"}
              delay={600}
            />
          </div>

          {/* Charts Row */}
          {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="animate-fade-up opacity-0" style={{ animationDelay: "700ms", animationFillMode: "forwards" }}>
                <PieChart data={categoryData} title="Divisão por Categoria" />
              </div>
              <div className="animate-fade-up opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
                <PieChart data={bankData} title="Divisão por Banco" />
              </div>
              <div className="animate-fade-up opacity-0" style={{ animationDelay: "900ms", animationFillMode: "forwards" }}>
                <LineChart
                  data={evolutionData}
                  lines={[
                    { dataKey: "total", color: "hsl(330, 75%, 55%)", name: "Total" },
                  ]}
                  title="Evolução Mensal"
                />
              </div>
              <div className="animate-fade-up opacity-0" style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}>
                <BudgetProgressCard summary={budgetSummary} />
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border/50 shadow-card mb-6 sm:mb-8 text-center animate-fade-up" style={{ animationDelay: "700ms" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
                Nenhum lançamento encontrado
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Comece adicionando suas receitas e despesas.
              </p>
              <Link to="/novo-lancamento">
                <Button className="gap-2">
                  Adicionar lançamento
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Contas a Vencer */}
            <div 
              className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-up opacity-0"
              style={{ animationDelay: "1100ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-warning" />
                  </div>
                  Contas em Aberto
                </h3>
                <Link
                  to="/contas"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Ver todas
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {contasAVencer.length > 0 ? (
                <div className="space-y-3">
                  {contasAVencer.slice(0, 3).map((conta, index) => (
                    <div
                      key={conta.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all duration-200"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {conta.recorrencia?.titulo}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(conta.data_vencimento), "dd/MM", { locale: ptBR })}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(conta.valor)}
                      </span>
                    </div>
                  ))}
                  {contasAVencer.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{contasAVencer.length - 3} outras contas
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhuma conta a vencer nos próximos 7 dias
                </p>
              )}
            </div>

            {/* Recent Transactions */}
            <div 
              className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-up opacity-0"
              style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Lançamentos Recentes
                </h3>
                <Link
                  to="/lancamentos"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Ver todos
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            transaction.value > 0
                              ? "bg-success/15"
                              : "bg-primary/15"
                          )}
                        >
                          {transaction.value > 0 ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {transaction.description}
                            </span>
                            {transaction.isCouple && (
                              <Heart className="w-3 h-3 text-primary fill-primary" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {transaction.date}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          transaction.value > 0 ? "text-success" : "text-foreground"
                        )}
                      >
                        {formatCurrency(transaction.value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum lançamento neste período
                </p>
              )}
            </div>

            {/* Banks Summary */}
            <div 
              className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card md:col-span-2 lg:col-span-1 transition-all duration-300 hover:shadow-card-hover animate-fade-up opacity-0"
              style={{ animationDelay: "1300ms", animationFillMode: "forwards" }}
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Bancos Mais Utilizados
              </h3>

              {bankData.length > 0 ? (
                <div className="space-y-4">
                  {bankData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 4)
                    .map((bank, index) => (
                      <div
                        key={bank.name}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: bank.color + "20" }}
                          >
                            <CreditCard
                              className="w-5 h-5"
                              style={{ color: bank.color }}
                            />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {bank.name}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {index === 0 ? "🏆 Mais usado" : `${index + 1}º lugar`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(bank.value)}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {metrics.totalExpenses > 0
                              ? ((bank.value / metrics.totalExpenses) * 100).toFixed(0)
                              : 0}
                            % do total
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum banco utilizado neste período
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
