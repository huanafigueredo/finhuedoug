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
  success: string;
  successForeground: string;
}

export interface Theme {
  name: string;
  code: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: "Padrão",
    code: "default",
    colors: {
      light: {
        primary: "233 77% 60%",
        primaryForeground: "0 0% 100%",
        secondary: "233 30% 94%",
        secondaryForeground: "233 47% 35%",
        accent: "233 40% 90%",
        accentForeground: "233 47% 35%",
        background: "220 20% 97%",
        foreground: "233 47% 15%",
        card: "0 0% 100%",
        cardForeground: "233 47% 15%",
        muted: "233 20% 92%",
        mutedForeground: "233 20% 45%",
        border: "233 20% 88%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "233 77% 65%",
        primaryForeground: "0 0% 100%",
        secondary: "233 25% 20%",
        secondaryForeground: "233 20% 85%",
        accent: "233 30% 25%",
        accentForeground: "233 20% 90%",
        background: "233 30% 8%",
        foreground: "233 15% 95%",
        card: "233 30% 12%",
        cardForeground: "233 15% 95%",
        muted: "233 25% 18%",
        mutedForeground: "233 15% 60%",
        border: "233 25% 22%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  ocean: {
    name: "Oceano",
    code: "ocean",
    colors: {
      light: {
        primary: "199 89% 48%",
        primaryForeground: "0 0% 100%",
        secondary: "199 40% 92%",
        secondaryForeground: "199 50% 30%",
        accent: "199 50% 88%",
        accentForeground: "199 50% 25%",
        background: "199 20% 97%",
        foreground: "199 50% 12%",
        card: "0 0% 100%",
        cardForeground: "199 50% 12%",
        muted: "199 25% 92%",
        mutedForeground: "199 25% 45%",
        border: "199 25% 86%",
        success: "162 72% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "199 89% 55%",
        primaryForeground: "0 0% 100%",
        secondary: "199 30% 18%",
        secondaryForeground: "199 25% 85%",
        accent: "199 35% 22%",
        accentForeground: "199 25% 90%",
        background: "199 35% 6%",
        foreground: "199 20% 95%",
        card: "199 30% 10%",
        cardForeground: "199 20% 95%",
        muted: "199 28% 15%",
        mutedForeground: "199 20% 60%",
        border: "199 28% 20%",
        success: "162 65% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  sunset: {
    name: "Pôr do Sol",
    code: "sunset",
    colors: {
      light: {
        primary: "20 90% 55%",
        primaryForeground: "0 0% 100%",
        secondary: "20 45% 92%",
        secondaryForeground: "20 55% 30%",
        accent: "350 60% 92%",
        accentForeground: "350 55% 30%",
        background: "30 25% 97%",
        foreground: "20 50% 12%",
        card: "0 0% 100%",
        cardForeground: "20 50% 12%",
        muted: "20 30% 92%",
        mutedForeground: "20 25% 45%",
        border: "20 25% 86%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "20 90% 60%",
        primaryForeground: "0 0% 100%",
        secondary: "20 30% 16%",
        secondaryForeground: "20 25% 85%",
        accent: "350 40% 20%",
        accentForeground: "350 30% 90%",
        background: "20 35% 6%",
        foreground: "20 20% 95%",
        card: "20 30% 10%",
        cardForeground: "20 20% 95%",
        muted: "20 28% 14%",
        mutedForeground: "20 20% 60%",
        border: "20 28% 18%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  forest: {
    name: "Floresta",
    code: "forest",
    colors: {
      light: {
        primary: "152 60% 40%",
        primaryForeground: "0 0% 100%",
        secondary: "152 35% 92%",
        secondaryForeground: "152 45% 25%",
        accent: "152 40% 88%",
        accentForeground: "152 45% 22%",
        background: "140 15% 97%",
        foreground: "152 50% 10%",
        card: "0 0% 100%",
        cardForeground: "152 50% 10%",
        muted: "152 25% 92%",
        mutedForeground: "152 22% 45%",
        border: "152 22% 86%",
        success: "152 70% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "152 55% 50%",
        primaryForeground: "0 0% 100%",
        secondary: "152 28% 16%",
        secondaryForeground: "152 22% 85%",
        accent: "152 32% 20%",
        accentForeground: "152 25% 90%",
        background: "152 35% 5%",
        foreground: "152 18% 95%",
        card: "152 30% 9%",
        cardForeground: "152 18% 95%",
        muted: "152 26% 14%",
        mutedForeground: "152 18% 60%",
        border: "152 26% 18%",
        success: "152 60% 52%",
        successForeground: "0 0% 100%",
      },
    },
  },
  lavender: {
    name: "Lavanda",
    code: "lavender",
    colors: {
      light: {
        primary: "270 60% 60%",
        primaryForeground: "0 0% 100%",
        secondary: "270 40% 94%",
        secondaryForeground: "270 45% 30%",
        accent: "270 45% 90%",
        accentForeground: "270 45% 28%",
        background: "270 18% 97%",
        foreground: "270 50% 12%",
        card: "0 0% 100%",
        cardForeground: "270 50% 12%",
        muted: "270 28% 93%",
        mutedForeground: "270 22% 45%",
        border: "270 25% 88%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "270 60% 68%",
        primaryForeground: "0 0% 100%",
        secondary: "270 28% 18%",
        secondaryForeground: "270 22% 85%",
        accent: "270 32% 22%",
        accentForeground: "270 25% 90%",
        background: "270 35% 6%",
        foreground: "270 18% 95%",
        card: "270 30% 10%",
        cardForeground: "270 18% 95%",
        muted: "270 26% 15%",
        mutedForeground: "270 18% 60%",
        border: "270 26% 20%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  midnight: {
    name: "Meia-Noite",
    code: "midnight",
    colors: {
      light: {
        primary: "230 65% 50%",
        primaryForeground: "0 0% 100%",
        secondary: "230 35% 92%",
        secondaryForeground: "230 45% 30%",
        accent: "230 40% 88%",
        accentForeground: "230 45% 28%",
        background: "230 18% 97%",
        foreground: "230 50% 12%",
        card: "0 0% 100%",
        cardForeground: "230 50% 12%",
        muted: "230 25% 92%",
        mutedForeground: "230 22% 45%",
        border: "230 22% 86%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "230 70% 60%",
        primaryForeground: "0 0% 100%",
        secondary: "230 30% 14%",
        secondaryForeground: "230 25% 85%",
        accent: "230 35% 18%",
        accentForeground: "230 25% 90%",
        background: "230 40% 4%",
        foreground: "230 18% 95%",
        card: "230 35% 8%",
        cardForeground: "230 18% 95%",
        muted: "230 28% 12%",
        mutedForeground: "230 18% 60%",
        border: "230 28% 16%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  rose_gold: {
    name: "Rosê Gold",
    code: "rose_gold",
    colors: {
      light: {
        primary: "350 65% 60%",
        primaryForeground: "0 0% 100%",
        secondary: "350 35% 94%",
        secondaryForeground: "350 45% 30%",
        accent: "30 50% 92%",
        accentForeground: "30 45% 30%",
        background: "350 15% 97%",
        foreground: "350 45% 12%",
        card: "0 0% 100%",
        cardForeground: "350 45% 12%",
        muted: "350 25% 93%",
        mutedForeground: "350 22% 45%",
        border: "350 22% 88%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "350 60% 65%",
        primaryForeground: "0 0% 100%",
        secondary: "350 28% 16%",
        secondaryForeground: "350 22% 85%",
        accent: "30 35% 18%",
        accentForeground: "30 25% 90%",
        background: "350 30% 6%",
        foreground: "350 18% 95%",
        card: "350 28% 10%",
        cardForeground: "350 18% 95%",
        muted: "350 25% 14%",
        mutedForeground: "350 18% 60%",
        border: "350 25% 18%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  arctic: {
    name: "Ártico",
    code: "arctic",
    colors: {
      light: {
        primary: "195 80% 50%",
        primaryForeground: "0 0% 100%",
        secondary: "195 40% 94%",
        secondaryForeground: "195 50% 28%",
        accent: "195 45% 90%",
        accentForeground: "195 50% 25%",
        background: "195 25% 98%",
        foreground: "195 50% 10%",
        card: "0 0% 100%",
        cardForeground: "195 50% 10%",
        muted: "195 30% 94%",
        mutedForeground: "195 25% 45%",
        border: "195 25% 88%",
        success: "162 70% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "195 75% 55%",
        primaryForeground: "0 0% 100%",
        secondary: "195 30% 16%",
        secondaryForeground: "195 25% 85%",
        accent: "195 35% 20%",
        accentForeground: "195 25% 90%",
        background: "195 40% 5%",
        foreground: "195 20% 95%",
        card: "195 35% 9%",
        cardForeground: "195 20% 95%",
        muted: "195 28% 13%",
        mutedForeground: "195 20% 60%",
        border: "195 28% 18%",
        success: "162 65% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
  autumn: {
    name: "Outono",
    code: "autumn",
    colors: {
      light: {
        primary: "30 70% 50%",
        primaryForeground: "0 0% 100%",
        secondary: "30 40% 92%",
        secondaryForeground: "30 50% 28%",
        accent: "15 50% 90%",
        accentForeground: "15 50% 25%",
        background: "35 20% 97%",
        foreground: "30 50% 10%",
        card: "0 0% 100%",
        cardForeground: "30 50% 10%",
        muted: "30 28% 92%",
        mutedForeground: "30 25% 45%",
        border: "30 25% 86%",
        success: "152 65% 45%",
        successForeground: "0 0% 100%",
      },
      dark: {
        primary: "30 75% 55%",
        primaryForeground: "0 0% 100%",
        secondary: "30 30% 14%",
        secondaryForeground: "30 25% 85%",
        accent: "15 35% 18%",
        accentForeground: "15 25% 90%",
        background: "30 35% 5%",
        foreground: "30 18% 95%",
        card: "30 30% 9%",
        cardForeground: "30 18% 95%",
        muted: "30 26% 13%",
        mutedForeground: "30 18% 60%",
        border: "30 26% 17%",
        success: "152 60% 50%",
        successForeground: "0 0% 100%",
      },
    },
  },
};

export function getTheme(code: string): Theme {
  return themes[code] || themes.default;
}

export function applyTheme(code: string, isDark: boolean) {
  const theme = getTheme(code);
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const root = document.documentElement;

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
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--success-foreground", colors.successForeground);
}
