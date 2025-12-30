import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavingsGoal } from "@/hooks/useSavingsGoals";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💻", "📱", "🎓", "💍", "🎁", "🏖️", "💰", "🎮"];

interface Bank {
  id: string;
  name: string;
  color: string | null;
}

interface GoalFormContentProps {
  editingGoal: SavingsGoal | null;
  title: string;
  setTitle: (v: string) => void;
  targetAmount: string;
  setTargetAmount: (v: string) => void;
  currentAmount: string;
  setCurrentAmount: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  selectedIcon: string;
  setSelectedIcon: (v: string) => void;
  selectedBankId: string | null;
  setSelectedBankId: (v: string | null) => void;
  banks: Bank[];
  ownerLabel?: string;
  onSave: () => void;
  isSaving: boolean;
  formatCurrencyInput: (v: string) => string;
}

export function GoalFormContent({
  editingGoal,
  title,
  setTitle,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  deadline,
  setDeadline,
  selectedIcon,
  setSelectedIcon,
  selectedBankId,
  setSelectedBankId,
  banks,
  ownerLabel,
  onSave,
  isSaving,
  formatCurrencyInput,
}: GoalFormContentProps) {
  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="text-center pb-2">
        <h3 className="text-lg font-semibold">
          {editingGoal ? "Editar Meta" : "Nova Meta"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {editingGoal
            ? "Atualize os detalhes da sua meta."
            : `Defina uma nova meta ${ownerLabel ? `para ${ownerLabel}` : ""}.`}
        </p>
      </div>

      {/* Seletor de Ícone */}
      <div className="space-y-2">
        <Label>Ícone</Label>
        <div className="flex flex-wrap gap-2 justify-center">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedIcon(emoji)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                selectedIcon === emoji
                  ? "bg-primary/15 ring-2 ring-primary"
                  : "bg-secondary hover:bg-secondary/70"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Viagem de férias"
          maxLength={50}
        />
      </div>

      {/* Valor Alvo */}
      <div className="space-y-2">
        <Label>Valor alvo</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            type="text"
            inputMode="numeric"
            value={targetAmount}
            onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
            placeholder="0,00"
            className="pl-9"
          />
        </div>
      </div>

      {/* Valor Atual */}
      <div className="space-y-2">
        <Label>Valor já guardado (opcional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            type="text"
            inputMode="numeric"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(formatCurrencyInput(e.target.value))}
            placeholder="0,00"
            className="pl-9"
          />
        </div>
      </div>

      {/* Prazo */}
      <div className="space-y-2">
        <Label>Prazo (opcional)</Label>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* Banco */}
      <div className="space-y-2">
        <Label>Banco (opcional)</Label>
        <Select
          value={selectedBankId || "none"}
          onValueChange={(value) => setSelectedBankId(value === "none" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                <div className="flex items-center gap-2">
                  {bank.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bank.color }}
                    />
                  )}
                  {bank.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onSave}
        disabled={isSaving}
        className="w-full h-12"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Target className="w-4 h-4 mr-2" />
        )}
        {editingGoal ? "Salvar" : "Criar Meta"}
      </Button>
    </div>
  );
}
