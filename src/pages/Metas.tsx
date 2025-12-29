import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SavingsGoalsCard } from "@/components/savings/SavingsGoalsCard";
import { SavingsGoalsConfigSection } from "@/components/savings/SavingsGoalsConfigSection";
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePersonNames } from "@/hooks/useUserSettings";
import { Users } from "lucide-react";
import { GoalOwnerFilter } from "@/hooks/useSavingsGoals";

export default function Metas() {
  const [selectedTab, setSelectedTab] = useState<GoalOwnerFilter>("couple");
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Metas de Economia 🎯
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie suas metas de poupança
          </p>
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
            <MetasContent ownerFilter="person1" ownerLabel={person1} />
          </TabsContent>
          <TabsContent value="couple" className="animate-fade-up">
            <MetasContent ownerFilter="couple" ownerLabel="Casal" isCoupleTab />
          </TabsContent>
          <TabsContent value="person2" className="animate-fade-up">
            <MetasContent ownerFilter="person2" ownerLabel={person2} />
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
}

function MetasContent({ ownerFilter, ownerLabel, isCoupleTab }: MetasContentProps) {
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
