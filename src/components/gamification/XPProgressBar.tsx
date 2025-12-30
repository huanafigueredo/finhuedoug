import { cn } from "@/lib/utils";
import { getLevelName } from "@/hooks/useGamification";

interface XPProgressBarProps {
  level: number;
  currentXp: number;
  percentage: number;
  nextLevelXp: number;
  compact?: boolean;
}

export function XPProgressBar({
  level,
  currentXp,
  percentage,
  nextLevelXp,
  compact = false,
}: XPProgressBarProps) {
  const levelName = getLevelName(level);
  const isMaxLevel = level >= 8;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⭐</span>
          <span className="text-sm font-semibold text-foreground">
            Nível {level}
          </span>
        </div>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {currentXp} XP
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-foreground">Nível {level}</p>
            <p className="text-xs text-muted-foreground">{levelName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{currentXp} XP</p>
          {!isMaxLevel && (
            <p className="text-xs text-muted-foreground">
              Próximo: {nextLevelXp} XP
            </p>
          )}
        </div>
      </div>

      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out rounded-full",
            isMaxLevel
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
              : "bg-gradient-to-r from-primary via-primary to-primary/80"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Glow effect */}
        <div
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
          style={{
            left: `${Math.min(percentage, 100) - 4}%`,
            opacity: percentage > 5 ? 1 : 0,
          }}
        />
      </div>

      {!isMaxLevel && (
        <p className="text-xs text-center text-muted-foreground">
          {nextLevelXp - currentXp} XP para o próximo nível
        </p>
      )}
    </div>
  );
}
