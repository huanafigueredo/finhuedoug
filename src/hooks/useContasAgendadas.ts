import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Recorrencia } from "./useRecorrencias";

export interface ContaAgendada {
  id: string;
  user_id: string;
  recorrencia_id: string;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status: "pendente" | "confirmado" | "ignorado";
  confirmado_em: string | null;
  lancamento_id: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  recorrencia?: Recorrencia;
}

export function useContasAgendadas(statusFilter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["contas_agendadas", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("contas_agendadas")
        .select(`
          *,
          recorrencia:recorrencias(*)
        `)
        .order("data_vencimento", { ascending: true });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ContaAgendada[];
    },
    enabled: !!user,
  });
}

export function useContasAVencer() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["contas_a_vencer", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("contas_agendadas")
        .select(`
          *,
          recorrencia:recorrencias(*)
        `)
        .eq("status", "pendente")
        .lte("data_vencimento", sevenDaysFromNow.toISOString().split("T")[0])
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      return data as ContaAgendada[];
    },
    enabled: !!user,
  });
}

export function useContasAgendadasMutations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmarPagamento = useMutation({
    mutationFn: async ({
      contaId,
      dataPagamento,
      valor,
      observacao,
    }: {
      contaId: string;
      dataPagamento: string;
      valor: number;
      observacao?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Get the conta agendada with recorrencia details
      const { data: conta, error: contaError } = await supabase
        .from("contas_agendadas")
        .select(`
          *,
          recorrencia:recorrencias(*)
        `)
        .eq("id", contaId)
        .single();

      if (contaError) throw contaError;
      if (!conta) throw new Error("Conta não encontrada");

      const recorrencia = conta.recorrencia as Recorrencia;

      // 2. Create the transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          description: recorrencia.titulo,
          date: dataPagamento,
          type: recorrencia.tipo,
          total_value: valor,
          category: recorrencia.categoria,
          subcategory: recorrencia.subcategoria,
          paid_by: recorrencia.pessoa,
          for_who: recorrencia.para_quem,
          is_couple: recorrencia.pessoa === "casal",
          value_per_person: recorrencia.pessoa === "casal" ? valor / 2 : valor,
          observacao: observacao || recorrencia.observacao_padrao,
          origem: "recorrente",
          conta_agendada_id: contaId,
        })
        .select()
        .single();

      if (txError) throw txError;

      // 3. Update the conta agendada
      const { error: updateError } = await supabase
        .from("contas_agendadas")
        .update({
          status: "confirmado",
          confirmado_em: new Date().toISOString(),
          lancamento_id: transaction.id,
          valor,
          observacao,
        })
        .eq("id", contaId);

      if (updateError) throw updateError;

      return { conta, transaction };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_agendadas"] });
      queryClient.invalidateQueries({ queryKey: ["contas_a_vencer"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Pagamento confirmado",
        description: "Lançamento criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error confirming payment:", error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const ignorarConta = useMutation({
    mutationFn: async (contaId: string) => {
      const { error } = await supabase
        .from("contas_agendadas")
        .update({ status: "ignorado" })
        .eq("id", contaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_agendadas"] });
      queryClient.invalidateQueries({ queryKey: ["contas_a_vencer"] });
      toast({
        title: "Conta ignorada",
        description: "Esta conta não será cobrada este mês.",
      });
    },
    onError: (error) => {
      console.error("Error ignoring conta:", error);
      toast({
        title: "Erro ao ignorar conta",
        variant: "destructive",
      });
    },
  });

  const updateValor = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: number }) => {
      const { data, error } = await supabase
        .from("contas_agendadas")
        .update({ valor })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_agendadas"] });
      queryClient.invalidateQueries({ queryKey: ["contas_a_vencer"] });
      toast({
        title: "Valor atualizado",
      });
    },
    onError: (error) => {
      console.error("Error updating valor:", error);
      toast({
        title: "Erro ao atualizar valor",
        variant: "destructive",
      });
    },
  });

  return {
    confirmarPagamento,
    ignorarConta,
    updateValor,
  };
}
