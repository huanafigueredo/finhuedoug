import { AppLayout } from "@/components/layout/AppLayout";
import { BudgetConfigCard } from "@/components/budget/BudgetConfigCard";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";
import { BudgetMetricCards } from "@/components/budget/BudgetMetricCards";
import { BudgetDonutChart } from "@/components/budget/BudgetDonutChart";
import { useBudgetProgress, PersonFilter } from "@/hooks/useBudgetProgress";
import { useTransactions } from "@/hooks/useTransactions";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// Import fallback avatars
import avatarPerson1 from "@/assets/avatar-person1.jpg";
import avatarPerson2 from "@/assets/avatar-person2.jpg";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

function PersonAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
  };

  return (
    <div 
      className={cn(
        "rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-display font-bold text-primary overflow-hidden ring-2 ring-card shadow-sm",
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
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedTab, setSelectedTab] = useState<PersonFilter>("all");

  const { data: transactions = [] } = useTransactions();
  const personSettings = usePersonNames();
  
  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const person1Name = personSettings.person1 || "Pessoa 1";
  const person2Name = personSettings.person2 || "Pessoa 2";
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

  const getFilterLabel = () => {
    switch (selectedTab) {
      case "person1":
        return person1Name;
      case "person2":
        return person2Name;
      case "couple":
        return "Casal";
      default:
        return "Todos";
    }
  };

  const hasBudgets = budgetSummary.budgetProgress.length > 0;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Orçamentos 💰
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Controle seus limites de gastos por categoria
              </p>
            </div>

            {/* Compact Period Selector */}
            <div className="flex items-center gap-2 bg-card rounded-xl p-2 border border-border/50 shadow-sm">
              <Calendar className="w-4 h-4 text-muted-foreground ml-1" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32 h-8 text-sm border-0 bg-transparent shadow-none">
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
              <span className="text-muted-foreground">/</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20 h-8 text-sm border-0 bg-transparent shadow-none">
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

          {/* Person Filter Tabs - Compact */}
          <Tabs 
            value={selectedTab} 
            onValueChange={(value) => setSelectedTab(value as PersonFilter)} 
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-4 h-10 p-1">
              <TabsTrigger 
                value="all" 
                className="gap-1.5 text-xs h-full rounded-lg data-[state=active]:shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Todos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="person1" 
                className="gap-1.5 text-xs h-full rounded-lg data-[state=active]:shadow-sm"
              >
                <PersonAvatar name={person1Name} avatar={person1Avatar} size="sm" />
                <span className="hidden sm:inline truncate max-w-16">{person1Name}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="person2" 
                className="gap-1.5 text-xs h-full rounded-lg data-[state=active]:shadow-sm"
              >
                <PersonAvatar name={person2Name} avatar={person2Avatar} size="sm" />
                <span className="hidden sm:inline truncate max-w-16">{person2Name}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="couple" 
                className="gap-1.5 text-xs h-full rounded-lg data-[state=active]:shadow-sm"
              >
                <Heart className="w-3.5 h-3.5 text-primary" />
                <span className="hidden xs:inline">Casal</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Metric Cards Summary */}
        {hasBudgets && <BudgetMetricCards summary={budgetSummary} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Progress */}
          <div className="lg:col-span-7 space-y-6">
            {/* Donut Chart + Progress Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {hasBudgets && (
                <Card className="sm:col-span-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
                  <CardContent className="p-4 flex items-center justify-center">
                    <BudgetDonutChart 
                      spent={budgetSummary.totalSpent} 
                      budgeted={budgetSummary.totalBudgeted} 
                    />
                  </CardContent>
                </Card>
              )}
              <div className={cn(
                "animate-fade-up",
                hasBudgets ? "sm:col-span-8" : "sm:col-span-12"
              )} style={{ animationDelay: "150ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                    Progresso do Mês
                    {selectedTab !== "all" && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({getFilterLabel()})
                      </span>
                    )}
                  </h2>
                </div>
                <BudgetProgressCard summary={budgetSummary} showConfigLink={false} />
              </div>
            </div>
          </div>

          {/* Right Column - Config */}
          <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <BudgetConfigCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
