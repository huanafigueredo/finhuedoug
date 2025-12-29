import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  lines: {
    dataKey: string;
    color: string;
    name: string;
  }[];
  title: string;
}

export function LineChart({ data, lines, title }: LineChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
          {title}
        </h3>
        
        {/* Custom Legend */}
        <div className="flex flex-wrap gap-3">
          {lines.map((line) => (
            <div key={line.dataKey} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {line.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {lines.map((line) => (
                <linearGradient 
                  key={`gradient-${line.dataKey}`} 
                  id={`gradient-${line.dataKey}`} 
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={line.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              dy={8}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(value)
              }
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 16px -4px rgba(0,0,0,0.1)",
                padding: "8px 12px",
              }}
              formatter={(value: number, name: string) => {
                const line = lines.find(l => l.dataKey === name);
                return [formatCurrency(value), line?.name || name];
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
            />
            {lines.map((line) => (
              <Area
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2.5}
                fill={`url(#gradient-${line.dataKey})`}
                name={line.dataKey}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  strokeWidth: 2, 
                  stroke: "hsl(var(--background))",
                  fill: line.color 
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
