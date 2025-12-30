import { cn } from "@/lib/utils";

interface CompactMetricCardProps {
  emoji: string;
  label: string;
  value: string;
  variant?: "default" | "success" | "primary" | "warning";
  delay?: number;
}

export function CompactMetricCard({
  emoji,
  label,
  value,
  variant = "default",
  delay = 0,
}: CompactMetricCardProps) {
  const borderVariants = {
    default: "border-border/50",
    success: "border-success/30",
    primary: "border-primary/30",
    warning: "border-warning/30",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl bg-card border shadow-card",
        "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
        "animate-fade-up opacity-0",
        borderVariants[variant]
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <span className="text-2xl sm:text-3xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-base sm:text-lg font-bold text-foreground truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
