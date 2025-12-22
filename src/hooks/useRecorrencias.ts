import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addMonths, setDate, endOfMonth, format } from "date-fns";

export interface Recorrencia {
  id: string;
  user_id: string;
  titulo: string;
  tipo: string;
  categoria: string | null;
  subcategoria: string | null;
  pessoa: string | null;
  para_quem: string | null;
  valor_padrao: number;
  dia_vencimento: number;
  data_inicio: string;
  ativo: boolean;
  observacao_padrao: string | null;
  lembrete_7_dias: boolean;
  lembrete_3_dias: boolean;
  lembrete_1_dia: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecorrenciaInsert {
  titulo: string;
  tipo: string;
  categoria?: string | null;
  subcategoria?: string | null;
  pessoa?: string | null;
  para_quem?: string | null;
  valor_padrao: number;
  dia_vencimento: number;
  data_inicio: string;
  ativo?: boolean;
  observacao_padrao?: string | null;
  lembrete_7_dias?: boolean;
  lembrete_3_dias?: boolean;
  lembrete_1_dia?: boolean;
}

// Helper function to calculate due date considering month end
function calculateDueDate(year: number, month: number, dayOfMonth: number): Date {
  const date = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(date).getDate();
  const actualDay = Math.min(dayOfMonth, lastDayOfMonth);
  return setDate(date, actualDay);
}

export function useRecorrencias() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recorrencias", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("recorrencias")
        .select("*")
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as Recorrencia[];
    },
    enabled: !!user,
  });
}

export function useRecorrenciasMutations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRecorrencia = useMutation({
    mutationFn: async (recorrencia: RecorrenciaInsert) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Create the recorrencia
      const { data: newRecorrencia, error: recError } = await supabase
        .from("recorrencias")
        .insert({
          ...recorrencia,
          user_id: user.id,
        })
        .select()
        .single();

      if (recError) throw recError;

      // 2. Generate scheduled bills for the next 12 months
      const startDate = new Date(recorrencia.data_inicio);
      const scheduledBills = [];

      for (let i = 0; i < 12; i++) {
        const targetDate = addMonths(startDate, i);
        const dueDate = calculateDueDate(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          recorrencia.dia_vencimento
        );

        // Only create if due date is >= start date
        if (dueDate >= startDate) {
          scheduledBills.push({
            user_id: user.id,
            recorrencia_id: newRecorrencia.id,
            competencia: format(dueDate, "yyyy-MM"),
            data_vencimento: format(dueDate, "yyyy-MM-dd"),
            valor: recorrencia.valor_padrao,
            status: "pendente",
            observacao: recorrencia.observacao_padrao || null,
          });
        }
      }

      if (scheduledBills.length > 0) {
        const { error: billsError } = await supabase
          .from("contas_agendadas")
          .insert(scheduledBills);

        if (billsError) throw billsError;
      }

      return newRecorrencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorrencias"] });
      queryClient.invalidateQueries({ queryKey: ["contas_agendadas"] });
      toast({
        title: "Recorrência criada",
        description: "Contas agendadas geradas para os próximos 12 meses.",
      });
    },
    onError: (error) => {
      console.error("Error creating recorrencia:", error);
      toast({
        title: "Erro ao criar recorrência",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateRecorrencia = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecorrenciaInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from("recorrencias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorrencias"] });
      toast({
        title: "Recorrência atualizada",
      });
    },
    onError: (error) => {
      console.error("Error updating recorrencia:", error);
      toast({
        title: "Erro ao atualizar recorrência",
        variant: "destructive",
      });
    },
  });

  const deleteRecorrencia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recorrencias")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorrencias"] });
      queryClient.invalidateQueries({ queryKey: ["contas_agendadas"] });
      toast({
        title: "Recorrência excluída",
        description: "Todas as contas pendentes também foram removidas.",
      });
    },
    onError: (error) => {
      console.error("Error deleting recorrencia:", error);
      toast({
        title: "Erro ao excluir recorrência",
        variant: "destructive",
      });
    },
  });

  const toggleRecorrencia = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("recorrencias")
        .update({ ativo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recorrencias"] });
      toast({
        title: data.ativo ? "Recorrência ativada" : "Recorrência pausada",
      });
    },
    onError: (error) => {
      console.error("Error toggling recorrencia:", error);
      toast({
        title: "Erro ao atualizar recorrência",
        variant: "destructive",
      });
    },
  });

  return {
    createRecorrencia,
    updateRecorrencia,
    deleteRecorrencia,
    toggleRecorrencia,
  };
}
