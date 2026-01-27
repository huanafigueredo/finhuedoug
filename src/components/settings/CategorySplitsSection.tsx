import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCategorySplits,
  useAddCategorySplit,
  useUpdateCategorySplit,
  useDeleteCategorySplit,
  CategorySplit,
  CategorySplitInput,
} from "@/hooks/useCategorySplits";
import { CategorySplitRuleCard } from "./CategorySplitRuleCard";
import { CategorySplitRuleModal } from "./CategorySplitRuleModal";

export function CategorySplitsSection() {
  const { data: rules = [], isLoading } = useCategorySplits();
  const addMutation = useAddCategorySplit();
  const updateMutation = useUpdateCategorySplit();
  const deleteMutation = useDeleteCategorySplit();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategorySplit | null>(null);
  const [deleteRule, setDeleteRule] = useState<CategorySplit | null>(null);

  const handleAdd = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const handleEdit = (rule: CategorySplit) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSave = async (input: CategorySplitInput) => {
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule.id, ...input });
        toast.success("Regra atualizada!");
      } else {
        await addMutation.mutateAsync(input);
        toast.success("Regra adicionada!");
      }
      setModalOpen(false);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Já existe uma regra para esta categoria/subcategoria");
      } else {
        toast.error("Erro ao salvar regra");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteRule) return;
    try {
      await deleteMutation.mutateAsync(deleteRule.id);
      toast.success("Regra removida!");
      setDeleteRule(null);
    } catch {
      toast.error("Erro ao remover regra");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">Regras por Categoria</h4>
          <p className="text-xs text-muted-foreground">
            Defina divisões específicas que sobrescrevem a configuração global
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl bg-muted/20">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
            <span className="text-lg">💡</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma regra configurada</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Dica: Você pode definir que <strong>Aluguel</strong> é proporcional à renda, enquanto <strong>Lazer</strong> é dividido 50/50.
          </p>
          <Button variant="link" onClick={handleAdd} className="mt-2 text-primary h-auto p-0 text-xs">
            Criar primeira regra
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <CategorySplitRuleCard
              key={rule.id}
              rule={rule}
              onEdit={handleEdit}
              onDelete={setDeleteRule}
            />
          ))}
        </div>
      )}

      <CategorySplitRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingRule={editingRule}
        onSave={handleSave}
        isPending={addMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteRule} onOpenChange={() => setDeleteRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover regra?</AlertDialogTitle>
            <AlertDialogDescription>
              A regra para "{deleteRule?.category_name}
              {deleteRule?.subcategory_name ? ` › ${deleteRule.subcategory_name}` : ""}"
              será removida e a divisão global será usada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
