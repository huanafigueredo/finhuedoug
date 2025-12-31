export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;
  info: string;
  infoForeground: string;
  popover: string;
  popoverForeground: string;
  // Sidebar colors
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  // MDO custom tokens
  pink: string;
  pinkLight: string;
  pinkGlow: string;
  purple: string;
  purpleLight: string;
}

export interface Theme {
  name: string;
  code: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

// Helper to create consistent theme colors
function createThemeColors(hue: number, saturation: number = 75): { light: ThemeColors; dark: ThemeColors } {
  return {
    light: {
      primary: `${hue} ${saturation}% 55%`,
      primaryForeground: "0 0% 100%",
      secondary: `${hue} 30% 94%`,
      secondaryForeground: `${hue} 47% 35%`,
      accent: `${hue} 40% 90%`,
      accentForeground: `${hue} 47% 35%`,
      background: "68 50% 94%",
      foreground: "240 10% 15%",
      card: "0 0% 100%",
      cardForeground: "240 10% 15%",
      muted: `${hue} 20% 92%`,
      mutedForeground: "240 5% 45%",
      border: `${hue} 20% 88%`,
      input: `${hue} 25% 85%`,
      ring: `${hue} ${saturation}% 55%`,
      success: "145 60% 42%",
      successForeground: "0 0% 100%",
      warning: "40 90% 55%",
      warningForeground: "240 10% 15%",
      destructive: "0 72% 55%",
      destructiveForeground: "0 0% 100%",
      info: `${hue} ${saturation}% 55%`,
      infoForeground: "0 0% 100%",
      popover: "0 0% 100%",
      popoverForeground: "240 10% 15%",
      sidebarBackground: "0 0% 100%",
      sidebarForeground: "240 10% 15%",
      sidebarPrimary: `${hue} ${saturation}% 55%`,
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: `${hue} 40% 88%`,
      sidebarAccentForeground: "240 10% 15%",
      sidebarBorder: `${hue} 25% 85%`,
      sidebarRing: `${hue} ${saturation}% 55%`,
      pink: `${hue} ${saturation}% 55%`,
      pinkLight: `${hue} ${saturation}% 70%`,
      pinkGlow: `${hue} ${saturation}% 85%`,
      purple: "280 60% 55%",
      purpleLight: "280 60% 70%",
    },
    dark: {
      primary: `${hue} ${saturation}% 60%`,
      primaryForeground: "0 0% 100%",
      secondary: `${hue} 25% 20%`,
      secondaryForeground: `${hue} 20% 85%`,
      accent: `${hue} 30% 25%`,
      accentForeground: `${hue} 20% 90%`,
      background: "240 10% 10%",
      foreground: "68 50% 94%",
      card: "240 10% 14%",
      cardForeground: "68 50% 94%",
      muted: `${hue} 25% 18%`,
      mutedForeground: "68 20% 70%",
      border: `${hue} 25% 22%`,
      input: "240 10% 22%",
      ring: `${hue} ${saturation}% 60%`,
      success: "145 60% 50%",
      successForeground: "0 0% 100%",
      warning: "40 90% 60%",
      warningForeground: "240 10% 15%",
      destructive: "0 62% 55%",
      destructiveForeground: "0 0% 100%",
      info: `${hue} ${saturation}% 60%`,
      infoForeground: "0 0% 100%",
      popover: "240 10% 14%",
      popoverForeground: "68 50% 94%",
      sidebarBackground: "240 10% 12%",
      sidebarForeground: "68 50% 94%",
      sidebarPrimary: `${hue} ${saturation}% 60%`,
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: `${hue} 30% 22%`,
      sidebarAccentForeground: "68 50% 94%",
      sidebarBorder: `${hue} 25% 22%`,
      sidebarRing: `${hue} ${saturation}% 60%`,
      pink: `${hue} ${saturation}% 60%`,
      pinkLight: `${hue} ${saturation}% 70%`,
      pinkGlow: `${hue} ${saturation}% 80%`,
      purple: "280 60% 60%",
      purpleLight: "280 60% 70%",
    },
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: "Padrão",
    code: "default",
    colors: createThemeColors(330, 75), // Pink theme (330 hue)
  },
  ocean: {
    name: "Oceano",
    code: "ocean",
    colors: createThemeColors(199, 89), // Cyan/teal
  },
  sunset: {
    name: "Pôr do Sol",
    code: "sunset",
    colors: createThemeColors(20, 90), // Orange
  },
  forest: {
    name: "Floresta",
    code: "forest",
    colors: createThemeColors(152, 60), // Green
  },
  lavender: {
    name: "Lavanda",
    code: "lavender",
    colors: createThemeColors(270, 60), // Purple
  },
  midnight: {
    name: "Meia-Noite",
    code: "midnight",
    colors: createThemeColors(280, 65), // Deep purple instead of blue
  },
  rose_gold: {
    name: "Rosê Gold",
    code: "rose_gold",
    colors: createThemeColors(350, 65), // Rose
  },
  arctic: {
    name: "Ártico",
    code: "arctic",
    colors: createThemeColors(180, 70), // Teal (avoiding blue hue ~200)
  },
  autumn: {
    name: "Outono",
    code: "autumn",
    colors: createThemeColors(30, 70), // Warm orange/brown
  },
};

export function getTheme(code: string): Theme {
  return themes[code] || themes.default;
}

export function applyTheme(code: string, isDark: boolean) {
  const theme = getTheme(code);
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const root = document.documentElement;

  // Core colors
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryForeground);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.accentForeground);
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.cardForeground);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--muted-foreground", colors.mutedForeground);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.input);
  root.style.setProperty("--ring", colors.ring);
  
  // Status colors
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--success-foreground", colors.successForeground);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--warning-foreground", colors.warningForeground);
  root.style.setProperty("--destructive", colors.destructive);
  root.style.setProperty("--destructive-foreground", colors.destructiveForeground);
  root.style.setProperty("--info", colors.info);
  root.style.setProperty("--info-foreground", colors.infoForeground);
  
  // Popover
  root.style.setProperty("--popover", colors.popover);
  root.style.setProperty("--popover-foreground", colors.popoverForeground);
  
  // Sidebar
  root.style.setProperty("--sidebar-background", colors.sidebarBackground);
  root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", colors.sidebarBorder);
  root.style.setProperty("--sidebar-ring", colors.sidebarRing);
  
  // MDO custom tokens - these follow the primary theme color
  root.style.setProperty("--pink", colors.pink);
  root.style.setProperty("--pink-light", colors.pinkLight);
  root.style.setProperty("--pink-glow", colors.pinkGlow);
  root.style.setProperty("--purple", colors.purple);
  root.style.setProperty("--purple-light", colors.purpleLight);
  
  // Blue should follow primary (no more separate blue)
  root.style.setProperty("--blue", colors.primary);
  root.style.setProperty("--blue-light", colors.pinkLight);
}
