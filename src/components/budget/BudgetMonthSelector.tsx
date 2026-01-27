import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetMonthSelectorProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    className?: string;
}

export function BudgetMonthSelector({
    currentDate,
    onPrevMonth,
    onNextMonth,
    className
}: BudgetMonthSelectorProps) {
    const formatMonthYear = (date: Date) => {
        return new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
        }).format(date);
    };

    // Capitalize first letter
    const label = formatMonthYear(currentDate).replace(/^\w/, (c) => c.toUpperCase());

    return (
        <div className={cn("flex items-center justify-center gap-4", className)}>
            <Button
                variant="ghost"
                size="icon"
                onClick={onPrevMonth}
                className="h-10 w-10 rounded-full hover:bg-white/10 hover:text-primary transition-all"
            >
                <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-display font-bold text-foreground capitalize">
                    {label}
                </span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onNextMonth}
                className="h-10 w-10 rounded-full hover:bg-white/10 hover:text-primary transition-all"
            >
                <ChevronRight className="h-6 w-6" />
            </Button>
        </div>
    );
}
