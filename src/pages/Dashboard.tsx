import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetricCard } from "@/components/shared/MetricCard";
import { PieChart } from "@/components/charts/PieChart";
import { LineChart } from "@/components/charts/LineChart";
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
  Users,
  CreditCard,
  Heart,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const years = ["2024", "2025"];

export default function Dashboard() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions();
  const { data: banks = [] } = useBanks();

  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  // Use centralized financial metrics hook
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

  // Category breakdown with romantic colors
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const cat = t.category || "Outros";
        categoryMap[cat] = (categoryMap[cat] || 0) + t.total_value;
      });

    const colors = [
      "hsl(340, 82%, 52%)",
      "hsl(280, 60%, 65%)",
      "hsl(340, 82%, 72%)",
      "hsl(280, 60%, 75%)",
      "hsl(160, 60%, 45%)",
      "hsl(340, 40%, 60%)",
    ];

    return Object.entries(categoryMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredTransactions]);

  // Bank breakdown
  const bankData = useMemo(() => {
    const bankMap: Record<string, { value: number; color: string }> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense" && t.bank_id)
      .forEach((t) => {
        const bank = banks.find((b) => b.id === t.bank_id);
        const bankName = bank?.name || "Outros";
        const bankColor = bank?.color || "hsl(340, 82%, 52%)";
        
        if (!bankMap[bankName]) {
          bankMap[bankName] = { value: 0, color: bankColor };
        }
        bankMap[bankName].value += t.total_value;
      });

    return Object.entries(bankMap).map(([name, { value, color }]) => ({
      name,
      value,
      color,
    }));
  }, [filteredTransactions, banks]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        description: t.description,
        value: t.type === "income" ? t.total_value : -t.total_value,
        date: format(parseISO(t.date), "dd/MM", { locale: ptBR }),
        isCouple: t.is_couple || false,
      }));
  }, [filteredTransactions]);

  // Evolution data (last 6 months)
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
        .reduce((sum, t) => sum + t.total_value, 0);

      result.push({
        name: months[monthIdx].substring(0, 3),
        total: expenses,
      });
    }

    return result;
  }, [transactions, selectedMonth, selectedYear]);

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Olá! <span className="animate-heartbeat inline-block">💕</span>
              </h1>
              <p className="text-muted-foreground">
                Aqui está o resumo financeiro de vocês
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-36 border-primary/20 focus:ring-primary">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="border-primary/20">
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 border-primary/20 focus:ring-primary">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="border-primary/20">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title="Total de Despesas"
              value={formatCurrency(metrics.totalExpenses)}
              icon={TrendingDown}
              variant="primary"
            />
            <MetricCard
              title="Total de Receitas"
              value={formatCurrency(metrics.totalIncome)}
              icon={TrendingUp}
              variant="success"
            />
            <MetricCard
              title="Saldo do Mês"
              value={formatCurrency(metrics.totalBalance)}
              icon={Wallet}
              variant="accent"
            />
          </div>

          {/* Metric Cards - Row 2: Per Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Gastos Huana"
              value={formatCurrency(metrics.huanaTotalExpenses)}
              subtitle="Individual + metade do casal"
              icon={Users}
              variant="default"
            />
            <MetricCard
              title="Gastos Douglas"
              value={formatCurrency(metrics.douglasTotalExpenses)}
              subtitle="Individual + metade do casal"
              icon={Users}
              variant="default"
            />
            <MetricCard
              title="Saldo do mês Huana"
              value={formatCurrency(metrics.huanaBalance)}
              subtitle={`Receitas: ${formatCurrency(metrics.huanaIncome)}`}
              icon={Wallet}
              variant={metrics.huanaBalance >= 0 ? "success" : "primary"}
            />
            <MetricCard
              title="Saldo do mês Douglas"
              value={formatCurrency(metrics.douglasBalance)}
              subtitle={`Receitas: ${formatCurrency(metrics.douglasIncome)}`}
              icon={Wallet}
              variant={metrics.douglasBalance >= 0 ? "success" : "primary"}
            />
          </div>

          {/* Charts Row */}
          {hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <PieChart data={categoryData} title="Divisão por Categoria" />
              <PieChart data={bankData} title="Divisão por Banco" />
              <LineChart
                data={evolutionData}
                lines={[
                  { dataKey: "total", color: "hsl(340, 82%, 52%)", name: "Total" },
                ]}
                title="Evolução Mensal"
              />
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft mb-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Nenhum lançamento encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando suas receitas e despesas para ver os gráficos aqui.
              </p>
              <a
                href="/novo-lancamento"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-romantic text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                Adicionar lançamento
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft hover:shadow-glow transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Lançamentos Recentes
                </h3>
                <a
                  href="/lancamentos"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Ver todos
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            transaction.value > 0
                              ? "bg-gradient-to-br from-success/20 to-emerald-400/20"
                              : "bg-gradient-to-br from-primary/20 to-accent/20"
                          }`}
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
                        className={`text-sm font-semibold ${
                          transaction.value > 0 ? "text-success" : "text-foreground"
                        }`}
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
            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft hover:shadow-glow transition-shadow duration-300">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Bancos Mais Utilizados
              </h3>

              {bankData.length > 0 ? (
                <div className="space-y-4">
                  {bankData
                    .sort((a, b) => b.value - a.value)
                    .map((bank, index) => (
                      <div
                        key={bank.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
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
                              {index === 0 ? "Mais usado" : `${index + 1}º lugar`}
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
