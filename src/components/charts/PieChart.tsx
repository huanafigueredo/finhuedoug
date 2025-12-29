import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface PieChartData {
  name: string;
  value: number;
  color: string;
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
    total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-card overflow-hidden">
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
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px -4px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(name) => name}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="w-full sm:w-1/2 max-h-44 overflow-y-auto scrollbar-thin">
          <div className="space-y-2">
            {visibleItems.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 text-xs sm:text-sm group"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground truncate flex-1 min-w-0">
                  {item.name}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
                  <span className="text-muted-foreground text-xs">
                    {formatPercent(item.value)}
                  </span>
                  <span className="font-medium text-foreground hidden sm:inline">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            ))}
            
            {hiddenCount > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm pt-1 border-t border-border/50">
                <div className="w-3 h-3 rounded-full flex-shrink-0 bg-muted" />
                <span className="text-muted-foreground truncate flex-1">
                  e mais {hiddenCount} {hiddenCount === 1 ? 'categoria' : 'categorias'}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-muted-foreground text-xs">
                    {formatPercent(hiddenTotal)}
                  </span>
                  <span className="font-medium text-muted-foreground hidden sm:inline">
                    {formatCurrency(hiddenTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
