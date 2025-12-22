import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContaAgendada, useContasAgendadasMutations } from "@/hooks/useContasAgendadas";
import { format } from "date-fns";
import { Check, Calendar, DollarSign } from "lucide-react";

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
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [valor, setValor] = useState(conta?.valor || 0);
  const [observacao, setObservacao] = useState(conta?.observacao || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when conta changes
  useState(() => {
    if (conta) {
      setValor(conta.valor);
      setObservacao(conta.observacao || "");
    }
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            {recorrencia?.titulo} - {conta.competencia}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="data" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data do Pagamento
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
              <DollarSign className="w-4 h-4" />
              Valor
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              required
            />
            {valor !== conta.valor && (
              <p className="text-xs text-muted-foreground">
                Valor original: R$ {conta.valor.toFixed(2)}
              </p>
            )}
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação deste mês</Label>
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
              Ao confirmar, um lançamento será criado automaticamente e aparecerá nos cálculos do mês.
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
              {isSubmitting ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
