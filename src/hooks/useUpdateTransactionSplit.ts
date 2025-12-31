import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpdateSplitParams {
  transactionId: string;
  person1Percentage: number;
  person2Percentage: number;
}

export function useUpdateTransactionSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, person1Percentage, person2Percentage }: UpdateSplitParams) => {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          custom_person1_percentage: person1Percentage,
          custom_person2_percentage: person2Percentage,
        })
        .eq("id", transactionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating transaction split:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
