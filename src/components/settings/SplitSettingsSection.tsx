import { useState, useEffect, forwardRef } from "react";
import { Heart, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useSplitSettings, useSaveSplitSettings, SplitMode } from "@/hooks/useSplitSettings";
import { useCoupleMembers, useUpdateCoupleMember } from "@/hooks/useCoupleMembers";
import { useToast } from "@/hooks/use-toast";
import { CategorySplitsSection } from "./CategorySplitsSection";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

// Custom Slider for Dual-Tone effect
const DualToneSlider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { colorLeft?: string; colorRight?: string }
>(({ className, colorLeft = "#ec4899", colorRight = "#3b82f6", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-3 w-full grow overflow-hidden rounded-full cursor-pointer"
      style={{ backgroundColor: colorRight }}
    >
      <SliderPrimitive.Range
        className="absolute h-full"
        style={{ backgroundColor: colorLeft }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-background bg-white shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
));
DualToneSlider.displayName = "DualToneSlider";

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

  // Snap points for the slider
  const SNAP_POINTS = [30, 40, 50, 60, 70];
  const SNAP_THRESHOLD = 2; // Distance to snap

  const person1 = members.find((m) => m.position === 1);
  const person2 = members.find((m) => m.position === 2);
  const person1Name = person1?.name || "Pessoa 1";
  const person2Name = person2?.name || "Pessoa 2";
  const person1Color = person1?.color || "#ec4899"; // Default Pink
  const person2Color = person2?.color || "#3b82f6"; // Default Blue

  const person2Percentage = 100 - person1Percentage;

  // Calculate proportional percentages
  const totalIncome = person1Income + person2Income;
  const proportionalPerson1 = totalIncome > 0 ? Math.round((person1Income / totalIncome) * 100) : 50;
  const proportionalPerson2 = 100 - proportionalPerson1;

  // Initialize from existing settings
  useEffect(() => {
    // Don't overwrite if user is currently editing (has un-saved changes)
    if (hasChanges) return;

    if (settings) {
      setSplitMode(settings.mode);
      setPerson1Percentage(settings.person1_percentage);
    }
    // Only initialize income if it is zero (first load) or identical to DB
    // This prevents overwriting user input if background fetch happens
    if (person1 && person1Income === 0) {
      setPerson1Income(person1.monthly_income_cents || 0);
    }
    if (person2 && person2Income === 0) {
      setPerson2Income(person2.monthly_income_cents || 0);
    }
  }, [settings, person1, person2, hasChanges]);

  const handleModeChange = (value: string | undefined) => {
    if (value && value !== splitMode) {
      setSplitMode(value as SplitMode);
      setHasChanges(true);
    }
  };

  const handleSliderChange = ([v]: number[]) => {
    let newValue = v;

    // Snap logic
    const closestSnap = SNAP_POINTS.find(p => Math.abs(p - v) <= SNAP_THRESHOLD);
    if (closestSnap) {
      newValue = closestSnap;
    }

    if (newValue !== person1Percentage) {
      setPerson1Percentage(newValue);
      setHasChanges(true);
    }
  };

  const handleManualSave = async () => {
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

      // Always update income if it has been set, regardless of mode
      // This ensures the "Proportional" settings are ready when the user switches back
      if (person1 && person2) {
        if (person1Income !== person1.monthly_income_cents) {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase
            .from("couple_members")
            .update({ monthly_income_cents: person1Income })
            .eq("id", person1.id);
        }
        if (person2Income !== person2.monthly_income_cents) {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase
            .from("couple_members")
            .update({ monthly_income_cents: person2Income })
            .eq("id", person2.id);
        }
      }

      toast({
        title: "Sucesso",
        description: "Configurações de divisão salvas.",
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

  // Determine current active percentages for display
  const currentP1 = splitMode === "50-50" ? 50 : splitMode === "proporcional" ? proportionalPerson1 : person1Percentage;
  const currentP2 = 100 - currentP1;

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
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-300"
          >
            <span className="text-lg">⚖️</span>
            <span className="text-xs font-medium">50/50</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="proporcional"
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-300"
          >
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium">Proporcional</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="personalizado"
            className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-300"
          >
            <span className="text-lg">✂️</span>
            <span className="text-xs font-medium">Personalizado</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Proporcional: Income inputs */}
      <div className={cn("space-y-4 p-4 bg-muted/50 rounded-xl transition-all duration-500 overflow-hidden", splitMode === "proporcional" ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 p-0 m-0")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Informe a renda mensal de cada pessoa para calcular a proporção
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">{person1Name}</Label>
              <CurrencyInput
                value={person1Income}
                onChange={(v) => {
                  if (v !== person1Income) {
                    setPerson1Income(v);
                    setHasChanges(true);
                  }
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
                  if (v !== person2Income) {
                    setPerson2Income(v);
                    setHasChanges(true);
                  }
                }}
                showPrefix
                placeholder="R$ 0,00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personalizado: Percentage slider */}
      <div className={cn("space-y-4 p-4 bg-muted/50 rounded-xl transition-all duration-500 overflow-hidden", splitMode === "personalizado" ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 p-0 m-0")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Arraste para definir os percentuais
          </p>
          <div className="px-2 pt-2 pb-4">
            <DualToneSlider
              value={[person1Percentage]}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              colorLeft={person1Color}
              colorRight={person2Color}
              className="my-4"
            />
            <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2">
              <span style={{ color: person1Color }}>{person1Name}: {person1Percentage}%</span>
              <span style={{ color: person2Color }}>{person2Name}: {person2Percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 bg-primary/5 rounded-2xl text-center border border-primary/10">
        <p className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider text-[10px]">Divisão Resultante</p>

        <div className="flex items-center justify-center gap-8 relative">
          <div className="text-center w-24">
            <p className="font-semibold text-sm mb-1 truncate" style={{ color: person1Color }}>{person1Name}</p>
            <p className="text-3xl font-bold" style={{ color: person1Color }}>
              {currentP1}%
            </p>
          </div>

          <div className="relative">
            <Heart
              className={cn("w-6 h-6 fill-rose-500 text-rose-600 transition-transform duration-300", hasChanges ? "scale-125" : "scale-100")}
            />
          </div>

          <div className="text-center w-24">
            <p className="font-semibold text-sm mb-1 truncate" style={{ color: person2Color }}>{person2Name}</p>
            <p className="text-3xl font-bold" style={{ color: person2Color }}>
              {currentP2}%
            </p>
          </div>
        </div>

        {/* Monetary Simulation */}
        <div className="mt-6 pt-4 border-t border-dashed border-primary/20">
          <p className="text-xs text-muted-foreground">
            Em uma conta de <strong>R$ 100,00</strong>:
          </p>
          <div className="flex justify-center gap-4 mt-1 text-sm">
            <span>{person1Name} paga <strong>R$ {currentP1},00</strong></span>
            <span className="text-muted-foreground">•</span>
            <span>{person2Name} paga <strong>R$ {currentP2},00</strong></span>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-2">
            <Button
              onClick={handleManualSave}
              className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all font-semibold px-8"
              disabled={saveSplitSettings.isPending}
            >
              {saveSplitSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </div>

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
