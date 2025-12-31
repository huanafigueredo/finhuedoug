import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoupleMembers } from "@/hooks/useCoupleMembers";
import { cn } from "@/lib/utils";
import { Check, Pencil, X } from "lucide-react";

interface TransactionSplitEditorProps {
  currentPerson1Percentage: number;
  currentPerson2Percentage: number;
  onSave: (person1Percentage: number, person2Percentage: number) => Promise<void>;
  isLoading?: boolean;
}

const PRESET_SPLITS = [
  { label: "100/0", person1: 100, person2: 0 },
  { label: "70/30", person1: 70, person2: 30 },
  { label: "50/50", person1: 50, person2: 50 },
  { label: "30/70", person1: 30, person2: 70 },
  { label: "0/100", person1: 0, person2: 100 },
];

export function TransactionSplitEditor({
  currentPerson1Percentage,
  currentPerson2Percentage,
  onSave,
  isLoading = false,
}: TransactionSplitEditorProps) {
  const { data: members = [] } = useCoupleMembers();
  const person1 = members.find((m) => m.position === 1);
  const person2 = members.find((m) => m.position === 2);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPerson1, setCustomPerson1] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePresetClick = (preset: typeof PRESET_SPLITS[0]) => {
    setSelectedPreset(preset.label);
    setShowCustomInput(false);
    setCustomPerson1("");
  };

  const handleCustomClick = () => {
    setSelectedPreset(null);
    setShowCustomInput(true);
    setCustomPerson1(currentPerson1Percentage.toString());
  };

  const handleSave = async () => {
    let p1: number;
    let p2: number;

    if (selectedPreset) {
      const preset = PRESET_SPLITS.find((p) => p.label === selectedPreset);
      if (!preset) return;
      p1 = preset.person1;
      p2 = preset.person2;
    } else if (showCustomInput && customPerson1) {
      p1 = Math.min(100, Math.max(0, parseInt(customPerson1) || 0));
      p2 = 100 - p1;
    } else {
      return;
    }

    await onSave(p1, p2);
    setIsEditing(false);
    setSelectedPreset(null);
    setShowCustomInput(false);
    setCustomPerson1("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedPreset(null);
    setShowCustomInput(false);
    setCustomPerson1("");
  };

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-1.5 text-xs text-primary hover:text-primary/80 px-2 h-7"
      >
        <Pencil className="w-3 h-3" />
        Alterar divisão
      </Button>
    );
  }

  const currentPreset = PRESET_SPLITS.find(
    (p) => p.person1 === currentPerson1Percentage && p.person2 === currentPerson2Percentage
  );

  return (
    <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Alterar divisão</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_SPLITS.map((preset) => {
          const isActive = selectedPreset === preset.label || 
            (!selectedPreset && !showCustomInput && currentPreset?.label === preset.label);
          return (
            <Button
              key={preset.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "h-7 px-2.5 text-xs font-medium",
                isActive && "ring-2 ring-primary ring-offset-1"
              )}
            >
              {preset.label}
            </Button>
          );
        })}
        <Button
          variant={showCustomInput ? "default" : "outline"}
          size="sm"
          onClick={handleCustomClick}
          className={cn(
            "h-7 px-2.5 text-xs font-medium",
            showCustomInput && "ring-2 ring-primary ring-offset-1"
          )}
        >
          Outro
        </Button>
      </div>

      {/* Custom input */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">
              {person1?.name || "Pessoa 1"} paga (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={customPerson1}
              onChange={(e) => setCustomPerson1(e.target.value)}
              className="h-8 text-sm"
              placeholder="0-100"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">
              {person2?.name || "Pessoa 2"} paga (%)
            </label>
            <Input
              type="number"
              readOnly
              value={customPerson1 ? 100 - (parseInt(customPerson1) || 0) : ""}
              className="h-8 text-sm bg-muted"
            />
          </div>
        </div>
      )}

      {/* Save button */}
      {(selectedPreset || (showCustomInput && customPerson1)) && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full h-8 gap-1.5 text-xs"
        >
          <Check className="w-3.5 h-3.5" />
          {isLoading ? "Salvando..." : "Salvar divisão"}
        </Button>
      )}
    </div>
  );
}
