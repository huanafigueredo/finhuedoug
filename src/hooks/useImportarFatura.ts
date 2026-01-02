import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateTransaction, TransactionInsert } from "./useTransactions";
import { useToast } from "./use-toast";

export interface TransacaoExtraida {
  data: string;
  descricao: string;
  valor: number;
  categoria_sugerida?: string;
  parcela_atual?: number;
  parcela_total?: number;
  tipo?: "despesa" | "receita";
  selected?: boolean;
  for_who?: "couple" | "person1" | "person2";
}

export interface FaturaExtraida {
  banco_cartao: string;
  periodo_fatura: string;
  valor_total: number;
  transacoes: TransacaoExtraida[];
}

export function useImportarFatura() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [faturaData, setFaturaData] = useState<FaturaExtraida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createTransaction = useCreateTransaction();
  const { toast } = useToast();

  const analisarFatura = async (file: File): Promise<FaturaExtraida | null> => {
    setIsAnalyzing(true);
    setError(null);
    setFaturaData(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const response = await supabase.functions.invoke('extrair-fatura-cartao', {
        body: {
          fileBase64: base64,
          fileType: file.type,
        },
      });

      if (response.error) {
        console.error('Erro na resposta da Edge Function:', response.error);
        // Verificar se é erro de rede/conexão
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('FunctionsRelayError') || errorMessage.includes('Failed to send')) {
          throw new Error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
        }
        throw new Error(response.error.message || 'Erro ao analisar fatura');
      }

      const data = response.data as FaturaExtraida;
      
      if (!data || !data.transacoes) {
        throw new Error('Resposta inválida do servidor. Tente novamente.');
      }
      
      // Mark all transactions as selected by default with for_who = couple
      data.transacoes = data.transacoes.map(t => ({ ...t, selected: true, for_who: "couple" as const }));
      
      setFaturaData(data);
      return data;
    } catch (err) {
      console.error('Erro ao analisar fatura:', err);
      let message = 'Erro ao analisar fatura. Tente novamente.';
      
      if (err instanceof Error) {
        if (err.message.includes('FunctionsRelayError') || err.message.includes('Failed to send')) {
          message = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('network') || err.message.includes('Network')) {
          message = 'Problema de rede. Verifique sua conexão e tente novamente.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: "Erro na análise",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analisarMultiplasImagens = async (files: File[]): Promise<FaturaExtraida | null> => {
    setIsAnalyzing(true);
    setError(null);
    setFaturaData(null);

    try {
      // Convert all files to base64
      const imagesBase64 = await Promise.all(
        files.map(async (file) => ({
          base64: await fileToBase64(file),
          type: file.type,
        }))
      );

      const response = await supabase.functions.invoke('extrair-fatura-cartao', {
        body: {
          images: imagesBase64,
          isMultipleImages: true,
        },
      });

      if (response.error) {
        console.error('Erro na resposta da Edge Function:', response.error);
        const errorMessage = response.error.message || '';
        if (errorMessage.includes('FunctionsRelayError') || errorMessage.includes('Failed to send')) {
          throw new Error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
        }
        throw new Error(response.error.message || 'Erro ao analisar imagens');
      }

      const data = response.data as FaturaExtraida;
      
      if (!data || !data.transacoes) {
        throw new Error('Resposta inválida do servidor. Tente novamente.');
      }
      
      // Mark all transactions as selected by default with for_who = couple
      data.transacoes = data.transacoes.map(t => ({ ...t, selected: true, for_who: "couple" as const }));
      
      setFaturaData(data);
      return data;
    } catch (err) {
      console.error('Erro ao analisar imagens:', err);
      let message = 'Erro ao analisar imagens. Tente novamente.';
      
      if (err instanceof Error) {
        if (err.message.includes('FunctionsRelayError') || err.message.includes('Failed to send')) {
          message = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('network') || err.message.includes('Network')) {
          message = 'Problema de rede. Verifique sua conexão e tente novamente.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      toast({
        title: "Erro na análise",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const importarTransacoes = async (
    transacoes: TransacaoExtraida[],
    opcoes: {
      paidBy: string;
      isCouple: boolean;
      bankId?: string;
      paymentMethodId?: string;
      person1Name: string;
      person2Name: string;
    }
  ): Promise<number> => {
    const transacoesParaImportar = transacoes.filter(t => t.selected);
    
    if (transacoesParaImportar.length === 0) {
      toast({
        title: "Nenhuma transação selecionada",
        description: "Selecione ao menos uma transação para importar.",
        variant: "destructive",
      });
      return 0;
    }
    
    setIsImporting(true);
    let importadas = 0;

    try {
      for (const transacao of transacoesParaImportar) {
        try {
          // Parse date from dd/mm/yyyy to yyyy-mm-dd
          const [day, month, year] = transacao.data.split('/');
          const dateISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          // Determine split based on for_who
          const forWho = transacao.for_who || "couple";
          let is_couple = opcoes.isCouple;
          let custom_person1_percentage: number | undefined;
          let custom_person2_percentage: number | undefined;
          let for_who_value: string | undefined;

          if (forWho === "person1") {
            is_couple = false;
            custom_person1_percentage = 100;
            custom_person2_percentage = 0;
            for_who_value = opcoes.person1Name;
          } else if (forWho === "person2") {
            is_couple = false;
            custom_person1_percentage = 0;
            custom_person2_percentage = 100;
            for_who_value = opcoes.person2Name;
          } else {
            // couple - SEMPRE define is_couple como true para despesas do casal
            is_couple = true;
            for_who_value = "Casal";
          }

          // Para compras parceladas, o valor extraído da fatura é o valor da PARCELA
          // Precisamos calcular o valor total multiplicando pelo número de parcelas
          const isInstallment = !!(transacao.parcela_atual && transacao.parcela_total);
          const valorParcela = transacao.valor;
          const valorTotal = isInstallment 
            ? valorParcela * transacao.parcela_total! 
            : valorParcela;

          const transactionData: TransactionInsert = {
            date: dateISO,
            description: transacao.descricao,
            type: transacao.tipo === "receita" ? "income" : "expense",
            total_value: valorTotal, // Valor total da compra (parcela × qtd parcelas para parcelados)
            is_couple,
            paid_by: opcoes.paidBy,
            bank_id: opcoes.bankId,
            payment_method_id: opcoes.paymentMethodId,
            category: transacao.categoria_sugerida,
            is_installment: isInstallment,
            installment_number: transacao.parcela_atual,
            total_installments: transacao.parcela_total,
            installment_value: isInstallment ? valorParcela : undefined, // Valor da parcela mensal
            modo_valor_informado: isInstallment ? 'installment' : 'total',
            custom_person1_percentage,
            custom_person2_percentage,
            for_who: for_who_value,
          };

          await createTransaction.mutateAsync(transactionData);
          importadas++;
        } catch (err) {
          console.error('Erro ao importar transação:', transacao.descricao, err);
        }
      }

      if (importadas > 0) {
        toast({
          title: "Importação concluída",
          description: `${importadas} transações importadas com sucesso.`,
        });
      } else {
        toast({
          title: "Erro na importação",
          description: "Nenhuma transação foi importada. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsImporting(false);
    }

    return importadas;
  };

  const resetFatura = () => {
    setFaturaData(null);
    setError(null);
  };

  const toggleTransacao = (index: number) => {
    if (!faturaData) return;
    
    const newTransacoes = [...faturaData.transacoes];
    newTransacoes[index] = {
      ...newTransacoes[index],
      selected: !newTransacoes[index].selected,
    };
    
    setFaturaData({
      ...faturaData,
      transacoes: newTransacoes,
    });
  };

  const toggleAll = (selected: boolean) => {
    if (!faturaData) return;
    
    setFaturaData({
      ...faturaData,
      transacoes: faturaData.transacoes.map(t => ({ ...t, selected })),
    });
  };

  const updateTransacao = (index: number, updates: Partial<TransacaoExtraida>) => {
    if (!faturaData) return;
    
    const newTransacoes = [...faturaData.transacoes];
    newTransacoes[index] = { ...newTransacoes[index], ...updates };
    
    setFaturaData({
      ...faturaData,
      transacoes: newTransacoes,
    });
  };

  return {
    isAnalyzing,
    isImporting,
    faturaData,
    error,
    analisarFatura,
    analisarMultiplasImagens,
    importarTransacoes,
    resetFatura,
    toggleTransacao,
    toggleAll,
    updateTransacao,
  };
}
