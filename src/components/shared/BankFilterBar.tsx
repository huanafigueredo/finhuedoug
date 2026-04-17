import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Bank {
  id: string;
  name: string;
  color: string | null;
}

interface BankFilterBarProps {
  banks: Bank[];
  selectedBanks: string[];
  onToggleBank: (bankName: string) => void;
  onClear: () => void;
  className?: string;
}

export function BankFilterBar({
  banks,
  selectedBanks,
  onToggleBank,
  onClear,
  className
}: BankFilterBarProps) {
  if (!banks || banks.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 animate-fade-in", className)}>
      {banks.map((bank) => {
        const isSelected = selectedBanks.includes(bank.name);
        const bankColor = bank.color || "#8E9196";

        return (
          <Button
            key={bank.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleBank(bank.name)}
            className={cn(
              "h-8 px-4 text-xs font-semibold rounded-full transition-all duration-300",
              isSelected
                ? "shadow-md border-transparent hover:opacity-90 active:scale-95"
                : "hover:border-primary/30 hover:bg-secondary/50 active:scale-95 border-border/50 shadow-sm"
            )}
            style={{
              backgroundColor: isSelected ? bankColor : undefined,
              borderColor: !isSelected ? `${bankColor}40` : undefined,
              color: isSelected ? "#fff" : bankColor
            }}
          >
            {bank.name}
          </Button>
        );
      })}
      {selectedBanks.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Limpar
        </Button>
      )}
    </div>
  );
}
