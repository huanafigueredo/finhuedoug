import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonData {
  name: string;
  expenses: number;
  income: number;
  balance: number;
}

interface PersonComparisonCardProps {
  person1: PersonData;
  person2: PersonData;
  formatCurrency: (value: number) => string;
  delay?: number;
}

function PersonColumn({
  person,
  formatCurrency,
  isRight = false,
}: {
  person: PersonData;
  formatCurrency: (value: number) => string;
  isRight?: boolean;
}) {
  return (
    <div className={cn("flex-1 space-y-3", isRight && "text-right")}>
      <p className="text-sm font-medium text-foreground">{person.name}</p>
      
      <div className="space-y-2">
        <div className={cn("flex items-center gap-2", isRight && "flex-row-reverse")}>
          <span className="text-lg">💸</span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(person.expenses)}
          </span>
        </div>
        
        <div className={cn("flex items-center gap-2", isRight && "flex-row-reverse")}>
          <span className="text-lg">💰</span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(person.income)}
          </span>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <div className={cn("flex items-center gap-2", isRight && "flex-row-reverse")}>
            <span className="text-lg">{person.balance >= 0 ? "✨" : "😅"}</span>
            <span
              className={cn(
                "text-base font-bold",
                person.balance >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatCurrency(person.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PersonComparisonCard({
  person1,
  person2,
  formatCurrency,
  delay = 0,
}: PersonComparisonCardProps) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card animate-fade-up opacity-0 transition-all duration-300 hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">👫</span>
          Resumo Individual
        </h3>
        <Link
          to="/pessoas"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Detalhes
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex gap-6">
        <PersonColumn person={person1} formatCurrency={formatCurrency} />
        
        {/* Divider */}
        <div className="w-px bg-border/50 self-stretch" />
        
        <PersonColumn person={person2} formatCurrency={formatCurrency} isRight />
      </div>
    </div>
  );
}
