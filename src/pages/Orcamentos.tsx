import { AppLayout } from "@/components/layout/AppLayout";
import { BudgetConfigSection } from "@/components/budget/BudgetConfigSection";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";
import { useTransactions } from "@/hooks/useTransactions";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

export default function Orcamentos() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const { data: transactions = [] } = useTransactions();
  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const budgetSummary = useBudgetProgress(transactions, monthIndex, year);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Orçamentos 💰
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus limites de gastos por categoria
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-28">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Card */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Progresso do Mês
            </h2>
            <BudgetProgressCard summary={budgetSummary} showConfigLink={false} />
          </div>

          {/* Config Section */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Configurar Limites
            </h2>
            <BudgetConfigSection />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
