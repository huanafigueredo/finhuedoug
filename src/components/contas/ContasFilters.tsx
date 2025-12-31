import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect, useCallback } from "react";

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
  const monthsScrollRef = useRef<HTMLDivElement>(null);
  const personScrollRef = useRef<HTMLDivElement>(null);
  
  const [monthsScrollState, setMonthsScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [personScrollState, setPersonScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const checkScroll = useCallback((ref: React.RefObject<HTMLDivElement>, setState: React.Dispatch<React.SetStateAction<{ canScrollLeft: boolean; canScrollRight: boolean }>>) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setState({
        canScrollLeft: scrollLeft > 5,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 5,
      });
    }
  }, []);

  useEffect(() => {
    checkScroll(monthsScrollRef, setMonthsScrollState);
    checkScroll(personScrollRef, setPersonScrollState);
  }, [checkScroll]);

  useEffect(() => {
    // Scroll to selected month on mount
    if (monthsScrollRef.current) {
      const selectedButton = monthsScrollRef.current.querySelector(`[data-month="${selectedMonth}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);

  const handleMonthsScroll = () => checkScroll(monthsScrollRef, setMonthsScrollState);
  const handlePersonScroll = () => checkScroll(personScrollRef, setPersonScrollState);

  return (
    <div className="space-y-3">
      {/* Month/Year Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          {/* Left fade indicator */}
          <div 
            className={cn(
              "absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
              monthsScrollState.canScrollLeft ? "opacity-100" : "opacity-0"
            )}
          />
          
          <div 
            ref={monthsScrollRef}
            onScroll={handleMonthsScroll}
            className="overflow-x-auto scrollbar-hide scroll-smooth"
          >
            <div className="flex gap-1 px-1">
              {months.map((month, index) => (
                <Button
                  key={month}
                  data-month={index + 1}
                  size="sm"
                  variant={selectedMonth === index + 1 ? "default" : "ghost"}
                  className={cn(
                    "h-8 px-2.5 sm:px-3 text-xs shrink-0 transition-all",
                    selectedMonth === index + 1 && "shadow-sm scale-105"
                  )}
                  onClick={() => onMonthChange(index + 1)}
                >
                  {month}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Right fade indicator */}
          <div 
            className={cn(
              "absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
              monthsScrollState.canScrollRight ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
        
        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => onYearChange(Number(v))}
        >
          <SelectTrigger className="w-[72px] sm:w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Person Filter */}
      <div className="relative">
        {/* Left fade indicator */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            personScrollState.canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        
        <div 
          ref={personScrollRef}
          onScroll={handlePersonScroll}
          className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth pb-1 px-0.5"
        >
          {personFilters.map((person) => (
            <Button
              key={person}
              size="sm"
              variant={selectedPerson === person ? "secondary" : "ghost"}
              className={cn(
                "h-7 px-2.5 sm:px-3 text-xs shrink-0 capitalize transition-all",
                selectedPerson === person && "shadow-sm scale-105"
              )}
              onClick={() => onPersonChange(person)}
            >
              {person === "todos" ? "👥 Todos" : person}
            </Button>
          ))}
        </div>
        
        {/* Right fade indicator */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
            personScrollState.canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}
