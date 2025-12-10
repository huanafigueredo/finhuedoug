import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAddCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update({ name })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are subcategories linked
      const { data: subcategories, error: subError } = await supabase
        .from("subcategories")
        .select("id")
        .eq("category_id", id)
        .limit(1);

      if (subError) throw subError;
      if (subcategories && subcategories.length > 0) {
        throw new Error("Esta categoria possui subcategorias vinculadas. Remova-as primeiro.");
      }

      // Check if there are transactions linked
      const { data: category } = await supabase
        .from("categories")
        .select("name")
        .eq("id", id)
        .single();

      if (category) {
        const { data: transactions, error: txError } = await supabase
          .from("transactions")
          .select("id")
          .eq("category", category.name)
          .limit(1);

        if (txError) throw txError;
        if (transactions && transactions.length > 0) {
          throw new Error("Esta categoria possui lançamentos vinculados. Não é possível excluí-la.");
        }
      }

      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
