import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface CompactMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant?: "default" | "success" | "primary" | "warning";
  delay?: number;
}

export function CompactMetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  delay = 0,
}: CompactMetricCardProps) {
  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50",
        "transition-all duration-200 hover:border-border",
        "animate-fade-up opacity-0"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          iconVariants[variant]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold text-foreground truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
