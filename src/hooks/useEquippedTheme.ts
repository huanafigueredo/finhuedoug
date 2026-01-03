import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme, themes } from "@/lib/themes";

export function useEquippedTheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ["user-theme-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_theme_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no record exists, create one with default theme
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("user_theme_settings")
          .insert({ user_id: user.id, equipped_theme: "theme_default" })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (themeCode: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_theme_settings")
        .upsert({ 
          user_id: user.id, 
          equipped_theme: themeCode,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: "user_id" 
        });

      if (error) throw error;
      return themeCode;
    },
    onSuccess: (themeCode) => {
      // Apply theme immediately
      const isDark = document.documentElement.classList.contains("dark");
      applyTheme(themeCode, isDark);
      queryClient.invalidateQueries({ queryKey: ["user-theme-settings"] });
    },
  });

  useEffect(() => {
    if (!themeSettings?.equipped_theme) return;

    // Detect if dark mode is active
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(themeSettings.equipped_theme, isDark);

    // Listen for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isDarkNow = document.documentElement.classList.contains("dark");
          applyTheme(themeSettings.equipped_theme!, isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [themeSettings?.equipped_theme]);

  // Get available themes list
  const availableThemes = Object.values(themes);

  return {
    equippedTheme: themeSettings?.equipped_theme || "theme_default",
    availableThemes,
    isLoading,
    updateTheme: updateThemeMutation.mutateAsync,
    isUpdating: updateThemeMutation.isPending,
  };
}
