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
  selected?: boolean;
}

export interface FaturaExtraida {
  banco_cartao: string;
  periodo_fatura: string;
  valor_total: number;
  transacoes: TransacaoExtraida[];
}

export function useImportarFatura() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        throw new Error(response.error.message || 'Erro ao analisar fatura');
      }

      const data = response.data as FaturaExtraida;
      
      // Mark all transactions as selected by default
      data.transacoes = data.transacoes.map(t => ({ ...t, selected: true }));
      
      setFaturaData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar fatura';
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
        throw new Error(response.error.message || 'Erro ao analisar imagens');
      }

      const data = response.data as FaturaExtraida;
      
      // Mark all transactions as selected by default
      data.transacoes = data.transacoes.map(t => ({ ...t, selected: true }));
      
      setFaturaData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar imagens';
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
    }
  ): Promise<number> => {
    const transacoesParaImportar = transacoes.filter(t => t.selected);
    let importadas = 0;

    for (const transacao of transacoesParaImportar) {
      try {
        // Parse date from dd/mm/yyyy to yyyy-mm-dd
        const [day, month, year] = transacao.data.split('/');
        const dateISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const transactionData: TransactionInsert = {
          date: dateISO,
          description: transacao.descricao,
          type: "expense",
          total_value: Math.round(transacao.valor * 100), // Convert to cents
          is_couple: opcoes.isCouple,
          paid_by: opcoes.paidBy,
          bank_id: opcoes.bankId,
          payment_method_id: opcoes.paymentMethodId,
          category: transacao.categoria_sugerida,
          is_installment: !!(transacao.parcela_atual && transacao.parcela_total),
          installment_number: transacao.parcela_atual,
          total_installments: transacao.parcela_total,
          installment_value: transacao.parcela_atual && transacao.parcela_total 
            ? Math.round(transacao.valor * 100) 
            : undefined,
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
    faturaData,
    error,
    analisarFatura,
    analisarMultiplasImagens,
    importarTransacoes,
    resetFatura,
    toggleTransacao,
    toggleAll,
    updateTransacao,
    isImporting: createTransaction.isPending,
  };
}
