import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { RecorrenciaInsert, useRecorrenciasMutations, Recorrencia } from "@/hooks/useRecorrencias";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { getCategoryEmoji } from "@/lib/categoryEmojis";

interface RecorrenciaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recorrencia?: Recorrencia | null;
}

const dias = Array.from({ length: 31 }, (_, i) => i + 1);

export function RecorrenciaFormModal({
  open,
  onOpenChange,
  recorrencia,
}: RecorrenciaFormModalProps) {
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();
  const { createRecorrencia, updateRecorrencia } = useRecorrenciasMutations();
  const { person1, person2 } = usePersonNames();
  const isMobile = useIsMobile();
  
  const pessoas = [
    { value: person1.toLowerCase(), label: person1 },
    { value: person2.toLowerCase(), label: person2 },
    { value: "casal", label: "Casal" },
  ];

  const [formData, setFormData] = useState<RecorrenciaInsert>({
    titulo: "",
    tipo: "expense",
    categoria: null,
    subcategoria: null,
    pessoa: null,
    para_quem: null,
    valor_padrao: 0,
    dia_vencimento: 1,
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    ativo: true,
    observacao_padrao: null,
    lembrete_7_dias: false,
    lembrete_3_dias: false,
    lembrete_1_dia: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recorrencia) {
      setFormData({
        titulo: recorrencia.titulo,
        tipo: recorrencia.tipo,
        categoria: recorrencia.categoria,
        subcategoria: recorrencia.subcategoria,
        pessoa: recorrencia.pessoa,
        para_quem: recorrencia.para_quem,
        valor_padrao: recorrencia.valor_padrao,
        dia_vencimento: recorrencia.dia_vencimento,
        data_inicio: recorrencia.data_inicio,
        ativo: recorrencia.ativo,
        observacao_padrao: recorrencia.observacao_padrao,
        lembrete_7_dias: recorrencia.lembrete_7_dias,
        lembrete_3_dias: recorrencia.lembrete_3_dias,
        lembrete_1_dia: recorrencia.lembrete_1_dia,
      });
    } else {
      setFormData({
        titulo: "",
        tipo: "expense",
        categoria: null,
        subcategoria: null,
        pessoa: null,
        para_quem: null,
        valor_padrao: 0,
        dia_vencimento: 1,
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        ativo: true,
        observacao_padrao: null,
        lembrete_7_dias: false,
        lembrete_3_dias: false,
        lembrete_1_dia: false,
      });
    }
  }, [recorrencia, open]);

  const filteredCategories = categories.filter((c) => c.type === formData.tipo);
  const filteredSubcategories = subcategories.filter(
    (s) => s.category_id === formData.categoria
  );

  // Find category name for emoji
  const selectedCategory = categories.find((c) => c.id === formData.categoria);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (recorrencia) {
        await updateRecorrencia.mutateAsync({
          id: recorrencia.id,
          ...formData,
        });
      } else {
        await createRecorrencia.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving recorrencia:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">📝 Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) =>
            setFormData({ ...formData, titulo: e.target.value })
          }
          placeholder="Ex: Conta de luz"
          required
        />
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label>🏷️ Tipo</Label>
        <Select
          value={formData.tipo}
          onValueChange={(value) =>
            setFormData({ ...formData, tipo: value, categoria: null, subcategoria: null })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">💸 Despesa</SelectItem>
            <SelectItem value="income">💰 Receita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor e Dia */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">💰 Valor Padrão *</Label>
          <Input
            id="valor"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={formData.valor_padrao}
            onChange={(e) =>
              setFormData({ ...formData, valor_padrao: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>📅 Dia Vencimento *</Label>
          <Select
            value={formData.dia_vencimento.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, dia_vencimento: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dias.map((dia) => (
                <SelectItem key={dia} value={dia.toString()}>
                  Dia {dia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data de Início */}
      <div className="space-y-2">
        <Label htmlFor="data_inicio">🗓️ Data de Início *</Label>
        <Input
          id="data_inicio"
          type="date"
          value={formData.data_inicio}
          onChange={(e) =>
            setFormData({ ...formData, data_inicio: e.target.value })
          }
          required
        />
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label>{getCategoryEmoji(selectedCategory?.name)} Categoria</Label>
        <Select
          value={formData.categoria || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, categoria: value || null, subcategoria: null })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {getCategoryEmoji(cat.name)} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategoria */}
      {filteredSubcategories.length > 0 && (
        <div className="space-y-2">
          <Label>📂 Subcategoria</Label>
          <Select
            value={formData.subcategoria || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, subcategoria: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma subcategoria" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pessoa */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>👤 Pago por</Label>
          <Select
            value={formData.pessoa || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, pessoa: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {pessoas.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>🎯 Para quem</Label>
          <Select
            value={formData.para_quem || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, para_quem: value || null })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {pessoas.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">📝 Observação Padrão</Label>
        <Textarea
          id="observacao"
          value={formData.observacao_padrao || ""}
          onChange={(e) =>
            setFormData({ ...formData, observacao_padrao: e.target.value || null })
          }
          placeholder="Detalhes sobre esta conta..."
          rows={2}
        />
      </div>

      {/* Lembretes */}
      <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
        <Label className="text-sm font-medium">🔔 Lembretes</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">7 dias antes</span>
            <Switch
              checked={formData.lembrete_7_dias}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, lembrete_7_dias: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">3 dias antes</span>
            <Switch
              checked={formData.lembrete_3_dias}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, lembrete_3_dias: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">1 dia antes</span>
            <Switch
              checked={formData.lembrete_1_dia}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, lembrete_1_dia: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : recorrencia ? "💾 Salvar" : "➕ Criar Recorrência"}
        </Button>
      </div>
    </form>
  );

  const title = recorrencia ? "✏️ Editar Recorrência" : "➕ Nova Recorrência";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6 max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
