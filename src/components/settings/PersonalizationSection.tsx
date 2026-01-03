import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEquippedTheme } from "@/hooks/useEquippedTheme";
import { useToast } from "@/hooks/use-toast";
import { themes, applyTheme, Theme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { useCallback, useRef } from "react";

interface ThemeCardProps {
  theme: Theme;
  isEquipped: boolean;
  onEquip: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function ThemeCard({
  theme,
  isEquipped,
  onEquip,
  onHoverStart,
  onHoverEnd,
}: ThemeCardProps) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300",
        isEquipped
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border hover:border-primary/50 bg-card hover:bg-card/80 hover:shadow-md hover:scale-[1.02]"
      )}
      onMouseEnter={!isEquipped ? onHoverStart : undefined}
      onMouseLeave={!isEquipped ? onHoverEnd : undefined}
    >
      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Preview */}
      <div className="mb-3">
        <div className="w-full h-8 rounded-md overflow-hidden flex gap-0.5">
          <div
            className="flex-1 rounded-l-md transition-colors duration-300"
            style={{ backgroundColor: `hsl(${theme.colors.light.primary})` }}
          />
          <div
            className="flex-1 transition-colors duration-300"
            style={{ backgroundColor: `hsl(${theme.colors.light.secondary})` }}
          />
          <div
            className="flex-1 rounded-r-md transition-colors duration-300"
            style={{ backgroundColor: `hsl(${theme.colors.light.accent})` }}
          />
        </div>
      </div>

      {/* Info */}
      <h4 className="font-medium text-foreground text-sm mb-3">{theme.name}</h4>

      {/* Actions */}
      <Button
        size="sm"
        variant={isEquipped ? "secondary" : "default"}
        className="w-full"
        onClick={onEquip}
        disabled={isEquipped}
      >
        {isEquipped ? "Equipado" : "Aplicar"}
      </Button>
    </div>
  );
}

export function PersonalizationSection() {
  const { toast } = useToast();
  const { equippedTheme, updateTheme, isUpdating } = useEquippedTheme();

  // Track the original theme to restore on hover end
  const originalThemeRef = useRef<string | null>(null);
  const isPreviewingRef = useRef(false);

  const handleThemePreviewStart = useCallback((themeCode: string) => {
    if (!isPreviewingRef.current) {
      // Store the current equipped theme code
      originalThemeRef.current = equippedTheme || "theme_default";
      isPreviewingRef.current = true;
    }
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(themeCode, isDark);
  }, [equippedTheme]);

  const handleThemePreviewEnd = useCallback(() => {
    if (isPreviewingRef.current && originalThemeRef.current) {
      const isDark = document.documentElement.classList.contains("dark");
      applyTheme(originalThemeRef.current, isDark);
      isPreviewingRef.current = false;
    }
  }, []);

  const handleEquipTheme = async (themeCode: string) => {
    try {
      await updateTheme(themeCode);
      // Update the ref so hover end doesn't revert to old theme
      originalThemeRef.current = themeCode;
      isPreviewingRef.current = false;
      
      const theme = themes[themeCode];
      toast({
        title: "✨ Tema Aplicado!",
        description: `${theme?.name || "Tema"} foi aplicado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o tema.",
        variant: "destructive",
      });
    }
  };

  const themeList = Object.values(themes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Personalização de Temas</p>
            <p className="text-sm text-muted-foreground">
              Escolha um tema para personalizar a aparência do aplicativo
            </p>
          </div>
        </div>
      </div>

      {/* Themes Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Temas Disponíveis</h3>
          <span className="text-xs text-muted-foreground">
            ({themeList.length} temas)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themeList.map((theme) => (
            <ThemeCard
              key={theme.code}
              theme={theme}
              isEquipped={equippedTheme === theme.code}
              onEquip={() => handleEquipTheme(theme.code)}
              onHoverStart={() => handleThemePreviewStart(theme.code)}
              onHoverEnd={handleThemePreviewEnd}
            />
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Dica:</strong> Passe o mouse sobre um tema para pré-visualizar as cores antes de aplicar.
        </p>
      </div>
    </div>
  );
}
