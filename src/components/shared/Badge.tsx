import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface BadgeProps {
  variant: "income" | "expense" | "couple";
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variants = {
    income: "bg-success/10 text-success border-success/20",
    expense: "bg-primary/10 text-primary border-primary/20",
    couple: "bg-primary/10 text-primary border-primary/20",
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
