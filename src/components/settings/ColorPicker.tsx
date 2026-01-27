import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
}

const PRESET_COLORS = [
    "#D77A61", // Terra Cotta (Theme Primary)
    "#dbb4ad", // Rose Gold
    "#a2d2ff", // Light Blue
    "#ffc8dd", // Light Pink
    "#cdb4db", // Lavender
    "#bde0fe", // Pale Blue
    "#264653", // Charcoal
    "#2a9d8f", // Teal
    "#e9c46a", // Yellow
    "#f4a261", // Orange
    "#e76f51", // Burnt Orange
    "#606c38", // Olive
];

export function ColorPicker({ color, onChange, label = "Cor" }: ColorPickerProps) {
    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            {/* Visual Presets */}
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        onClick={() => onChange(preset)}
                        className={cn(
                            "item-center justify-center w-8 h-8 rounded-full border border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            color === preset && "ring-2 ring-primary ring-offset-2"
                        )}
                        style={{ backgroundColor: preset }}
                    >
                        {color === preset && (
                            <Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />
                        )}
                    </button>
                ))}
            </div>

            {/* Custom Picker */}
            <div className="flex items-center gap-3 mt-2">
                <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-border cursor-pointer">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Ou escolha uma cor personalizada</p>
            </div>
        </div>
    );
}
