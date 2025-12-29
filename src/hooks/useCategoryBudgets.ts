import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  budget_amount: number; // em centavos
  created_at: string;
  updated_at: string;
}

export function useCategoryBudgets() {
  return useQuery({
    queryKey: ["category-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_budgets")
        .select("*")
        .order("created_at");

      if (error) throw error;
      return data as CategoryBudget[];
    },
  });
}

export function useUpsertCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category_id, budget_amount }: { category_id: string; budget_amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Tentar atualizar primeiro
      const { data: existing } = await supabase
        .from("category_budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", category_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("category_budgets")
          .update({ budget_amount })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("category_budgets")
          .insert({
            user_id: user.id,
            category_id,
            budget_amount,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
    },
  });
}

export function useDeleteCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("category_budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
    },
  });
}
