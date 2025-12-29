import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoupleMember {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useCoupleMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["couple-members", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("couple_members")
        .select("*")
        .eq("user_id", user.id)
        .order("position");

      if (error) throw error;
      return (data || []) as CoupleMember[];
    },
    enabled: !!user?.id,
  });
}

export function useAddCoupleMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, avatar_url }: { name: string; avatar_url?: string | null }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get next position
      const { data: existing } = await supabase
        .from("couple_members")
        .select("position")
        .eq("user_id", user.id)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

      const { data, error } = await supabase
        .from("couple_members")
        .insert({
          user_id: user.id,
          name,
          avatar_url: avatar_url || null,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-members"] });
    },
  });
}

export function useUpdateCoupleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      avatar_url 
    }: { 
      id: string; 
      name?: string; 
      avatar_url?: string | null;
    }) => {
      const updates: Partial<Pick<CoupleMember, "name" | "avatar_url">> = {};
      if (name !== undefined) updates.name = name;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      const { data, error } = await supabase
        .from("couple_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-members"] });
    },
  });
}

export function useDeleteCoupleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("couple_members")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Não foi possível excluir o item. Verifique suas permissões.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-members"] });
    },
  });
}

// Helper hook for backwards compatibility
export function usePersonNames() {
  const { data: members = [], isLoading } = useCoupleMembers();
  
  const person1 = members.find(m => m.position === 1);
  const person2 = members.find(m => m.position === 2);

  return {
    person1: person1?.name || "Pessoa 1",
    person2: person2?.name || "Pessoa 2",
    person1Avatar: person1?.avatar_url || null,
    person2Avatar: person2?.avatar_url || null,
    person1Id: person1?.id || null,
    person2Id: person2?.id || null,
    members,
    isLoading,
  };
}
