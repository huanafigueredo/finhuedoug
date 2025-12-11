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
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const variants = {
    default: "bg-card border-border",
    primary: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    accent: "bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20",
    success: "bg-gradient-to-br from-success/5 to-success/10 border-success/20",
  };

  const iconVariants = {
    default: "bg-gradient-romantic text-white",
    primary: "bg-gradient-romantic text-white",
    accent: "bg-gradient-to-br from-accent to-lavender text-white",
    success: "bg-gradient-to-br from-success to-emerald-400 text-white",
  };

  return (
    <div
      className={cn(
        "group p-6 rounded-2xl border shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
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
        <div className={cn(
          "p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300",
          iconVariants[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
