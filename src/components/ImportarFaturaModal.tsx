import { useState, useRef, useEffect } from "react";
// Navigation handled via window.location for guaranteed redirect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useImportarFatura, TransacaoExtraida } from "@/hooks/useImportarFatura";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCategories } from "@/hooks/useCategories";
import { usePersonNames } from "@/hooks/useUserSettings";
import { formatCentsToDisplay } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImportarFaturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportarFaturaModal({ open, onOpenChange }: ImportarFaturaModalProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<string>("person1");
  const [isCouple, setIsCouple] = useState(true);
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [fallbackYear, setFallbackYear] = useState<string>(new Date().getFullYear().toString());
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
  const { data: expenseCategories = [] } = useCategories("expense");
  const { data: incomeCategories = [] } = useCategories("income");
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


  const handleImport = async () => {
    if (!faturaData) return;
    
    // Check if any transaction is selected
    const hasSelected = faturaData.transacoes.some(t => t.selected);
    if (!hasSelected) {
      return; // Hook will show toast
    }
    
    // Capture data before any state changes
    const firstSelected = faturaData.transacoes.find(t => t.selected);
    let targetMonth: number;
    let targetYear: string;
    
    if (firstSelected) {
      const [, month, year] = firstSelected.data.split('/');
      targetMonth = parseInt(month, 10);
      targetYear = year;
    } else {
      const now = new Date();
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear().toString();
    }
    
    const count = await importarTransacoes(faturaData.transacoes, {
      paidBy,
      isCouple,
      bankId: bankId || undefined,
      paymentMethodId: paymentMethodId || undefined,
      person1Name: person1,
      person2Name: person2,
      fallbackYear: faturaData.hasInvalidYears ? fallbackYear : undefined,
    });
    
    if (count > 0) {
      // Build URL first
      const targetUrl = `/lancamentos?month=${targetMonth}&year=${targetYear}`;
      
      // Reset internal state
      setSelectedFiles([]);
      
      // Close modal first
      onOpenChange(false);
      
      // Wait for drawer/dialog animation to complete before navigating
      setTimeout(() => {
        resetFatura();
        // Navigate using window.location for guaranteed navigation
        window.location.href = targetUrl;
      }, 400);
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

  // Mobile transaction card component
  const TransactionCard = ({ transacao, index }: { transacao: TransacaoExtraida; index: number }) => {
    const isIncome = transacao.tipo === "receita";
    const categoriesToShow = isIncome ? incomeCategories : expenseCategories;
    
    return (
      <div 
        className={cn(
          "p-3 border rounded-lg space-y-3 bg-card",
          !transacao.selected && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              checked={transacao.selected}
              onCheckedChange={() => toggleTransacao(index)}
            />
            <div className="flex-1 min-w-0">
              <Input
                value={transacao.descricao}
                onChange={(e) => updateTransacao(index, { descricao: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={cn("font-mono text-sm font-medium", isIncome && "text-green-600")}>
              {isIncome && "+ "}{formatCentsToDisplay(transacao.valor * 100)}
            </span>
            {transacao.parcela_atual && transacao.parcela_total && (
              <span className="text-[10px] text-muted-foreground">
                × {transacao.parcela_total} = {formatCentsToDisplay(transacao.valor * transacao.parcela_total * 100)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">{transacao.data}</span>
          {isIncome && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
              Receita
            </Badge>
          )}
          {transacao.parcela_atual && transacao.parcela_total && (
            <Badge variant="outline" className="text-xs">
              {transacao.parcela_atual}/{transacao.parcela_total}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={transacao.categoria_sugerida || ""}
            onValueChange={(value) => updateTransacao(index, { categoria_sugerida: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriesToShow.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={transacao.for_who || "couple"}
            onValueChange={(value) => updateTransacao(index, { for_who: value as "couple" | "person1" | "person2" })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="couple">Casal</SelectItem>
              <SelectItem value="person1">{person1}</SelectItem>
              <SelectItem value="person2">{person2}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Content for both dialog and drawer
  const ModalContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="flex flex-col gap-4 px-1 pb-4">
          {/* Upload Section */}
          {!faturaData && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors",
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
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
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
                              className="h-16 w-16 sm:h-24 sm:w-24 object-cover rounded-lg border bg-background"
                            />
                          ) : (
                            <div className="h-16 w-16 sm:h-24 sm:w-24 flex flex-col items-center justify-center rounded-lg border bg-background">
                              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                              <span className="text-[10px] text-muted-foreground mt-1">PDF</span>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate max-w-[64px] sm:max-w-[96px] mt-1 text-center">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    {canAddMore && (
                      <p className="text-xs text-muted-foreground">
                        Toque para adicionar ({selectedFiles.length}/10)
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-2 sm:mb-3" />
                    <p className="font-medium text-sm sm:text-base">Toque para selecionar</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      JPEG, PNG ou PDF
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-xs sm:text-sm">{error}</span>
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
                    <span className="text-sm">Analisando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="text-sm">Analisar Fatura</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results Section */}
          {faturaData && (
            <>
              {/* Fatura Info */}
              <div className="flex flex-col gap-1.5 p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cartão:</span>
                  <span className="font-medium text-xs sm:text-sm">{faturaData.banco_cartao}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Período:</span>
                  <span className="font-medium text-xs sm:text-sm">{faturaData.periodo_fatura}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="font-medium text-xs sm:text-sm">{formatCentsToDisplay(faturaData.valor_total * 100)}</span>
                </div>
                <Badge variant="secondary" className="w-fit mt-1">
                  {faturaData.transacoes.length} transações
                </Badge>
              </div>

              {/* Year Selection Alert - shown when invalid years detected */}
              {faturaData.hasInvalidYears && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Ano não detectado</p>
                      <p className="text-xs text-muted-foreground">
                        O ano de algumas transações não foi identificado. Selecione o ano correto:
                      </p>
                    </div>
                    <Select value={fallbackYear} onValueChange={setFallbackYear}>
                      <SelectTrigger className="h-8 w-32 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Pago por</Label>
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger className="h-8 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person1">{person1}</SelectItem>
                        <SelectItem value="person2">{person2}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Banco</Label>
                    <Select value={bankId} onValueChange={setBankId}>
                      <SelectTrigger className="h-8 text-xs sm:text-sm">
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
                  <div className="space-y-1">
                    <Label className="text-xs">Forma pagamento</Label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger className="h-8 text-xs sm:text-sm">
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
                  <div className="space-y-1">
                    <Label className="text-xs">&nbsp;</Label>
                    <label className="flex items-center gap-2 cursor-pointer h-8 px-2 rounded-md border border-input bg-background">
                      <Checkbox
                        checked={isCouple}
                        onCheckedChange={(checked) => setIsCouple(checked as boolean)}
                      />
                      <span className="text-xs sm:text-sm">Do casal</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Selection summary */}
              <div className="flex items-center justify-between gap-2 py-2 border-y">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === faturaData.transacoes.length}
                    onCheckedChange={(checked) => toggleAll(checked as boolean)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedCount}/{faturaData.transacoes.length}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  Total: {formatCentsToDisplay(totalValue * 100)}
                </span>
              </div>

              {/* Transactions - Mobile Cards or Desktop Table */}
              {isMobile ? (
                <div className="space-y-2">
                  {faturaData.transacoes.map((transacao, index) => (
                    <TransactionCard key={index} transacao={transacao} index={index} />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden relative">
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
                  
                  <div 
                    ref={tableScrollRef}
                    className="overflow-x-auto max-h-[40vh] overflow-y-auto"
                    onScroll={updateScrollIndicators}
                  >
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 sticky left-0 top-0 bg-background z-10"></TableHead>
                          <TableHead className="w-24 whitespace-nowrap sticky top-0 bg-background">Data</TableHead>
                          <TableHead className="min-w-[140px] sticky top-0 bg-background">Descrição</TableHead>
                          <TableHead className="w-28 whitespace-nowrap sticky top-0 bg-background">Categoria</TableHead>
                          <TableHead className="w-24 whitespace-nowrap sticky top-0 bg-background">Para quem</TableHead>
                          <TableHead className="w-20 text-right whitespace-nowrap sticky top-0 bg-background">Valor</TableHead>
                          <TableHead className="w-20 whitespace-nowrap sticky top-0 bg-background">Parcela</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faturaData.transacoes.map((transacao, index) => {
                          const isIncome = transacao.tipo === "receita";
                          const categoriesToShow = isIncome ? incomeCategories : expenseCategories;
                          
                          return (
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
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={transacao.descricao}
                                    onChange={(e) => updateTransacao(index, { descricao: e.target.value })}
                                    className="h-7 text-sm min-w-[120px]"
                                  />
                                  {isIncome && (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                                      Receita
                                    </Badge>
                                  )}
                                </div>
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
                                    {categoriesToShow.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.name}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={transacao.for_who || "couple"}
                                  onValueChange={(value) => updateTransacao(index, { for_who: value as "couple" | "person1" | "person2" })}
                                >
                                  <SelectTrigger className="h-7 text-xs min-w-[85px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="couple">Casal</SelectItem>
                                    <SelectItem value="person1">{person1}</SelectItem>
                                    <SelectItem value="person2">{person2}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {transacao.parcela_atual && transacao.parcela_total ? (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className={cn("font-mono text-sm", isIncome && "text-green-600")}>
                                      {isIncome && "+ "}{formatCentsToDisplay(transacao.valor * 100)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      × {transacao.parcela_total} = {formatCentsToDisplay(transacao.valor * transacao.parcela_total * 100)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={cn("font-mono text-sm", isIncome && "text-green-600")}>
                                    {isIncome && "+ "}{formatCentsToDisplay(transacao.valor * 100)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {transacao.parcela_atual && transacao.parcela_total && (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {transacao.parcela_atual}/{transacao.parcela_total}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions - Fixed at bottom */}
      {faturaData && (
        <div className="flex gap-2 sm:gap-3 pt-3 border-t mt-auto shrink-0 sticky bottom-0 bg-background">
          <Button variant="outline" onClick={handleClose} className="flex-1 h-10">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedCount === 0 || isImporting}
            className="flex-1 h-10"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm">Importando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="text-sm">Importar ({selectedCount})</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Importar Fatura
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto overscroll-contain">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Importar Fatura de Cartão
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ModalContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}