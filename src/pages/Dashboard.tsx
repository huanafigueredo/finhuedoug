import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetricCard } from "@/components/shared/MetricCard";
import { PieChart } from "@/components/charts/PieChart";
import { LineChart } from "@/components/charts/LineChart";
import { Badge } from "@/components/shared/Badge";
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
} from "lucide-react";

const categoryData = [
  { name: "Alimentação", value: 1200, color: "hsl(14, 56%, 62%)" },
  { name: "Moradia", value: 2500, color: "hsl(135, 14%, 42%)" },
  { name: "Transporte", value: 600, color: "hsl(25, 50%, 65%)" },
  { name: "Lazer", value: 400, color: "hsl(0, 0%, 50%)" },
  { name: "Outros", value: 300, color: "hsl(25, 50%, 80%)" },
];

const bankData = [
  { name: "Nubank", value: 2200, color: "hsl(290, 70%, 50%)" },
  { name: "Inter", value: 1500, color: "hsl(30, 90%, 50%)" },
  { name: "Itaú", value: 1000, color: "hsl(210, 80%, 45%)" },
  { name: "Outros", value: 300, color: "hsl(0, 0%, 60%)" },
];

const evolutionData = [
  { name: "Jul", huana: 2500, douglas: 2800 },
  { name: "Ago", huana: 2200, douglas: 2600 },
  { name: "Set", huana: 2800, douglas: 2400 },
  { name: "Out", huana: 2400, douglas: 2900 },
  { name: "Nov", huana: 2600, douglas: 2700 },
  { name: "Dez", huana: 2500, douglas: 2500 },
];

const recentTransactions = [
  {
    id: "1",
    description: "Supermercado Extra",
    value: -320.5,
    date: "Hoje",
    isCouple: true,
  },
  {
    id: "2",
    description: "Conta de Luz",
    value: -180.0,
    date: "Ontem",
    isCouple: true,
  },
  {
    id: "3",
    description: "Salário",
    value: 5500.0,
    date: "05/12",
    isCouple: false,
  },
  {
    id: "4",
    description: "Restaurante",
    value: -89.9,
    date: "04/12",
    isCouple: true,
  },
];

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
  const [selectedMonth, setSelectedMonth] = useState("Dezembro");
  const [selectedYear, setSelectedYear] = useState("2024");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Olá, Huana & Douglas 💕
              </h1>
              <p className="text-muted-foreground">
                Aqui está o resumo financeiro de vocês
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total de Despesas"
              value={formatCurrency(5000)}
              icon={TrendingDown}
              variant="primary"
              trend={{ value: -5.2, isPositive: true }}
            />
            <MetricCard
              title="Total de Receitas"
              value={formatCurrency(11000)}
              icon={TrendingUp}
              variant="success"
              trend={{ value: 8.1, isPositive: true }}
            />
            <MetricCard
              title="Saldo do Mês"
              value={formatCurrency(6000)}
              icon={Wallet}
              variant="accent"
            />
            <MetricCard
              title="Gastos por Pessoa"
              value={formatCurrency(2500)}
              subtitle="Média por pessoa"
              icon={Users}
              variant="default"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PieChart data={categoryData} title="Divisão por Categoria" />
            <PieChart data={bankData} title="Divisão por Banco" />
            <LineChart
              data={evolutionData}
              lines={[
                { dataKey: "huana", color: "hsl(14, 56%, 62%)", name: "Huana" },
                {
                  dataKey: "douglas",
                  color: "hsl(135, 14%, 42%)",
                  name: "Douglas",
                },
              ]}
              title="Evolução Mensal"
            />
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-card">
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

              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          transaction.value > 0
                            ? "bg-success/10"
                            : "bg-primary/10"
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
            </div>

            {/* Banks Summary */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-card">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Bancos Mais Utilizados
              </h3>

              <div className="space-y-4">
                {bankData.map((bank, index) => (
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
                        {((bank.value / 5000) * 100).toFixed(0)}% do total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
