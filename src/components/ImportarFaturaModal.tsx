import { useState, useRef } from "react";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [paidBy, setPaidBy] = useState<string>("person1");
  const [isCouple, setIsCouple] = useState(true);
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");

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

  const handleImport = async () => {
    if (faturaData) {
      const count = await importarTransacoes(faturaData.transacoes, {
        paidBy,
        isCouple,
        bankId: bankId || undefined,
        paymentMethodId: paymentMethodId || undefined,
      });
      if (count > 0) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
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
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm truncate max-w-[150px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
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
              <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Cartão:</span>
                  <span className="ml-2 font-medium">{faturaData.banco_cartao}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Período:</span>
                  <span className="ml-2 font-medium">{faturaData.periodo_fatura}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">{formatCentsToDisplay(faturaData.valor_total * 100)}</span>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {faturaData.transacoes.length} transações
                </Badge>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pago por</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger className="h-9">
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
                    <SelectTrigger className="h-9">
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
                    <SelectTrigger className="h-9">
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
                <div className="flex items-end pb-1">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === faturaData.transacoes.length}
                    onCheckedChange={(checked) => toggleAll(checked as boolean)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} de {faturaData.transacoes.length} selecionadas
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Total selecionado: {formatCentsToDisplay(totalValue * 100)}
                </span>
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-28">Categoria</TableHead>
                      <TableHead className="w-20 text-right">Valor</TableHead>
                      <TableHead className="w-20">Parcela</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faturaData.transacoes.map((transacao, index) => (
                      <TableRow 
                        key={index}
                        className={cn(!transacao.selected && "opacity-50")}
                      >
                        <TableCell>
                          <Checkbox
                            checked={transacao.selected}
                            onCheckedChange={() => toggleTransacao(index)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transacao.data}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transacao.descricao}
                            onChange={(e) => updateTransacao(index, { descricao: e.target.value })}
                            className="h-7 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transacao.categoria_sugerida || ""}
                            onValueChange={(value) => updateTransacao(index, { categoria_sugerida: value })}
                          >
                            <SelectTrigger className="h-7 text-xs">
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
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentsToDisplay(transacao.valor * 100)}
                        </TableCell>
                        <TableCell>
                          {transacao.parcela_atual && transacao.parcela_total && (
                            <Badge variant="outline" className="text-xs">
                              {transacao.parcela_atual}/{transacao.parcela_total}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

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
