import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("subcategories")
        .select("id, name, category_id")
        .order("name");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: true,
  });
}
