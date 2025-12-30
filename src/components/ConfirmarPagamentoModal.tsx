import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContaAgendada, useContasAgendadasMutations } from "@/hooks/useContasAgendadas";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrencyInput, parseCurrencyToCents, centsToReais } from "@/lib/currency";

interface ConfirmarPagamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaAgendada | null;
}

export function ConfirmarPagamentoModal({
  open,
  onOpenChange,
  conta,
}: ConfirmarPagamentoModalProps) {
  const { confirmarPagamento } = useContasAgendadasMutations();
  const isMobile = useIsMobile();
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [valor, setValor] = useState(conta?.valor || 0);
  const [valorDisplay, setValorDisplay] = useState("");
  const [observacao, setObservacao] = useState(conta?.observacao || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when conta changes
  useEffect(() => {
    if (conta) {
      setValor(conta.valor);
      // Format value for display (convert from reais to cents then format)
      if (conta.valor > 0) {
        const cents = Math.round(conta.valor * 100);
        setValorDisplay(formatCurrencyInput(cents.toString()));
      } else {
        setValorDisplay("");
      }
      setObservacao(conta.observacao || "");
      setDataPagamento(format(new Date(), "yyyy-MM-dd"));
    }
  }, [conta]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValorDisplay(formatted);
    const cents = parseCurrencyToCents(formatted);
    setValor(centsToReais(cents));
  };

  if (!conta) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await confirmarPagamento.mutateAsync({
        contaId: conta.id,
        dataPagamento,
        valor,
        observacao: observacao || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const recorrencia = conta.recorrencia;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Data de Pagamento */}
      <div className="space-y-2">
        <Label htmlFor="data" className="flex items-center gap-2">
          📅 Data do Pagamento
        </Label>
        <Input
          id="data"
          type="date"
          value={dataPagamento}
          onChange={(e) => setDataPagamento(e.target.value)}
          required
        />
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="valor" className="flex items-center gap-2">
          💰 Valor
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id="valor"
            type="text"
            inputMode="decimal"
            value={valorDisplay}
            onChange={handleValorChange}
            onFocus={(e) => e.target.select()}
            placeholder="0,00"
            className="pl-9"
            required
          />
        </div>
        {valor !== conta.valor && (
          <p className="text-xs text-muted-foreground">
            Valor original: R$ {conta.valor.toFixed(2)}
          </p>
        )}
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">📝 Observação deste mês</Label>
        <Textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observação opcional..."
          rows={3}
        />
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
        <p className="text-sm text-success">
          ✅ Ao confirmar, um lançamento será criado automaticamente.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Confirmando..." : "✅ Confirmar Pagamento"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              ✅ Confirmar Pagamento
            </DrawerTitle>
            <DrawerDescription>
              {recorrencia?.titulo} - {conta.competencia}
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✅ Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            {recorrencia?.titulo} - {conta.competencia}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
