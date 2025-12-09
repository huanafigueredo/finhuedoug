import { cn } from "@/lib/utils";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Bank {
  id: string;
  name: string;
  color: string;
}

interface PersonCardProps {
  name: string;
  avatar: string;
  banks: Bank[];
  totalExpenses: string;
  className?: string;
  onAddBank?: () => void;
}

export function PersonCard({
  name,
  avatar,
  banks,
  totalExpenses,
  className,
  onAddBank,
}: PersonCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-card border border-border shadow-card card-hover",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-display font-semibold text-foreground overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Total: {totalExpenses}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Bancos</span>
          <Button variant="ghost" size="sm" onClick={onAddBank} className="h-8 px-2">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bank.color + "20" }}
              >
                <CreditCard className="w-4 h-4" style={{ color: bank.color }} />
              </div>
              <span className="text-sm font-medium text-foreground">
                {bank.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
