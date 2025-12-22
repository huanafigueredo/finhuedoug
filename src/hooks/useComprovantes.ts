import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comprovante {
  id: string;
  lancamento_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  nfe_qr_url?: string;
  created_at: string;
}

export interface ItemLancamento {
  id: string;
  lancamento_id: string;
  user_id: string;
  nome_item: string;
  quantidade?: number;
  valor?: number;
  categoria_item?: string;
  confirmado: boolean;
  created_at: string;
}

export function useComprovantes(lancamentoId: string | undefined) {
  return useQuery({
    queryKey: ['comprovantes', lancamentoId],
    queryFn: async () => {
      if (!lancamentoId) return [];
      
      const { data, error } = await supabase
        .from('comprovantes_lancamento')
        .select('*')
        .eq('lancamento_id', lancamentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Comprovante[];
    },
    enabled: !!lancamentoId,
  });
}

export function useItensLancamento(lancamentoId: string | undefined) {
  return useQuery({
    queryKey: ['itens_lancamento', lancamentoId],
    queryFn: async () => {
      if (!lancamentoId) return [];
      
      const { data, error } = await supabase
        .from('itens_lancamento')
        .select('*')
        .eq('lancamento_id', lancamentoId)
        .eq('confirmado', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ItemLancamento[];
    },
    enabled: !!lancamentoId,
  });
}

export function useComprovantesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadComprovante = useMutation({
    mutationFn: async ({ 
      lancamentoId, 
      file, 
      nfeQrUrl 
    }: { 
      lancamentoId: string; 
      file: File; 
      nfeQrUrl?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check for duplicates by name and size
      const { data: existingFiles } = await supabase
        .from('comprovantes_lancamento')
        .select('file_name, file_size, nfe_qr_url')
        .eq('lancamento_id', lancamentoId);

      if (existingFiles) {
        const isDuplicate = existingFiles.some(
          existing => existing.file_name === file.name && existing.file_size === file.size
        );
        if (isDuplicate) {
          throw new Error('DUPLICATE_FILE');
        }

        if (nfeQrUrl) {
          const isDuplicateQr = existingFiles.some(
            existing => existing.nfe_qr_url === nfeQrUrl
          );
          if (isDuplicateQr) {
            throw new Error('DUPLICATE_QR');
          }
        }
      }

      // Upload file to storage
      const filePath = `${user.id}/${lancamentoId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL (private bucket)
      const { data: signedUrlData } = await supabase.storage
        .from('comprovantes')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const fileUrl = signedUrlData?.signedUrl || filePath;

      // Save metadata
      const { data, error } = await supabase
        .from('comprovantes_lancamento')
        .insert({
          lancamento_id: lancamentoId,
          user_id: user.id,
          file_url: fileUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          nfe_qr_url: nfeQrUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comprovantes', variables.lancamentoId] });
      toast({
        title: 'Comprovante anexado',
        description: 'O comprovante foi salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      if (error.message === 'DUPLICATE_FILE') {
        toast({
          title: 'Arquivo duplicado',
          description: 'Este arquivo já foi anexado ao lançamento.',
          variant: 'destructive',
        });
      } else if (error.message === 'DUPLICATE_QR') {
        toast({
          title: 'QR Code duplicado',
          description: 'Esta nota fiscal já foi anexada ao lançamento.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao anexar',
          description: 'Não foi possível anexar o comprovante.',
          variant: 'destructive',
        });
      }
    },
  });

  const deleteComprovante = useMutation({
    mutationFn: async ({ id, lancamentoId }: { id: string; lancamentoId: string }) => {
      const { error } = await supabase
        .from('comprovantes_lancamento')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comprovantes', variables.lancamentoId] });
      toast({
        title: 'Comprovante removido',
        description: 'O comprovante foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o comprovante.',
        variant: 'destructive',
      });
    },
  });

  const saveItensExtraidos = useMutation({
    mutationFn: async ({ 
      lancamentoId, 
      itens, 
      tags,
      resumoCurto,
      adicionarResumoObservacao
    }: { 
      lancamentoId: string;
      itens: Array<{ nome: string; quantidade?: number; valor?: number; categoria?: string }>;
      tags: string[];
      resumoCurto: string;
      adicionarResumoObservacao: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Delete existing items for this lancamento
      await supabase
        .from('itens_lancamento')
        .delete()
        .eq('lancamento_id', lancamentoId);

      // Insert new items
      if (itens.length > 0) {
        const { error: itensError } = await supabase
          .from('itens_lancamento')
          .insert(
            itens.map(item => ({
              lancamento_id: lancamentoId,
              user_id: user.id,
              nome_item: item.nome,
              quantidade: item.quantidade,
              valor: item.valor,
              categoria_item: item.categoria,
              confirmado: true,
            }))
          );

        if (itensError) throw itensError;
      }

      // Update transaction with tags and resumo
      const updateData: any = {
        tags,
        resumo_curto: resumoCurto,
        status_extracao: 'concluido',
      };

      if (adicionarResumoObservacao) {
        // Get current observacao and append resumo
        const { data: currentTransaction } = await supabase
          .from('transactions')
          .select('observacao')
          .eq('id', lancamentoId)
          .single();

        const currentObs = currentTransaction?.observacao || '';
        const newObs = currentObs 
          ? `${currentObs}\n\n📝 Resumo: ${resumoCurto}`
          : `📝 Resumo: ${resumoCurto}`;
        updateData.observacao = newObs;
      }

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', lancamentoId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens_lancamento', variables.lancamentoId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Itens salvos',
        description: 'Os itens extraídos foram salvos com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os itens extraídos.',
        variant: 'destructive',
      });
    },
  });

  const updateStatusExtracao = useMutation({
    mutationFn: async ({ lancamentoId, status }: { lancamentoId: string; status: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ status_extracao: status })
        .eq('id', lancamentoId);

      if (error) throw error;
    },
  });

  return {
    uploadComprovante,
    deleteComprovante,
    saveItensExtraidos,
    updateStatusExtracao,
  };
}

export async function extrairItensComIA(imageBase64: string, fileType: string, nfeQrUrl?: string) {
  const { data, error } = await supabase.functions.invoke('extrair-itens-comprovante', {
    body: { imageBase64, fileType, nfeQrUrl },
  });

  if (error) throw error;
  return data as {
    itens: Array<{ nome: string; quantidade?: number; valor?: number; categoria?: string }>;
    tags_sugeridas: string[];
    resumo_curto: string;
  };
}
