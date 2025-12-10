import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAddSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, category_id }: { name: string; category_id: string }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert({ name, category_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, category_id }: { id: string; name: string; category_id?: string }) => {
      const updateData: { name: string; category_id?: string } = { name };
      if (category_id) updateData.category_id = category_id;
      
      const { data, error } = await supabase
        .from("subcategories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are transactions linked
      const { data: subcategory } = await supabase
        .from("subcategories")
        .select("name")
        .eq("id", id)
        .single();

      if (subcategory) {
        const { data: transactions, error: txError } = await supabase
          .from("transactions")
          .select("id")
          .eq("subcategory", subcategory.name)
          .limit(1);

        if (txError) throw txError;
        if (transactions && transactions.length > 0) {
          throw new Error("Esta subcategoria possui lançamentos vinculados. Não é possível excluí-la.");
        }
      }

      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
}
