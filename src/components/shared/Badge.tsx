import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface BadgeProps {
  variant: "income" | "expense" | "couple";
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variants = {
    income: "bg-gradient-to-r from-success/20 to-emerald-400/20 text-success border-success/30",
    expense: "bg-gradient-to-r from-primary/20 to-rose-light/20 text-primary border-primary/30",
    couple: "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30",
  };

  if (variant === "couple") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
          variants[variant],
          className
        )}
      >
        <Heart className="w-3 h-3 fill-current" />
        Casal
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children || (variant === "income" ? "Receita" : "Despesa")}
    </span>
  );
}
