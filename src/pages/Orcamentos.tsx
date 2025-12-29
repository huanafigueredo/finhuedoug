import { AppLayout } from "@/components/layout/AppLayout";
import { BudgetConfigSection } from "@/components/budget/BudgetConfigSection";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";
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
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Import fallback avatars
import avatarPerson1 from "@/assets/avatar-person1.jpg";
import avatarPerson2 from "@/assets/avatar-person2.jpg";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

// Simple avatar display component
function PersonAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
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

  // Get person names
  const person1Name = personSettings.person1 || "Huana";
  const person2Name = personSettings.person2 || "Douglas";
  
  // Get avatars
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

  // Get label for current filter
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Orçamentos 💰
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus limites de gastos por categoria
            </p>
          </div>

          {/* Month/Year Filters */}
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

        {/* Person Filter Tabs */}
        <Tabs 
          value={selectedTab} 
          onValueChange={(value) => setSelectedTab(value as PersonFilter)} 
          className="w-full mb-8"
        >
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 h-14 p-1.5 animate-fade-up">
            <TabsTrigger 
              value="all" 
              className="gap-2 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Todos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="person1" 
              className="gap-2 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300"
            >
              <PersonAvatar name={person1Name} avatar={person1Avatar} size="sm" />
              <span className="hidden sm:inline">{person1Name}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="person2" 
              className="gap-2 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300"
            >
              <PersonAvatar name={person2Name} avatar={person2Avatar} size="sm" />
              <span className="hidden sm:inline">{person2Name}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="couple" 
              className="gap-2 text-xs sm:text-sm h-full rounded-lg data-[state=active]:shadow-pink transition-all duration-300"
            >
              <Heart className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Casal</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Card */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              Progresso do Mês
              {selectedTab !== "all" && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({getFilterLabel()})
                </span>
              )}
            </h2>
            <BudgetProgressCard summary={budgetSummary} showConfigLink={false} />
          </div>

          {/* Config Section */}
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Configurar Limites
            </h2>
            <Accordion type="single" collapsible defaultValue="budgets">
              <BudgetConfigSection />
            </Accordion>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
