import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme } from "@/lib/themes";

export function useEquippedTheme() {
  const { user } = useAuth();

  const { data: gamificationData } = useQuery({
    queryKey: ["user-gamification-theme", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_gamification")
        .select("equipped_theme")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!gamificationData?.equipped_theme) return;

    // Detect if dark mode is active
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(gamificationData.equipped_theme, isDark);

    // Listen for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isDarkNow = document.documentElement.classList.contains("dark");
          applyTheme(gamificationData.equipped_theme!, isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [gamificationData?.equipped_theme]);

  return {
    equippedTheme: gamificationData?.equipped_theme || "default",
  };
}
