import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ContasFiltersProps {
  selectedMonth: number;
  selectedYear: number;
  selectedPerson: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPersonChange: (person: string) => void;
  personOptions: string[];
}

const months = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function ContasFilters({
  selectedMonth,
  selectedYear,
  selectedPerson,
  onMonthChange,
  onYearChange,
  onPersonChange,
  personOptions,
}: ContasFiltersProps) {
  const personFilters = ["todos", ...personOptions];

  return (
    <div className="space-y-3">
      {/* Month/Year Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1">
            {months.map((month, index) => (
              <Button
                key={month}
                size="sm"
                variant={selectedMonth === index + 1 ? "default" : "ghost"}
                className={cn(
                  "h-8 px-3 text-xs shrink-0",
                  selectedMonth === index + 1 && "shadow-sm"
                )}
                onClick={() => onMonthChange(index + 1)}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => onYearChange(Number(v))}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Person Filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {personFilters.map((person) => (
          <Button
            key={person}
            size="sm"
            variant={selectedPerson === person ? "secondary" : "ghost"}
            className={cn(
              "h-7 px-3 text-xs shrink-0 capitalize",
              selectedPerson === person && "shadow-sm"
            )}
            onClick={() => onPersonChange(person)}
          >
            {person === "todos" ? "👥 Todos" : person}
          </Button>
        ))}
      </div>
    </div>
  );
}
