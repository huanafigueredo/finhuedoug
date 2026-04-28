import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BudgetProgress, BudgetSummary } from "@/hooks/useBudgetProgress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BudgetProgressCardProps {
  summary: BudgetSummary;
  className?: string;
  onCategorySelect?: (categoryId: string) => void;
  onEditBudget?: () => void;
}

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

function BudgetItem({
  item,
  onClick
}: {
  item: BudgetProgress;
  onClick?: () => void;
}) {
  const getStatusConfig = () => {
    switch (item.status) {
      case "exceeded":
        return {
          color: "bg-red-500",
          textColor: "text-red-500",
          itemBg: "bg-red-500/5 hover:bg-red-500/10 border-red-500/20",
          icon: XCircle,
          label: "Estourou",
          badgeVariant: "destructive" as const,
        };
      case "warning":
        return {
          color: "bg-amber-500",
          textColor: "text-amber-500",
          itemBg: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20",
          icon: AlertTriangle,
          label: "Atenção",
          badgeVariant: "warning" as const, // We'll map this to outline or secondary since "warning" isn't standard
        };
      default:
        return {
          color: "bg-emerald-500",
          textColor: "text-emerald-500",
          itemBg: "bg-card/40 hover:bg-card/60 border-border/50",
          icon: CheckCircle2,
          label: "OK",
          badgeVariant: "outline" as const,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const progressValue = Math.min(item.percentage, 100);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        config.itemBg
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-background/80 shadow-sm", config.textColor)}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground leading-tight">
              {item.categoryName}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
              <span>{formatCurrency(item.spent)} de {formatCurrency(item.budgeted)}</span>
              {item.rollover > 0 && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  +{formatCurrency(item.rollover)} acumulado
                </span>
              )}
              {item.rollover < 0 && (
                <span className="text-[10px] font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                  {formatCurrency(item.rollover)} déficit
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={cn("text-lg font-bold block", config.textColor)}>
            {item.percentage}%
          </span>
        </div>
      </div>

      <div className="relative h-2 w-full bg-secondary/50 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full transition-all duration-500 ease-out rounded-full", config.color)}
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "flex items-center gap-1 font-medium",
          item.remaining < 0 ? "text-red-500" : "text-emerald-500"
        )}>
          {item.remaining < 0 ? (
            <>
              <TrendingDown className="w-3 h-3" />
              Excedido: {formatCurrency(Math.abs(item.remaining))}
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3" />
              Resta: {formatCurrency(item.remaining)}
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          {item.pacingStatus !== "normal" && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse",
              item.pacingStatus === "danger" ? "bg-red-500/20 text-red-600" : "bg-amber-500/20 text-amber-600"
            )}>
              {item.pacingStatus === "danger" ? "Pise no freio!" : "Ritmo acelerado"}
            </span>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary flex items-center gap-1">
            Detalhes <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function BudgetProgressCard({
  summary,
  className,
  onCategorySelect,
  onEditBudget
}: BudgetProgressCardProps) {
  const { budgetProgress, totalBudgeted, totalSpent, totalRemaining } = summary;

  // Empty State
  if (budgetProgress.length === 0) {
    return (
      <Card className={cn("border-dashed bg-background/50 backdrop-blur-sm", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Comece a Planejar
          </h3>
          <p className="text-muted-foreground max-w-xs mb-6">
            Defina limites para suas categorias e assuma o controle total das suas finanças.
          </p>
          <Button onClick={onEditBudget} className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
            <Target className="w-4 h-4" />
            Configurar Primeiro Orçamento
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall health percentage
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cards Grid - Bento Box Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetProgress.map((item) => (
          <BudgetItem
            key={item.categoryId}
            item={item}
            onClick={() => onCategorySelect?.(item.categoryId)}
          />
        ))}

        {/* Add/Edit More Card */}
        <div
          onClick={onEditBudget}
          className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[140px]"
        >
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Gerenciar Orçamentos
          </span>
        </div>
      </div>
    </div>
  );
}
