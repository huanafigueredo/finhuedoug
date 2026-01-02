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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paidBy, setPaidBy] = useState<string>("person1");
  const [isCouple, setIsCouple] = useState(true);
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");

  const { 
    isAnalyzing, 
    faturaData, 
    error, 
    analisarFatura, 
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      resetFatura();
    }
  };

  const handleAnalyze = async () => {
    if (selectedFile) {
      await analisarFatura(selectedFile);
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
        setSelectedFile(null);
        resetFatura();
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedFile(null);
    resetFatura();
  };

  const selectedCount = faturaData?.transacoes.filter(t => t.selected).length || 0;
  const totalValue = faturaData?.transacoes
    .filter(t => t.selected)
    .reduce((sum, t) => sum + t.valor, 0) || 0;

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
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formatos aceitos: JPEG, PNG, PDF (máx. 10MB)
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
                disabled={!selectedFile || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando com IA...
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
