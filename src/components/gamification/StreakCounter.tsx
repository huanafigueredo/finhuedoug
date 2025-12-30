import { cn } from "@/lib/utils";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezeAvailable: boolean;
  compact?: boolean;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  streakFreezeAvailable,
  compact = false,
}: StreakCounterProps) {
  const getStreakIcon = () => {
    if (currentStreak >= 100) return "🔥";
    if (currentStreak >= 30) return "🔥";
    if (currentStreak >= 7) return "🔥";
    if (currentStreak >= 1) return "🔥";
    return "❄️";
  };

  const getStreakColor = () => {
    if (currentStreak >= 100) return "text-orange-500";
    if (currentStreak >= 30) return "text-orange-400";
    if (currentStreak >= 7) return "text-amber-500";
    if (currentStreak >= 1) return "text-amber-400";
    return "text-muted-foreground";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-lg transition-transform",
            currentStreak > 0 && "animate-pulse"
          )}
        >
          {getStreakIcon()}
        </span>
        <span className={cn("font-semibold text-sm", getStreakColor())}>
          {currentStreak} dias
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "text-4xl transition-transform",
              currentStreak > 0 && "animate-bounce"
            )}
            style={{ animationDuration: "2s" }}
          >
            {getStreakIcon()}
          </div>
          <div>
            <p className={cn("text-2xl font-bold", getStreakColor())}>
              {currentStreak} dias
            </p>
            <p className="text-sm text-muted-foreground">Streak atual</p>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-xs text-muted-foreground">Recorde:</span>
            <span className="text-sm font-semibold text-foreground">
              {longestStreak} dias
            </span>
          </div>
          {streakFreezeAvailable && (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-sm">❄️</span>
              <span className="text-xs text-muted-foreground">
                Freeze disponível
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-3 flex items-center gap-2">
        {[7, 14, 30, 60, 100].map((milestone) => (
          <div
            key={milestone}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              currentStreak >= milestone
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : "bg-secondary"
            )}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>7</span>
        <span>14</span>
        <span>30</span>
        <span>60</span>
        <span>100</span>
      </div>
    </div>
  );
}
