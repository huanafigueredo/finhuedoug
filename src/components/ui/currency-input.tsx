import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, parseCurrencyToCents, centsToReais } from "@/lib/currency";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Value in cents (integer) */
  value: number;
  /** Callback with value in cents */
  onChange: (cents: number) => void;
  /** Show R$ prefix inside input */
  showPrefix?: boolean;
  /** Allow zero value */
  allowZero?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showPrefix = false, allowZero = true, placeholder, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      if (value === 0 && !allowZero) return "";
      if (value === 0) return "";
      return formatCurrencyInput(value.toString());
    });

    // Sync display value when external value changes
    React.useEffect(() => {
      if (value === 0) {
        setDisplayValue("");
      } else {
        const formatted = formatCurrencyInput(value.toString());
        setDisplayValue(formatted);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Parse to cents
      const cents = parseCurrencyToCents(inputValue);
      
      // Format for display
      if (cents === 0) {
        setDisplayValue("");
        onChange(0);
      } else {
        const formatted = formatCurrencyInput(inputValue);
        setDisplayValue(formatted);
        onChange(cents);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus for easy editing
      e.target.select();
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure proper formatting on blur
      if (value > 0) {
        setDisplayValue(formatCurrencyInput(value.toString()));
      }
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            R$
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || "R$ 0,00"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showPrefix && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
