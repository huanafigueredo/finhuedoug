import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  ShoppingCart, 
  Tag,
  X,
  Plus
} from 'lucide-react';
import { 
  useItensLancamento, 
  useComprovantes, 
  useComprovantesMutations,
  extrairItensComIA 
} from '@/hooks/useComprovantes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface ItensCompraCardProps {
  lancamentoId: string;
  tags?: string[];
  resumoCurto?: string;
  statusExtracao?: string;
}

interface ExtractedItem {
  nome: string;
  quantidade?: number;
  valor?: number;
  categoria?: string;
  selected: boolean;
}

interface ReviewModalData {
  itens: ExtractedItem[];
  tags: string[];
  resumoCurto: string;
}

export function ItensCompraCard({ 
  lancamentoId, 
  tags = [], 
  resumoCurto,
  statusExtracao 
}: ItensCompraCardProps) {
  const { data: itens, isLoading: isLoadingItens } = useItensLancamento(lancamentoId);
  const { data: comprovantes } = useComprovantes(lancamentoId);
  const { saveItensExtraidos, updateStatusExtracao } = useComprovantesMutations();
  const { toast } = useToast();
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; data?: ReviewModalData }>({ open: false });
  const [adicionarResumoObs, setAdicionarResumoObs] = useState(false);
  const [newTag, setNewTag] = useState('');

  const hasComprovantes = comprovantes && comprovantes.length > 0;

  const handleExtract = async () => {
    if (!hasComprovantes) {
      toast({
        title: 'Sem comprovantes',
        description: 'Anexe um comprovante antes de extrair os itens.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    await updateStatusExtracao.mutateAsync({ lancamentoId, status: 'processando' });

    try {
      // Get the first image comprovante (prioritize NFC-e QR)
      const qrComprovante = comprovantes.find(c => c.nfe_qr_url);
      const imageComprovante = comprovantes.find(c => 
        c.file_type.startsWith('image/') || c.file_type === 'application/pdf'
      );

      let result;

      if (qrComprovante?.nfe_qr_url) {
        // Use QR URL
        result = await extrairItensComIA('', '', qrComprovante.nfe_qr_url);
      } else if (imageComprovante) {
        // Fetch image and convert to base64
        const response = await fetch(imageComprovante.file_url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        result = await extrairItensComIA(base64, imageComprovante.file_type);
      } else {
        throw new Error('Nenhum comprovante válido encontrado');
      }

      // Open review modal
      setReviewModal({
        open: true,
        data: {
          itens: result.itens.map(item => ({ ...item, selected: true })),
          tags: result.tags_sugeridas,
          resumoCurto: result.resumo_curto,
        }
      });

    } catch (error: any) {
      console.error('Erro na extração:', error);
      await updateStatusExtracao.mutateAsync({ lancamentoId, status: 'falhou' });
      toast({
        title: 'Erro na extração',
        description: error.message || 'Não foi possível extrair os itens.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewModal.data) return;

    const selectedItens = reviewModal.data.itens
      .filter(item => item.selected)
      .map(({ selected, ...item }) => item);

    await saveItensExtraidos.mutateAsync({
      lancamentoId,
      itens: selectedItens,
      tags: reviewModal.data.tags,
      resumoCurto: reviewModal.data.resumoCurto,
      adicionarResumoObservacao: adicionarResumoObs,
    });

    setReviewModal({ open: false });
    setAdicionarResumoObs(false);
  };

  const toggleItemSelection = (index: number) => {
    if (!reviewModal.data) return;
    
    const newItens = [...reviewModal.data.itens];
    newItens[index].selected = !newItens[index].selected;
    setReviewModal({
      ...reviewModal,
      data: { ...reviewModal.data, itens: newItens }
    });
  };

  const updateItemName = (index: number, nome: string) => {
    if (!reviewModal.data) return;
    
    const newItens = [...reviewModal.data.itens];
    newItens[index].nome = nome;
    setReviewModal({
      ...reviewModal,
      data: { ...reviewModal.data, itens: newItens }
    });
  };

  const removeTag = (tagToRemove: string) => {
    if (!reviewModal.data) return;
    
    setReviewModal({
      ...reviewModal,
      data: {
        ...reviewModal.data,
        tags: reviewModal.data.tags.filter(t => t !== tagToRemove)
      }
    });
  };

  const addTag = () => {
    if (!reviewModal.data || !newTag.trim() || reviewModal.data.tags.length >= 5) return;
    
    setReviewModal({
      ...reviewModal,
      data: {
        ...reviewModal.data,
        tags: [...reviewModal.data.tags, newTag.trim().toLowerCase()]
      }
    });
    setNewTag('');
  };

  return (
    <>
      <Card className="p-3 sm:p-4 bg-secondary/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <h4 className="text-xs sm:text-sm font-medium text-foreground">Itens da compra</h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtract}
            disabled={isExtracting || !hasComprovantes}
            className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 w-full sm:w-auto"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Extrair com IA
              </>
            )}
          </Button>
        </div>

        {/* Tags display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
              >
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Items list */}
        {isLoadingItens ? (
          <div className="flex items-center justify-center py-3 sm:py-4">
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
          </div>
        ) : itens && itens.length > 0 ? (
          <div className="space-y-1 sm:space-y-1.5">
            {itens.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between text-[10px] sm:text-xs p-1.5 sm:p-2 rounded bg-background/50"
              >
                <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{item.nome_item}</span>
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0">
                  {item.quantidade && (
                    <span>{item.quantidade}x</span>
                  )}
                  {item.valor && (
                    <span>R$ {item.valor.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 italic text-center py-2">
            {hasComprovantes 
              ? 'Clique em "Extrair com IA" para processar'
              : 'Anexe um comprovante para extrair'
            }
          </p>
        )}

        {/* Resumo curto */}
        {resumoCurto && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
            📝 {resumoCurto}
          </p>
        )}
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={(open) => setReviewModal({ open })}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Revisar itens extraídos
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
            {/* Items list */}
            <div>
              <h5 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Itens ({reviewModal.data?.itens.filter(i => i.selected).length || 0} selecionados)
              </h5>
              <div className="space-y-1.5 sm:space-y-2 max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                {reviewModal.data?.itens.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-secondary/50"
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItemSelection(index)}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <Input
                      value={item.nome}
                      onChange={(e) => updateItemName(index, e.target.value)}
                      className="flex-1 h-7 sm:h-8 text-xs sm:text-sm"
                    />
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {item.quantidade && <span>{item.quantidade}x</span>}
                      {item.valor && <span>R$ {item.valor.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h5 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Tags sugeridas ({reviewModal.data?.tags.length || 0}/5)
              </h5>
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                {reviewModal.data?.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 pr-1 gap-0.5 sm:gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 sm:ml-1 hover:bg-destructive/20 rounded p-0.5"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {(reviewModal.data?.tags.length || 0) < 5 && (
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag..."
                    className="h-7 sm:h-8 text-xs sm:text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    disabled={!newTag.trim()}
                    className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Resumo */}
            <div>
              <h5 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Resumo curto</h5>
              <Input
                value={reviewModal.data?.resumoCurto || ''}
                onChange={(e) => {
                  if (!reviewModal.data) return;
                  setReviewModal({
                    ...reviewModal,
                    data: { ...reviewModal.data, resumoCurto: e.target.value }
                  });
                }}
                className="h-7 sm:h-8 text-xs sm:text-sm"
                maxLength={100}
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {reviewModal.data?.resumoCurto?.length || 0}/100 caracteres
              </p>
            </div>

            {/* Add to observacao */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Checkbox
                id="add-obs"
                checked={adicionarResumoObs}
                onCheckedChange={(checked) => setAdicionarResumoObs(checked as boolean)}
                className="h-4 w-4 sm:h-5 sm:w-5"
              />
              <label htmlFor="add-obs" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
                Adicionar resumo nas observações
              </label>
            </div>
          </div>

          <DialogFooter className="mt-3 sm:mt-4 flex-row gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setReviewModal({ open: false })}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReview}
              disabled={saveItensExtraidos.isPending}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
            >
              {saveItensExtraidos.isPending ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-1.5 sm:mr-2" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
