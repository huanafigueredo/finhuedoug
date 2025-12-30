import { cn } from "@/lib/utils";
import { Challenge, UserChallenge } from "@/hooks/useChallenges";
import { CheckCircle2 } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  compact?: boolean;
}

export function ChallengeCard({
  challenge,
  userChallenge,
  compact = false,
}: ChallengeCardProps) {
  const progress = userChallenge?.progress || 0;
  const isCompleted = userChallenge?.completed || false;
  const percentage = Math.min((progress / challenge.requirement_value) * 100, 100);

  if (compact) {
    return (
      <div
        className={cn(
          "p-3 rounded-xl border transition-all",
          isCompleted
            ? "bg-success/10 border-success/30"
            : "bg-card border-border/50"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{challenge.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-foreground">
              {challenge.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCompleted ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {progress}/{challenge.requirement_value}
              </span>
            </div>
          </div>
          {isCompleted && (
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all",
        isCompleted
          ? "bg-success/10 border-success/30"
          : "bg-card border-border/50 hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{challenge.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{challenge.name}</p>
              <span
                className={cn(
                  "inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs",
                  challenge.type === "weekly"
                    ? "bg-pink-500/20 text-pink-600 dark:text-pink-400"
                    : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                )}
              >
                {challenge.type === "weekly" ? "Semanal" : "Mensal"}
              </span>
            </div>

            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                +{challenge.xp_reward} XP
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {challenge.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>
                {progress} / {challenge.requirement_value}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  isCompleted
                    ? "bg-success"
                    : "bg-gradient-to-r from-primary to-primary/70"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {isCompleted && userChallenge?.completed_at && (
            <p className="text-xs text-success mt-2">
              ✓ Completado em{" "}
              {new Date(userChallenge.completed_at).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
