import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PieChartData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
}

const MAX_LEGEND_ITEMS = 5;

export function PieChart({ data, title }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => b.value - a.value), 
    [data]
  );
  
  const visibleItems = sortedData.slice(0, MAX_LEGEND_ITEMS);
  const hiddenCount = sortedData.length - MAX_LEGEND_ITEMS;
  const hiddenTotal = sortedData.slice(MAX_LEGEND_ITEMS).reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercent = (value: number) => 
    total > 0 ? `${((value / total) * 100).toFixed(0)}%` : "0%";

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-4">
        {title}
      </h3>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Chart */}
        <div className="w-full sm:w-1/2 h-40 sm:h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                strokeWidth={0}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.12)",
                  padding: "10px 14px",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(name) => name}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend with progress bars */}
        <div className="w-full sm:w-1/2 space-y-3">
          {visibleItems.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-foreground font-medium truncate max-w-[100px] sm:max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-foreground">{formatPercent(item.value)}</span>
                  </div>
                </div>
                <div className="progress-bar h-1.5">
                  <div 
                    className="progress-bar-fill"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
          
          {hiddenCount > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted flex-shrink-0" />
                  <span className="text-muted-foreground">
                    +{hiddenCount} outras
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatPercent(hiddenTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
