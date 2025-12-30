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
  transaction_id: string | null;
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

      // 1. Buscar informações da meta (título, bank_id, owner)
      const { data: goal, error: goalError } = await supabase
        .from("savings_goals")
        .select("title, bank_id, owner, current_amount")
        .eq("id", input.goal_id)
        .single();

      if (goalError) throw goalError;

      // 2. Inserir o depósito
      const { data: deposit, error: depositError } = await supabase
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

      if (depositError) throw depositError;

      // 3. Determinar for_who baseado no owner da meta
      let forWho: string | null = null;
      if (goal.owner === 'couple') {
        forWho = 'Casal';
      } else if (goal.owner === 'person1') {
        forWho = 'person1';
      } else if (goal.owner === 'person2') {
        forWho = 'person2';
      }

      // 4. Criar transação vinculada
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: 'expense',
          category: 'Reservas e Metas',
          subcategory: 'Meta de Economia',
          description: `Depósito: ${goal.title}`,
          total_value: input.amount, // em centavos
          for_who: forWho,
          paid_by: input.deposited_by,
          bank_id: goal.bank_id,
          savings_deposit_id: deposit.id,
          date: new Date().toISOString().split('T')[0],
          observacao: input.note || null,
        } as any)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 5. Atualizar o depósito com o transaction_id
      const { error: updateDepositError } = await supabase
        .from("savings_deposits")
        .update({ transaction_id: transaction.id } as any)
        .eq("id", deposit.id);

      if (updateDepositError) throw updateDepositError;

      // 6. Atualizar o current_amount da meta
      const newAmount = (goal.current_amount || 0) + input.amount;

      const { error: updateGoalError } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", input.goal_id);

      if (updateGoalError) throw updateGoalError;

      return deposit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["savings-deposits", variables.goal_id] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteSavingsDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, goalId, amount }: { id: string; goalId: string; amount: number }) => {
      // 1. Buscar o depósito para obter o transaction_id
      const { data: deposit, error: fetchDepositError } = await supabase
        .from("savings_deposits")
        .select("transaction_id")
        .eq("id", id)
        .single();

      if (fetchDepositError) throw fetchDepositError;

      // 2. Deletar a transação vinculada (se existir)
      if (deposit?.transaction_id) {
        const { error: deleteTransactionError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", deposit.transaction_id);

        if (deleteTransactionError) throw deleteTransactionError;
      }

      // 3. Atualizar o valor da meta (subtrai o depósito)
      const { data: currentGoal, error: fetchGoalError } = await supabase
        .from("savings_goals")
        .select("current_amount")
        .eq("id", goalId)
        .single();

      if (fetchGoalError) throw fetchGoalError;

      const newAmount = Math.max(0, (currentGoal?.current_amount || 0) - amount);

      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", goalId);

      if (updateError) throw updateError;

      // 4. Deletar o depósito
      const { error: deleteError } = await supabase
        .from("savings_deposits")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
