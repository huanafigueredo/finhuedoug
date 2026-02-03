import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Bank {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  user_id: string | null;
  type: "account" | "credit_card";
  closing_day: number | null;
  due_day: number | null;
}

export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Bank[];
    },
  });
}

export function useAddBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color, type, closing_day, due_day }: {
      name: string;
      color?: string;
      type?: "account" | "credit_card";
      closing_day?: number | null;
      due_day?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("banks")
        .insert({
          name,
          color,
          user_id: user.id,
          type: type || 'account',
          closing_day,
          due_day
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banks"] }),
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, color, type, closing_day, due_day }: {
      id: string;
      name: string;
      color?: string;
      type?: "account" | "credit_card";
      closing_day?: number | null;
      due_day?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("banks")
        .update({
          name,
          color,
          type,
          closing_day,
          due_day
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banks"] }),
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("banks").delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Não foi possível excluir o item. Verifique suas permissões.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banks"] }),
  });
}
