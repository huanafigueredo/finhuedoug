import * as React from "react";
import { cn } from "@/lib/utils";

interface TogglePillProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TogglePill({ options, value, onChange, className }: TogglePillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-full bg-secondary/80 border border-border/50",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-pink"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
