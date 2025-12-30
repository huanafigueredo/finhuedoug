import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface BudgetDonutChartProps {
  spent: number;
  budgeted: number;
  className?: string;
}

export function BudgetDonutChart({ spent, budgeted, className }: BudgetDonutChartProps) {
  const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
  const displayPercentage = Math.min(percentage, 999);
  
  const status = useMemo(() => {
    if (percentage >= 100) return "exceeded";
    if (percentage >= 80) return "warning";
    return "ok";
  }, [percentage]);

  const statusConfig = {
    ok: {
      color: "hsl(var(--success))",
      bgColor: "hsl(var(--success) / 0.15)",
      label: "Dentro do limite",
      emoji: "✨",
    },
    warning: {
      color: "hsl(var(--warning))",
      bgColor: "hsl(var(--warning) / 0.15)",
      label: "Atenção",
      emoji: "⚠️",
    },
    exceeded: {
      color: "hsl(var(--destructive))",
      bgColor: "hsl(var(--destructive) / 0.15)",
      label: "Ultrapassado",
      emoji: "🚨",
    },
  };

  const config = statusConfig[status];
  
  const data = [
    { name: "Gasto", value: Math.min(spent, budgeted) },
    { name: "Disponível", value: Math.max(budgeted - spent, 0) },
  ];

  const COLORS = [config.color, "hsl(var(--muted))"];

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index]} 
                  strokeWidth={0}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl mb-1">{config.emoji}</span>
          <span className={cn(
            "text-2xl font-display font-bold",
            status === "ok" && "text-success",
            status === "warning" && "text-warning",
            status === "exceeded" && "text-destructive"
          )}>
            {displayPercentage}%
          </span>
        </div>
      </div>
      
      <p className={cn(
        "text-sm font-medium mt-2",
        status === "ok" && "text-success",
        status === "warning" && "text-warning",
        status === "exceeded" && "text-destructive"
      )}>
        {config.label}
      </p>
    </div>
  );
}
