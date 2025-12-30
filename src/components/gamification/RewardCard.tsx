import { cn } from "@/lib/utils";
import { Reward } from "@/hooks/useRewards";
import { Lock, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RewardCardProps {
  reward: Reward;
  isUnlocked: boolean;
  isEquipped: boolean;
  canUnlock: boolean;
  currentXp: number;
  currentLevel: number;
  onUnlock: () => void;
  onEquip: () => void;
}

const typeLabels = {
  theme: "Tema",
  avatar_frame: "Moldura",
  badge: "Badge",
  emoji_pack: "Emojis",
};

const typeIcons = {
  theme: "🎨",
  avatar_frame: "🖼️",
  badge: "🏅",
  emoji_pack: "😀",
};

export function RewardCard({
  reward,
  isUnlocked,
  isEquipped,
  canUnlock,
  currentXp,
  currentLevel,
  onUnlock,
  onEquip,
}: RewardCardProps) {
  const getPreviewStyle = () => {
    if (reward.type === "theme" && reward.preview_data) {
      return {
        background: `linear-gradient(135deg, hsl(${reward.preview_data.primary}) 0%, hsl(${reward.preview_data.background}) 100%)`,
      };
    }
    if (reward.type === "avatar_frame" && reward.preview_data) {
      const borderColors: Record<string, string> = {
        bronze: "from-amber-600 to-amber-800",
        silver: "from-gray-300 to-gray-500",
        gold: "from-yellow-400 to-amber-600",
        diamond: "from-cyan-300 via-blue-400 to-purple-500",
      };
      return {
        borderClass: borderColors[reward.preview_data.border || ""] || "",
      };
    }
    return {};
  };

  const previewStyle = getPreviewStyle();
  const needsMoreXp = currentXp < reward.xp_required;
  const needsMoreLevel = currentLevel < reward.level_required;

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border transition-all group",
        isEquipped
          ? "bg-primary/10 border-primary/50 ring-2 ring-primary/30"
          : isUnlocked
          ? "bg-card border-border/50 hover:border-primary/30"
          : "bg-secondary/50 border-border/30"
      )}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1 rounded-full">
          <Check className="w-3 h-3" />
        </div>
      )}

      {/* Preview */}
      <div className="mb-3">
        {reward.type === "theme" ? (
          <div
            className="h-16 rounded-xl overflow-hidden"
            style={previewStyle as React.CSSProperties}
          >
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-2xl opacity-80">🎨</span>
            </div>
          </div>
        ) : reward.type === "avatar_frame" ? (
          <div className="h-16 flex items-center justify-center">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                reward.preview_data?.border === "none"
                  ? "border-2 border-dashed border-muted-foreground/30"
                  : `bg-gradient-to-br ${(previewStyle as any).borderClass} p-[3px]`,
                reward.preview_data?.glow && "shadow-lg shadow-amber-500/30",
                reward.preview_data?.animated && "animate-pulse"
              )}
            >
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <span className="text-4xl">{reward.preview_data?.icon || "🏅"}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center mb-3">
        <p className="font-semibold text-foreground">{reward.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {typeLabels[reward.type]}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {reward.description}
        </p>
      </div>

      {/* Requirements or Action */}
      {!isUnlocked ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {needsMoreXp && (
              <span className="flex items-center gap-1">
                ⭐ {reward.xp_required} XP
              </span>
            )}
            {needsMoreLevel && (
              <span className="flex items-center gap-1">
                📊 Nível {reward.level_required}
              </span>
            )}
          </div>
          
          {canUnlock ? (
            <Button
              size="sm"
              className="w-full gap-1"
              onClick={onUnlock}
            >
              <Sparkles className="w-3 h-3" />
              Desbloquear
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground py-2">
              <Lock className="w-3 h-3" />
              Bloqueado
            </div>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          variant={isEquipped ? "secondary" : "outline"}
          className="w-full"
          onClick={onEquip}
          disabled={isEquipped}
        >
          {isEquipped ? "Equipado" : "Equipar"}
        </Button>
      )}
    </div>
  );
}
