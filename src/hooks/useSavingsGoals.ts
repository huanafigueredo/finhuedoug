import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number; // em centavos
  current_amount: number; // em centavos
  deadline: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  icon?: string;
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavingsGoal[];
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavingsGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user.id,
          title: input.title,
          target_amount: input.target_amount,
          current_amount: input.current_amount || 0,
          deadline: input.deadline || null,
          icon: input.icon || "🎯",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<SavingsGoalInput>) => {
      const { data, error } = await supabase
        .from("savings_goals")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}

export function useAddToSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // Buscar valor atual
      const { data: current, error: fetchError } = await supabase
        .from("savings_goals")
        .select("current_amount")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = (current?.current_amount || 0) + amount;

      const { data, error } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}
