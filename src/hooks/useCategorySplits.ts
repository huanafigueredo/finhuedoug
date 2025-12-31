import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CategorySplit {
  id: string;
  user_id: string;
  category_name: string;
  subcategory_name: string | null;
  person1_percentage: number;
  person2_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CategorySplitInput {
  category_name: string;
  subcategory_name?: string | null;
  person1_percentage: number;
  person2_percentage: number;
}

export function useCategorySplits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["category-splits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_splits")
        .select("*")
        .order("category_name", { ascending: true });

      if (error) throw error;
      return data as CategorySplit[];
    },
    enabled: !!user,
  });
}

export function useAddCategorySplit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CategorySplitInput) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("category_splits")
        .insert({
          user_id: user.id,
          category_name: input.category_name,
          subcategory_name: input.subcategory_name || null,
          person1_percentage: input.person1_percentage,
          person2_percentage: input.person2_percentage,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-splits"] });
    },
  });
}

export function useUpdateCategorySplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CategorySplitInput & { id: string }) => {
      const { data, error } = await supabase
        .from("category_splits")
        .update({
          category_name: input.category_name,
          subcategory_name: input.subcategory_name || null,
          person1_percentage: input.person1_percentage,
          person2_percentage: input.person2_percentage,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-splits"] });
    },
  });
}

export function useDeleteCategorySplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("category_splits")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-splits"] });
    },
  });
}

// Helper function to get split for a specific category/subcategory
export function getCategorySplit(
  splits: CategorySplit[] | undefined,
  category: string | null | undefined,
  subcategory: string | null | undefined
): CategorySplit | null {
  if (!splits || !category) return null;

  // First, try to find exact match with subcategory
  if (subcategory) {
    const exactMatch = splits.find(
      (s) => s.category_name === category && s.subcategory_name === subcategory
    );
    if (exactMatch) return exactMatch;
  }

  // Then, try to find category-level rule (subcategory_name is null)
  const categoryMatch = splits.find(
    (s) => s.category_name === category && s.subcategory_name === null
  );
  if (categoryMatch) return categoryMatch;

  return null;
}
