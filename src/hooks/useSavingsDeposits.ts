import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SavingsDeposit {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number; // em centavos
  deposited_by: string; // 'person1' ou 'person2'
  note: string | null;
  created_at: string;
}

export interface SavingsDepositInput {
  goal_id: string;
  amount: number;
  deposited_by: string;
  note?: string;
}

export function useSavingsDeposits(goalId?: string) {
  return useQuery({
    queryKey: ["savings-deposits", goalId],
    queryFn: async () => {
      let query = supabase
        .from("savings_deposits")
        .select("*")
        .order("created_at", { ascending: false });

      if (goalId) {
        query = query.eq("goal_id", goalId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SavingsDeposit[];
    },
    enabled: !!goalId || goalId === undefined,
  });
}

export function useCreateSavingsDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavingsDepositInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Inserir o depósito
      const { data, error } = await supabase
        .from("savings_deposits")
        .insert({
          user_id: user.id,
          goal_id: input.goal_id,
          amount: input.amount,
          deposited_by: input.deposited_by,
          note: input.note || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Atualizar o current_amount da meta
      const { data: currentGoal, error: fetchError } = await supabase
        .from("savings_goals")
        .select("current_amount")
        .eq("id", input.goal_id)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = (currentGoal?.current_amount || 0) + input.amount;

      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", input.goal_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["savings-deposits", variables.goal_id] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}

export function useDeleteSavingsDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, goalId, amount }: { id: string; goalId: string; amount: number }) => {
      // Primeiro atualiza o valor da meta (subtrai o depósito)
      const { data: currentGoal, error: fetchError } = await supabase
        .from("savings_goals")
        .select("current_amount")
        .eq("id", goalId)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = Math.max(0, (currentGoal?.current_amount || 0) - amount);

      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", goalId);

      if (updateError) throw updateError;

      // Depois deleta o depósito
      const { error } = await supabase
        .from("savings_deposits")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
  });
}
