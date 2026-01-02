import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  CreditCard, 
  Loader2, 
  FileText, 
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useImportarFatura, TransacaoExtraida } from "@/hooks/useImportarFatura";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCategories } from "@/hooks/useCategories";
import { usePersonNames } from "@/hooks/useUserSettings";
import { formatCentsToDisplay } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ImportarFaturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportarFaturaModal({ open, onOpenChange }: ImportarFaturaModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<string>("person1");
  const [isCouple, setIsCouple] = useState(true);
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position for fade indicators
  const updateScrollIndicators = () => {
    if (tableScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableScrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Generate image previews
  useEffect(() => {
    const urls: string[] = [];
    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        urls.push(URL.createObjectURL(file));
      } else {
        urls.push(''); // Empty for non-image files like PDF
      }
    });
    setPreviews(urls);

    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [selectedFiles]);

  const { 
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
    isImporting 
  } = useImportarFatura();

  // Effect for scroll indicators - after faturaData is defined
  useEffect(() => {
    const scrollEl = tableScrollRef.current;
    if (scrollEl && faturaData) {
      // Small delay to ensure table is rendered
      const timer = setTimeout(() => {
        updateScrollIndicators();
      }, 100);
      scrollEl.addEventListener('scroll', updateScrollIndicators);
      window.addEventListener('resize', updateScrollIndicators);
      return () => {
        clearTimeout(timer);
        scrollEl.removeEventListener('scroll', updateScrollIndicators);
        window.removeEventListener('resize', updateScrollIndicators);
      };
    }
  }, [faturaData]);

  const { data: banks = [] } = useBanks();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: categories = [] } = useCategories();
  const { person1, person2 } = usePersonNames();

  const isImageFile = (file: File) => {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  };

  const isPdfFile = (file: File) => {
    return file.type === 'application/pdf';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const firstFile = fileArray[0];
    
    // If first file is PDF, only accept that one file
    if (isPdfFile(firstFile)) {
      setSelectedFiles([firstFile]);
      resetFatura();
      return;
    }
    
    // For images, accept up to 10
    const imageFiles = fileArray.filter(isImageFile).slice(0, 10);
    if (imageFiles.length > 0) {
      setSelectedFiles(imageFiles);
      resetFatura();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    
    // If PDF or single image, use single file analysis
    if (selectedFiles.length === 1) {
      await analisarFatura(selectedFiles[0]);
    } else {
      // Multiple images
      await analisarMultiplasImagens(selectedFiles);
    }
  };

  const [, setSearchParams] = useSearchParams();

  const handleImport = async () => {
    if (faturaData) {
      const count = await importarTransacoes(faturaData.transacoes, {
        paidBy,
        isCouple,
        bankId: bankId || undefined,
        paymentMethodId: paymentMethodId || undefined,
      });
      if (count > 0) {
        // Get the first selected transaction's date to update filters
        const firstSelected = faturaData.transacoes.find(t => t.selected);
        if (firstSelected) {
          const [day, month, year] = firstSelected.data.split('/');
          // Update URL params to show the imported transactions' period
          setSearchParams({
            month: String(parseInt(month, 10)),
            year: year
          });
        }
        onOpenChange(false);
        setSelectedFiles([]);
        resetFatura();
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedFiles([]);
    resetFatura();
  };

  const selectedCount = faturaData?.transacoes.filter(t => t.selected).length || 0;
  const totalValue = faturaData?.transacoes
    .filter(t => t.selected)
    .reduce((sum, t) => sum + t.valor, 0) || 0;
  
  const hasImages = selectedFiles.length > 0 && selectedFiles.every(isImageFile);
  const canAddMore = hasImages && selectedFiles.length < 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Importar Fatura de Cartão
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Upload Section */}
          {!faturaData && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  selectedFiles.length > 0 ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 justify-center">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="relative group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {previews[index] ? (
                            <img 
                              src={previews[index]} 
                              alt={file.name}
                              className="h-24 w-24 object-cover rounded-lg border bg-background"
                            />
                          ) : (
                            <div className="h-24 w-24 flex flex-col items-center justify-center rounded-lg border bg-background">
                              <FileText className="h-8 w-8 text-primary" />
                              <span className="text-xs text-muted-foreground mt-1">PDF</span>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[96px] mt-1 text-center">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    {canAddMore && (
                      <p className="text-xs text-muted-foreground">
                        Clique para adicionar mais imagens ({selectedFiles.length}/10)
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPEG, PNG (até 10 imagens) ou PDF (máx. 10MB)
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={selectedFiles.length === 0 || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando {selectedFiles.length > 1 ? `${selectedFiles.length} imagens` : ''} com IA...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Analisar Fatura
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results Section */}
          {faturaData && (
            <>
              {/* Fatura Info */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between sm:justify-start">
                  <span className="text-xs sm:text-sm text-muted-foreground">Cartão:</span>
                  <span className="ml-2 font-medium text-sm">{faturaData.banco_cartao}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start">
                  <span className="text-xs sm:text-sm text-muted-foreground">Período:</span>
                  <span className="ml-2 font-medium text-sm">{faturaData.periodo_fatura}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium text-sm">{formatCentsToDisplay(faturaData.valor_total * 100)}</span>
                </div>
                <Badge variant="secondary" className="w-fit sm:ml-auto">
                  {faturaData.transacoes.length} transações
                </Badge>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pago por</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person1">{person1}</SelectItem>
                      <SelectItem value="person2">{person2}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Banco</Label>
                  <Select value={bankId} onValueChange={setBankId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Forma de pagamento</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1 col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isCouple}
                      onCheckedChange={(checked) => setIsCouple(checked as boolean)}
                    />
                    <span className="text-sm">Despesa do casal</span>
                  </label>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === faturaData.transacoes.length}
                    onCheckedChange={(checked) => toggleAll(checked as boolean)}
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {selectedCount} de {faturaData.transacoes.length} selecionadas
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  Total selecionado: {formatCentsToDisplay(totalValue * 100)}
                </span>
              </div>

              {/* Scrollable Table Container with Fade Indicators */}
              <div className="flex-1 border rounded-lg overflow-hidden relative">
                {/* Left fade indicator */}
                <div 
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none transition-opacity duration-200",
                    canScrollLeft ? "opacity-100" : "opacity-0"
                  )}
                />
                {/* Right fade indicator */}
                <div 
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none transition-opacity duration-200",
                    canScrollRight ? "opacity-100" : "opacity-0"
                  )}
                />
                
                <ScrollArea className="h-full">
                  <div 
                    ref={tableScrollRef}
                    className="overflow-x-auto"
                    onScroll={updateScrollIndicators}
                  >
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 sticky left-0 bg-background z-10"></TableHead>
                          <TableHead className="w-24 whitespace-nowrap">Data</TableHead>
                          <TableHead className="min-w-[140px]">Descrição</TableHead>
                          <TableHead className="w-28 whitespace-nowrap">Categoria</TableHead>
                          <TableHead className="w-20 text-right whitespace-nowrap">Valor</TableHead>
                          <TableHead className="w-20 whitespace-nowrap">Parcela</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faturaData.transacoes.map((transacao, index) => (
                          <TableRow 
                            key={index}
                            className={cn(!transacao.selected && "opacity-50")}
                          >
                            <TableCell className="sticky left-0 bg-background z-10">
                              <Checkbox
                                checked={transacao.selected}
                                onCheckedChange={() => toggleTransacao(index)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {transacao.data}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={transacao.descricao}
                                onChange={(e) => updateTransacao(index, { descricao: e.target.value })}
                                className="h-7 text-sm min-w-[120px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transacao.categoria_sugerida || ""}
                                onValueChange={(value) => updateTransacao(index, { categoria_sugerida: value })}
                              >
                                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                              {formatCentsToDisplay(transacao.valor * 100)}
                            </TableCell>
                            <TableCell>
                              {transacao.parcela_atual && transacao.parcela_total && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {transacao.parcela_atual}/{transacao.parcela_total}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Importar {selectedCount} transações
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
