import { ReactNode, useEffect } from "react";
import { useEquippedTheme } from "@/hooks/useEquippedTheme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // This hook will apply the equipped theme automatically
  useEquippedTheme();

  return <>{children}</>;
}
