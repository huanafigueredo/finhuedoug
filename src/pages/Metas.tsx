import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SavingsGoalsCard } from "@/components/savings/SavingsGoalsCard";
import { SavingsGoalsConfigSection } from "@/components/savings/SavingsGoalsConfigSection";
import { MonthlySavingsReport } from "@/components/savings/MonthlySavingsReport";
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersonNames } from "@/hooks/useUserSettings";
import { Users } from "lucide-react";
import { GoalOwnerFilter } from "@/hooks/useSavingsGoals";

const months = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

export default function Metas() {
  const currentDate = new Date();
  const [selectedTab, setSelectedTab] = useState<GoalOwnerFilter>("couple");
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const { person1, person2, person1Avatar, person2Avatar } = usePersonNames();

  const getTabLabel = (tab: GoalOwnerFilter) => {
    switch (tab) {
      case "person1":
        return person1;
      case "person2":
        return person2;
      case "couple":
        return "Casal";
      default:
        return "Todas";
    }
  };

  const getTabIcon = (tab: GoalOwnerFilter) => {
    switch (tab) {
      case "person1":
        return (
          <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
            <AvatarImage src={person1Avatar || undefined} alt={person1} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {person1.charAt(0)}
            </AvatarFallback>
          </Avatar>
        );
      case "person2":
        return (
          <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
            <AvatarImage src={person2Avatar || undefined} alt={person2} />
            <AvatarFallback className="text-[10px] bg-secondary/50 text-secondary-foreground">
              {person2.charAt(0)}
            </AvatarFallback>
          </Avatar>
        );
      case "couple":
        return (
          <div className="relative flex items-center justify-center">
            <Avatar className="w-5 h-5 border-2 border-white shadow-sm z-10">
              <AvatarImage src={person1Avatar || undefined} alt={person1} />
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {person1.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-5 h-5 border-2 border-white shadow-sm -ml-2">
              <AvatarImage src={person2Avatar || undefined} alt={person2} />
              <AvatarFallback className="text-[8px] bg-secondary/50 text-secondary-foreground">
                {person2.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        );
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header com filtros de período */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Metas de Economia 🎯
            </h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie suas metas de poupança
            </p>
          </div>

          {/* Filtros de período */}
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
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

        {/* Relatório Mensal de Economia */}
        <div className="mb-8 animate-fade-up">
          <MonthlySavingsReport 
            month={parseInt(selectedMonth)} 
            year={parseInt(selectedYear)} 
          />
        </div>

        {/* Tabs para alternar entre perfis */}
        <Tabs 
          value={selectedTab} 
          onValueChange={(v) => setSelectedTab(v as GoalOwnerFilter)}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted/50 p-1 rounded-2xl">
              <TabsTrigger 
                value="person1" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                {getTabIcon("person1")}
                <span className="hidden sm:inline">{getTabLabel("person1")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="couple" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                {getTabIcon("couple")}
                <span className="hidden sm:inline">{getTabLabel("couple")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="person2" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                {getTabIcon("person2")}
                <span className="hidden sm:inline">{getTabLabel("person2")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="person1" className="animate-fade-up">
            <MetasContent 
              ownerFilter="person1" 
              ownerLabel={person1}
              month={parseInt(selectedMonth)}
              year={parseInt(selectedYear)}
            />
          </TabsContent>
          <TabsContent value="couple" className="animate-fade-up">
            <MetasContent 
              ownerFilter="couple" 
              ownerLabel="Casal" 
              isCoupleTab
              month={parseInt(selectedMonth)}
              year={parseInt(selectedYear)}
            />
          </TabsContent>
          <TabsContent value="person2" className="animate-fade-up">
            <MetasContent 
              ownerFilter="person2" 
              ownerLabel={person2}
              month={parseInt(selectedMonth)}
              year={parseInt(selectedYear)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface MetasContentProps {
  ownerFilter: GoalOwnerFilter;
  ownerLabel: string;
  isCoupleTab?: boolean;
  month: number;
  year: number;
}

function MetasContent({ ownerFilter, ownerLabel, isCoupleTab, month, year }: MetasContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Goals Overview */}
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">
          Metas de {ownerLabel}
        </h2>
        <SavingsGoalsCard 
          showConfigLink={false} 
          ownerFilter={ownerFilter} 
          showDepositor={isCoupleTab}
        />
      </div>

      {/* Config Section */}
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">
          Gerenciar Metas
        </h2>
        <Accordion type="single" collapsible defaultValue="savings-goals">
          <SavingsGoalsConfigSection 
            ownerFilter={ownerFilter} 
            ownerLabel={ownerLabel}
          />
        </Accordion>
      </div>
    </div>
  );
}
