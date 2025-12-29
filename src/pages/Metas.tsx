import { AppLayout } from "@/components/layout/AppLayout";
import { SavingsGoalsCard } from "@/components/savings/SavingsGoalsCard";
import { SavingsGoalsConfigSection } from "@/components/savings/SavingsGoalsConfigSection";
import { Accordion } from "@/components/ui/accordion";

export default function Metas() {
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals Overview */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Suas Metas
            </h2>
            <SavingsGoalsCard showConfigLink={false} />
          </div>

          {/* Config Section */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Gerenciar Metas
            </h2>
            <Accordion type="single" collapsible defaultValue="savings-goals">
              <SavingsGoalsConfigSection />
            </Accordion>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
