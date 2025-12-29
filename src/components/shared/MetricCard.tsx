import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  emoji?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "info";
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  emoji,
  trend,
  variant = "default",
  className,
  delay = 0,
}: MetricCardProps) {
  const variants = {
    default: "bg-card border-border/50",
    primary: "bg-card border-primary/20",
    accent: "bg-card border-accent/20",
    success: "bg-card border-success/20",
    warning: "bg-card border-warning/20",
    info: "bg-card border-info/20",
  };

  const iconBgVariants = {
    default: "bg-muted",
    primary: "bg-primary/15",
    accent: "bg-accent/15",
    success: "bg-success/15",
    warning: "bg-warning/15",
    info: "bg-info/15",
  };

  const iconColorVariants = {
    default: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
  };

  return (
    <div
      className={cn(
        "relative p-4 sm:p-5 rounded-2xl border shadow-card overflow-hidden transition-all duration-300",
        "hover:shadow-card-hover hover:-translate-y-1",
        "animate-fade-up opacity-0",
        variants[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Icon positioned top-right (only if provided) */}
      {Icon && (
        <div 
          className={cn(
            "absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center",
            "transition-transform duration-300 group-hover:scale-110",
            iconBgVariants[variant]
          )}
        >
          <Icon className={cn("w-5 h-5 sm:w-5.5 sm:h-5.5", iconColorVariants[variant])} />
        </div>
      )}

      {/* Content */}
      <div className={Icon ? "pr-14 sm:pr-16" : ""}>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 truncate">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {emoji && <span className="text-xl sm:text-2xl">{emoji}</span>}
          <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
            {value}
          </p>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 truncate">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                trend.isPositive 
                  ? "bg-success/15 text-success" 
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
