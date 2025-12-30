import { cn } from "@/lib/utils";
import { Achievement } from "@/hooks/useGamification";
import { Lock } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
  compact?: boolean;
}

const categoryColors = {
  spending: "from-primary/20 to-primary/5 border-primary/30",
  saving: "from-success/20 to-success/5 border-success/30",
  revenue: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  consistency: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
};

const categoryLabels = {
  spending: "Gastar Menos",
  saving: "Guardar Mais",
  revenue: "Gerar Receita",
  consistency: "Consistência",
};

export function AchievementCard({
  achievement,
  isUnlocked,
  unlockedAt,
  compact = false,
}: AchievementCardProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "relative p-3 rounded-xl border transition-all",
          isUnlocked
            ? `bg-gradient-to-br ${categoryColors[achievement.category]}`
            : "bg-secondary/50 border-border/50 opacity-60"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl", !isUnlocked && "grayscale opacity-50")}>
            {achievement.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium text-sm truncate",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {achievement.name}
            </p>
            <p className="text-xs text-muted-foreground">
              +{achievement.xp_reward} XP
            </p>
          </div>
          {!isUnlocked && (
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border transition-all group",
        isUnlocked
          ? `bg-gradient-to-br ${categoryColors[achievement.category]} hover:scale-[1.02]`
          : "bg-secondary/50 border-border/50"
      )}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "text-4xl flex-shrink-0 transition-transform",
            isUnlocked ? "group-hover:scale-110" : "grayscale opacity-50"
          )}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={cn(
                  "font-semibold",
                  isUnlocked ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {achievement.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryLabels[achievement.category]}
              </p>
            </div>

            {!isUnlocked ? (
              <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                +{achievement.xp_reward} XP
              </span>
            )}
          </div>

          <p
            className={cn(
              "text-sm mt-2",
              isUnlocked ? "text-foreground/80" : "text-muted-foreground"
            )}
          >
            {achievement.description}
          </p>

          {isUnlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Desbloqueada em{" "}
              {new Date(unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
