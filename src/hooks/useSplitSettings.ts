import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SplitMode = "50-50" | "proporcional" | "personalizado";

export interface SplitSettings {
  id: string;
  user_id: string;
  mode: SplitMode;
  person1_percentage: number;
  person2_percentage: number;
  created_at: string;
  updated_at: string;
}

export function useSplitSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["split-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("split_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as SplitSettings | null;
    },
    enabled: !!user?.id,
  });
}

export function useSaveSplitSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: {
      mode: SplitMode;
      person1_percentage: number;
      person2_percentage: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("split_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("split_settings")
          .update({
            mode: settings.mode,
            person1_percentage: settings.person1_percentage,
            person2_percentage: settings.person2_percentage,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("split_settings")
          .insert({
            user_id: user.id,
            mode: settings.mode,
            person1_percentage: settings.person1_percentage,
            person2_percentage: settings.person2_percentage,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-settings"] });
    },
  });
}
