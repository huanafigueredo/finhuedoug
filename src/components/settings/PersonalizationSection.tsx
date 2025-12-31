import { Check, Lock, Palette, Frame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRewards, Reward } from "@/hooks/useRewards";
import { useGamification } from "@/hooks/useGamification";
import { useToast } from "@/hooks/use-toast";
import { themes, applyTheme } from "@/lib/themes";
import { AvatarWithFrame, FrameType } from "@/components/shared/AvatarWithFrame";
import { Button } from "@/components/ui/button";
import { celebrateAchievement } from "@/lib/celebrations";
import { useCallback, useRef } from "react";

interface RewardCardProps {
  reward: Reward;
  isUnlocked: boolean;
  isEquipped: boolean;
  canUnlock: boolean;
  onUnlock: () => void;
  onEquip: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function RewardCard({
  reward,
  isUnlocked,
  isEquipped,
  canUnlock,
  onUnlock,
  onEquip,
  onHoverStart,
  onHoverEnd,
}: RewardCardProps) {
  const isTheme = reward.type === "theme";
  const themeData = isTheme ? themes[reward.code] : null;

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300",
        isEquipped
          ? "border-primary bg-primary/5 shadow-lg"
          : isUnlocked
          ? "border-border hover:border-primary/50 bg-card hover:bg-card/80 hover:shadow-md hover:scale-[1.02]"
          : "border-border/50 bg-muted/30 opacity-60"
      )}
      onMouseEnter={isTheme && isUnlocked && !isEquipped ? onHoverStart : undefined}
      onMouseLeave={isTheme && isUnlocked && !isEquipped ? onHoverEnd : undefined}
    >
      {/* Preview indicator for themes */}
      {isTheme && isUnlocked && !isEquipped && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Passe o mouse para pré-visualizar
        </div>
      )}

      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Lock icon for locked rewards */}
      {!isUnlocked && !canUnlock && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Preview */}
      <div className="mb-3">
        {isTheme && themeData ? (
          <div className="w-full h-16 rounded-lg overflow-hidden flex gap-1">
            <div
              className="flex-1 rounded-l-lg transition-colors duration-300"
              style={{ backgroundColor: `hsl(${themeData.colors.light.primary})` }}
            />
            <div
              className="flex-1 transition-colors duration-300"
              style={{ backgroundColor: `hsl(${themeData.colors.light.secondary})` }}
            />
            <div
              className="flex-1 rounded-r-lg transition-colors duration-300"
              style={{ backgroundColor: `hsl(${themeData.colors.light.accent})` }}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <AvatarWithFrame
              name="Exemplo"
              frame={reward.code as FrameType}
              size="lg"
              gradientFrom="from-primary"
              gradientTo="to-primary/70"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <h4 className="font-medium text-foreground text-sm mb-1">{reward.name}</h4>
      <p className="text-xs text-muted-foreground mb-3">{reward.description}</p>

      {/* Requirements */}
      {!isUnlocked && (
        <div className="text-xs text-muted-foreground mb-3 space-y-1">
          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span>{reward.xp_required} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>Nível {reward.level_required}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto">
        {isUnlocked ? (
          <Button
            size="sm"
            variant={isEquipped ? "secondary" : "default"}
            className="w-full"
            onClick={onEquip}
            disabled={isEquipped}
          >
            {isEquipped ? "Equipado" : "Equipar"}
          </Button>
        ) : canUnlock ? (
          <Button size="sm" variant="outline" className="w-full" onClick={onUnlock}>
            🔓 Desbloquear
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="w-full" disabled>
            Bloqueado
          </Button>
        )}
      </div>
    </div>
  );
}

export function PersonalizationSection() {
  const { toast } = useToast();
  const { gamification } = useGamification();
  const {
    themes: themeRewards,
    frames,
    unlockedRewardIds,
    availableToUnlock,
    equippedTheme,
    equippedFrame,
    unlockReward,
    equipReward,
  } = useRewards();

  // Track the original theme to restore on hover end
  const originalThemeRef = useRef<string | null>(null);
  const isPreviewingRef = useRef(false);

  const handleThemePreviewStart = useCallback((themeCode: string) => {
    if (!isPreviewingRef.current) {
      // Store the current equipped theme code
      originalThemeRef.current = equippedTheme?.code || "default";
      isPreviewingRef.current = true;
    }
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(themeCode, isDark);
  }, [equippedTheme?.code]);

  const handleThemePreviewEnd = useCallback(() => {
    if (isPreviewingRef.current && originalThemeRef.current) {
      const isDark = document.documentElement.classList.contains("dark");
      applyTheme(originalThemeRef.current, isDark);
      isPreviewingRef.current = false;
    }
  }, []);
  const handleUnlock = async (reward: Reward) => {
    try {
      await unlockReward(reward.id);
      celebrateAchievement();
      toast({
        title: "🎉 Recompensa Desbloqueada!",
        description: `${reward.name} foi adicionada à sua coleção!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear a recompensa.",
        variant: "destructive",
      });
    }
  };

  const handleEquip = async (reward: Reward) => {
    try {
      await equipReward({ rewardId: reward.id, type: reward.type });
      toast({
        title: "✨ Personalização Aplicada!",
        description: `${reward.name} foi equipado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível equipar a recompensa.",
        variant: "destructive",
      });
    }
  };

  const canUnlockReward = (reward: Reward) => {
    return availableToUnlock.some((r) => r.id === reward.id);
  };

  return (
    <div className="space-y-8">
      {/* Current Status */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Seu progresso</p>
            <p className="text-lg font-bold text-foreground">
              Nível {gamification?.level || 1} • {gamification?.xp || 0} XP
            </p>
          </div>
          <div className="flex items-center gap-4">
            {equippedTheme && (
              <div className="text-center">
                <Palette className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{equippedTheme.name}</p>
              </div>
            )}
            {equippedFrame && (
              <div className="text-center">
                <Frame className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{equippedFrame.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Themes Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Temas</h3>
          <span className="text-xs text-muted-foreground">
            ({themeRewards.filter((t) => unlockedRewardIds.has(t.id)).length}/{themeRewards.length})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themeRewards.map((theme) => (
            <RewardCard
              key={theme.id}
              reward={theme}
              isUnlocked={unlockedRewardIds.has(theme.id)}
              isEquipped={equippedTheme?.id === theme.id}
              canUnlock={canUnlockReward(theme)}
              onUnlock={() => handleUnlock(theme)}
              onEquip={() => handleEquip(theme)}
              onHoverStart={() => handleThemePreviewStart(theme.code)}
              onHoverEnd={handleThemePreviewEnd}
            />
          ))}
        </div>
      </div>

      {/* Frames Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Frame className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Molduras de Avatar</h3>
          <span className="text-xs text-muted-foreground">
            ({frames.filter((f) => unlockedRewardIds.has(f.id)).length}/{frames.length})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {frames.map((frame) => (
            <RewardCard
              key={frame.id}
              reward={frame}
              isUnlocked={unlockedRewardIds.has(frame.id)}
              isEquipped={equippedFrame?.id === frame.id}
              canUnlock={canUnlockReward(frame)}
              onUnlock={() => handleUnlock(frame)}
              onEquip={() => handleEquip(frame)}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {themeRewards.length === 0 && frames.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma recompensa disponível ainda. Continue progredindo para desbloquear!
          </p>
        </div>
      )}
    </div>
  );
}
