import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "success";
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  delay = 0,
}: MetricCardProps) {
  const variants = {
    default: "bg-card border-border",
    primary: "bg-primary/5 border-primary/20",
    accent: "bg-accent/5 border-accent/20",
    success: "bg-success/5 border-success/20",
  };

  const iconBgVariants = {
    default: "bg-muted/80",
    primary: "bg-primary/15",
    accent: "bg-accent/15",
    success: "bg-success/15",
  };

  const iconColorVariants = {
    default: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-accent-foreground",
    success: "text-success",
  };

  return (
    <div
      className={cn(
        "relative p-4 sm:p-5 rounded-2xl border shadow-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        "animate-fade-up opacity-0",
        variants[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Icon positioned top-right */}
      <div 
        className={cn(
          "absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
          iconBgVariants[variant]
        )}
      >
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColorVariants[variant])} />
      </div>

      {/* Content */}
      <div className="pr-12 sm:pr-14">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
          {title}
        </p>
        <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 truncate">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "text-xs sm:text-sm font-semibold",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
