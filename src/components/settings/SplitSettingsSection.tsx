import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useSplitSettings, useSaveSplitSettings, SplitMode } from "@/hooks/useSplitSettings";
import { useCoupleMembers, useUpdateCoupleMember } from "@/hooks/useCoupleMembers";
import { useToast } from "@/hooks/use-toast";
import { CategorySplitsSection } from "./CategorySplitsSection";

export function SplitSettingsSection() {
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useSplitSettings();
  const { data: members = [], isLoading: membersLoading } = useCoupleMembers();
  const saveSplitSettings = useSaveSplitSettings();
  const updateMember = useUpdateCoupleMember();

  const [splitMode, setSplitMode] = useState<SplitMode>("50-50");
  const [person1Income, setPerson1Income] = useState(0);
  const [person2Income, setPerson2Income] = useState(0);
  const [person1Percentage, setPerson1Percentage] = useState(50);
  const [hasChanges, setHasChanges] = useState(false);

  const person1 = members.find((m) => m.position === 1);
  const person2 = members.find((m) => m.position === 2);
  const person1Name = person1?.name || "Pessoa 1";
  const person2Name = person2?.name || "Pessoa 2";

  const person2Percentage = 100 - person1Percentage;

  // Calculate proportional percentages
  const totalIncome = person1Income + person2Income;
  const proportionalPerson1 = totalIncome > 0 ? Math.round((person1Income / totalIncome) * 100) : 50;
  const proportionalPerson2 = 100 - proportionalPerson1;

  // Initialize from existing settings
  useEffect(() => {
    if (settings) {
      setSplitMode(settings.mode);
      setPerson1Percentage(settings.person1_percentage);
    }
    if (person1) {
      setPerson1Income(person1.monthly_income_cents || 0);
    }
    if (person2) {
      setPerson2Income(person2.monthly_income_cents || 0);
    }
  }, [settings, person1, person2]);

  const handleModeChange = (value: string | undefined) => {
    if (value) {
      setSplitMode(value as SplitMode);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      let p1Pct = 50;
      let p2Pct = 50;

      if (splitMode === "proporcional") {
        p1Pct = proportionalPerson1;
        p2Pct = proportionalPerson2;
      } else if (splitMode === "personalizado") {
        p1Pct = person1Percentage;
        p2Pct = person2Percentage;
      }

      await saveSplitSettings.mutateAsync({
        mode: splitMode,
        person1_percentage: p1Pct,
        person2_percentage: p2Pct,
      });

      // Update member incomes if in proportional mode
      if (splitMode === "proporcional" && person1 && person2) {
        await updateMember.mutateAsync({
          id: person1.id,
          name: person1.name,
        });
        await updateMember.mutateAsync({
          id: person2.id,
          name: person2.name,
        });

        // Update income separately
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase
          .from("couple_members")
          .update({ monthly_income_cents: person1Income })
          .eq("id", person1.id);
        await supabase
          .from("couple_members")
          .update({ monthly_income_cents: person2Income })
          .eq("id", person2.id);
      }

      toast({
        title: "Configuração salva! ✓",
        description: "A divisão de despesas foi atualizada.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  if (settingsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Modo de Divisão</Label>
        <ToggleGroup
          type="single"
          value={splitMode}
          onValueChange={handleModeChange}
          className="grid grid-cols-3 gap-2"
        >
          <ToggleGroupItem
            value="50-50"
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span className="text-lg">⚖️</span>
            <span className="text-xs font-medium">50/50</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="proporcional"
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium">Proporcional</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="personalizado"
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span className="text-lg">✂️</span>
            <span className="text-xs font-medium">Personalizado</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Proporcional: Income inputs */}
      {splitMode === "proporcional" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            Informe a renda mensal de cada pessoa para calcular a proporção
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">{person1Name}</Label>
              <CurrencyInput
                value={person1Income}
                onChange={(v) => {
                  setPerson1Income(v);
                  setHasChanges(true);
                }}
                showPrefix
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{person2Name}</Label>
              <CurrencyInput
                value={person2Income}
                onChange={(v) => {
                  setPerson2Income(v);
                  setHasChanges(true);
                }}
                showPrefix
                placeholder="R$ 0,00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Personalizado: Percentage slider */}
      {splitMode === "personalizado" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            Arraste para definir os percentuais
          </p>
          <div className="px-2">
            <Slider
              value={[person1Percentage]}
              onValueChange={([v]) => {
                setPerson1Percentage(v);
                setHasChanges(true);
              }}
              min={0}
              max={100}
              step={5}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{person1Name}: {person1Percentage}%</span>
              <span>{person2Name}: {person2Percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="p-4 bg-primary/10 rounded-xl text-center">
        <p className="text-sm text-muted-foreground mb-2">Divisão resultante:</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="font-semibold text-foreground text-sm">{person1Name}</p>
            <p className="text-2xl font-bold text-primary">
              {splitMode === "50-50"
                ? 50
                : splitMode === "proporcional"
                ? proportionalPerson1
                : person1Percentage}
              %
            </p>
          </div>
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <div className="text-center">
            <p className="font-semibold text-foreground text-sm">{person2Name}</p>
            <p className="text-2xl font-bold text-primary">
              {splitMode === "50-50"
                ? 50
                : splitMode === "proporcional"
                ? proportionalPerson2
                : person2Percentage}
              %
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saveSplitSettings.isPending || (!hasChanges && !!settings)}
        className="w-full"
      >
        {saveSplitSettings.isPending ? "Salvando..." : "Salvar Configuração"}
      </Button>

      {/* Description */}
      <p className="text-xs text-muted-foreground text-center">
        Esta configuração é a divisão padrão. Você pode criar regras por categoria abaixo.
      </p>

      <Separator className="my-6" />

      {/* Category-specific rules */}
      <CategorySplitsSection />
    </div>
  );
}
