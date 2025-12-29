import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  id: string;
  user_id: string;
  person_1_name: string;
  person_2_name: string;
  person_1_avatar_url: string | null;
  person_2_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no settings exist, return defaults
      if (!data) {
        return {
          person_1_name: "Huana",
          person_2_name: "Douglas",
        } as Partial<UserSettings>;
      }
      
      return data as UserSettings;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { person_1_name: string; person_2_name: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // First try to update, if no rows affected, insert
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update(updates)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
}

export function usePersonNames() {
  const { data: settings } = useUserSettings();
  
  return {
    person1: settings?.person_1_name || "Huana",
    person2: settings?.person_2_name || "Douglas",
    person1Avatar: settings?.person_1_avatar_url || null,
    person2Avatar: settings?.person_2_avatar_url || null,
  };
}
