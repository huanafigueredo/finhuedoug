import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BudgetProgress, BudgetSummary } from "@/hooks/useBudgetProgress";
import { Link, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetProgressCardProps {
  summary: BudgetSummary;
  className?: string;
  showConfigLink?: boolean;
}

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

function BudgetItem({ item, index }: { item: BudgetProgress; index: number }) {
  const navigate = useNavigate();
  
  const getStatusConfig = () => {
    switch (item.status) {
      case "exceeded":
        return {
          color: "bg-destructive",
          textColor: "text-destructive",
          icon: XCircle,
          label: "Ultrapassado",
          description: "Você gastou mais do que o limite definido para esta categoria.",
          badgeVariant: "destructive" as const,
        };
      case "warning":
        return {
          color: "bg-warning",
          textColor: "text-warning",
          icon: AlertTriangle,
          label: "Atenção",
          description: "Você já usou 80% ou mais do orçamento desta categoria.",
          badgeVariant: "warning" as const,
        };
      default:
        return {
          color: "bg-success",
          textColor: "text-success",
          icon: CheckCircle,
          label: "OK",
          description: "Você está dentro do limite para esta categoria.",
          badgeVariant: "success" as const,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const progressValue = Math.min(item.percentage, 100);

  const handleClick = () => {
    navigate(`/lancamentos?categoria=${encodeURIComponent(item.categoryName)}`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "space-y-2 p-3 rounded-xl cursor-pointer transition-all duration-200",
              "hover:bg-secondary/50 hover:shadow-sm",
              "animate-fade-up opacity-0",
              "group"
            )}
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
            onClick={handleClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.categoryName}
                </span>
                {item.status !== "ok" && (
                  <Badge variant={config.badgeVariant} className="text-xs py-0 h-5">
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {item.status === "exceeded" ? `+${item.percentage - 100}%` : `${item.percentage}%`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium", config.textColor)}>
                  {item.percentage}%
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={progressValue} 
                className={cn(
                  "h-2",
                  item.status === "exceeded" && "[&>div]:bg-destructive",
                  item.status === "warning" && "[&>div]:bg-warning",
                  item.status === "ok" && "[&>div]:bg-success"
                )}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
              </span>
              <span className={cn(
                item.remaining >= 0 ? "text-success" : "text-destructive"
              )}>
                {item.remaining >= 0 ? "Sobra: " : "Excesso: "}
                {formatCurrency(Math.abs(item.remaining))}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1">
              <StatusIcon className={cn("w-4 h-4", config.textColor)} />
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <p className="text-xs text-primary mt-1">Clique para ver lançamentos →</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BudgetProgressCard({ summary, className, showConfigLink = true }: BudgetProgressCardProps) {
  const { budgetProgress, totalBudgeted, totalSpent, totalRemaining } = summary;

  if (budgetProgress.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            Orçamento do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum orçamento definido
            </p>
            {showConfigLink && (
              <Link 
                to="/orcamentos" 
                className="text-sm text-primary hover:underline"
              >
                Configurar orçamentos →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            Orçamento do Mês
          </CardTitle>
          {showConfigLink && (
            <Link 
              to="/orcamentos" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Editar
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Budget Items */}
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 -mx-3">
          {budgetProgress.map((item, index) => (
            <BudgetItem key={item.categoryId} item={item} index={index} />
          ))}
        </div>

        {/* Summary Footer */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Orçado</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalBudgeted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gasto</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {totalRemaining >= 0 ? "Disponível" : "Excedido"}
              </p>
              <p className={cn(
                "text-sm font-semibold flex items-center justify-center gap-1",
                totalRemaining >= 0 ? "text-success" : "text-destructive"
              )}>
                {totalRemaining >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatCurrency(Math.abs(totalRemaining))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
