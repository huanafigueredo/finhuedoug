import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Folder,
  Tag,
  CreditCard,
  Wallet,
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronRight,
} from "lucide-react";
import { useBanks, useAddBank, useUpdateBank, useDeleteBank } from "@/hooks/useBanks";
import { usePaymentMethods, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePaymentMethods";
import { useRecipients, useAddRecipient, useUpdateRecipient, useDeleteRecipient } from "@/hooks/useRecipients";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategoriesMutations";
import { useAddSubcategory, useUpdateSubcategory, useDeleteSubcategory } from "@/hooks/useSubcategoriesMutations";
import { useToast } from "@/hooks/use-toast";

interface ConfigItem {
  id: string;
  name: string;
  color?: string | null;
  category_id?: string;
}

const initialBalances = [
  { id: "1", name: "Conta 1", value: "5.000,00" },
  { id: "2", name: "Conta 2", value: "2.500,00" },
  { id: "3", name: "Conta 3", value: "3.800,00" },
  { id: "4", name: "Conta 4", value: "1.200,00" },
];

export default function Settings() {
  const { toast } = useToast();
  const [balances, setBalances] = useState(initialBalances);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemColor, setNewItemColor] = useState("#D77A61");
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ section: string; id: string; name: string } | null>(null);

  // Data from Supabase
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories();

  // Mutations
  const addBank = useAddBank();
  const updateBank = useUpdateBank();
  const deleteBank = useDeleteBank();
  const addPaymentMethod = useAddPaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const addRecipient = useAddRecipient();
  const updateRecipient = useUpdateRecipient();
  const deleteRecipient = useDeleteRecipient();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const addSubcategory = useAddSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  // Group subcategories by category
  const subcategoriesByCategory = subcategories.reduce((acc, sub) => {
    if (!acc[sub.category_id]) acc[sub.category_id] = [];
    acc[sub.category_id].push(sub);
    return acc;
  }, {} as Record<string, typeof subcategories>);

  const sections = {
    banks: {
      title: "Bancos",
      icon: CreditCard,
      allowColor: true,
      requiresCategory: false,
      items: banks.map((b) => ({ id: b.id, name: b.name, color: b.color })),
      isLoading: banksLoading,
    },
    paymentMethods: {
      title: "Formas de Pagamento",
      icon: Wallet,
      allowColor: false,
      requiresCategory: false,
      items: paymentMethods.map((p) => ({ id: p.id, name: p.name })),
      isLoading: paymentMethodsLoading,
    },
    recipients: {
      title: "Para Quem",
      icon: Users,
      allowColor: false,
      requiresCategory: false,
      items: recipients.map((r) => ({ id: r.id, name: r.name })),
      isLoading: recipientsLoading,
    },
    categories: {
      title: "Categorias",
      icon: Folder,
      allowColor: false,
      requiresCategory: false,
      items: categories.map((c) => ({ id: c.id, name: c.name })),
      isLoading: categoriesLoading,
    },
    subcategories: {
      title: "Subcategorias",
      icon: Tag,
      allowColor: false,
      requiresCategory: true,
      items: subcategories.map((s) => ({ id: s.id, name: s.name, category_id: s.category_id })),
      isLoading: subcategoriesLoading,
    },
  };

  const openAddDialog = (sectionKey: string) => {
    setEditingSection(sectionKey);
    setEditingItem(null);
    setNewItemName("");
    setNewItemColor("#D77A61");
    setNewItemCategoryId("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (sectionKey: string, item: ConfigItem) => {
    setEditingSection(sectionKey);
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemColor(item.color || "#D77A61");
    setNewItemCategoryId(item.category_id || "");
    setIsDialogOpen(true);
  };

  const confirmDelete = (sectionKey: string, id: string, name: string) => {
    setItemToDelete({ section: sectionKey, id, name });
    setDeleteConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!editingSection || !newItemName.trim()) return;

    try {
      if (editingSection === "banks") {
        if (editingItem) {
          await updateBank.mutateAsync({ id: editingItem.id, name: newItemName, color: newItemColor });
        } else {
          await addBank.mutateAsync({ name: newItemName, color: newItemColor });
        }
      } else if (editingSection === "paymentMethods") {
        if (editingItem) {
          await updatePaymentMethod.mutateAsync({ id: editingItem.id, name: newItemName });
        } else {
          await addPaymentMethod.mutateAsync({ name: newItemName });
        }
      } else if (editingSection === "recipients") {
        if (editingItem) {
          await updateRecipient.mutateAsync({ id: editingItem.id, name: newItemName });
        } else {
          await addRecipient.mutateAsync({ name: newItemName });
        }
      } else if (editingSection === "categories") {
        if (editingItem) {
          await updateCategory.mutateAsync({ id: editingItem.id, name: newItemName });
        } else {
          await addCategory.mutateAsync({ name: newItemName });
        }
      } else if (editingSection === "subcategories") {
        if (!newItemCategoryId) {
          toast({
            title: "Erro",
            description: "Selecione uma categoria para a subcategoria.",
            variant: "destructive",
          });
          return;
        }
        if (editingItem) {
          await updateSubcategory.mutateAsync({ id: editingItem.id, name: newItemName, category_id: newItemCategoryId });
        } else {
          await addSubcategory.mutateAsync({ name: newItemName, category_id: newItemCategoryId });
        }
      }

      toast({
        title: editingItem ? "Item atualizado!" : "Item adicionado!",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { section, id } = itemToDelete;

    try {
      if (section === "banks") {
        await deleteBank.mutateAsync(id);
      } else if (section === "paymentMethods") {
        await deletePaymentMethod.mutateAsync(id);
      } else if (section === "recipients") {
        await deleteRecipient.mutateAsync(id);
      } else if (section === "categories") {
        await deleteCategory.mutateAsync(id);
      } else if (section === "subcategories") {
        await deleteSubcategory.mutateAsync(id);
      }

      toast({
        title: "Item removido!",
        description: "O item foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível remover o item.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const isSaving = addBank.isPending || updateBank.isPending || addPaymentMethod.isPending || 
                   updatePaymentMethod.isPending || addRecipient.isPending || updateRecipient.isPending ||
                   addCategory.isPending || updateCategory.isPending ||
                   addSubcategory.isPending || updateSubcategory.isPending;

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Personalize bancos, formas de pagamento e mais
            </p>
          </div>

          {/* Config Sections */}
          <div className="space-y-4">
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(sections).map(([key, section]) => (
                <AccordionItem
                  key={key}
                  value={key}
                  className="rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-romantic flex items-center justify-center shadow-glow">
                        <section.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-display text-lg font-semibold text-foreground">
                        {section.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {section.items.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-3">
                      {section.isLoading ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Carregando...
                        </div>
                      ) : (
                        <>
                          {section.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 group hover:shadow-glow transition-all"
                            >
                              <div className="flex items-center gap-3">
                                {item.color && (
                                  <div
                                    className="w-4 h-4 rounded-full shadow-sm"
                                    style={{ backgroundColor: item.color }}
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    {item.name}
                                  </span>
                                  {key === "subcategories" && item.category_id && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <ChevronRight className="w-3 h-3" />
                                      {getCategoryName(item.category_id)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditDialog(key, item)}
                                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-primary" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(key, item.id, item.name)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddDialog(key)}
                            className="w-full mt-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}

              {/* Initial Balances */}
              <AccordionItem
                value="balances"
                className="rounded-2xl bg-white/80 backdrop-blur-sm border border-accent/10 shadow-soft overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-lavender flex items-center justify-center shadow-md">
                      <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display text-lg font-semibold text-foreground">
                      Saldos Iniciais
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {balances.map((balance) => (
                      <div
                        key={balance.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <Label className="text-sm font-medium text-muted-foreground min-w-32">
                          {balance.name}
                        </Label>
                        <div className="relative flex-1 max-w-48">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input
                            value={balance.value}
                            onChange={(e) =>
                              setBalances((prev) =>
                                prev.map((b) =>
                                  b.id === balance.id
                                    ? { ...b, value: e.target.value }
                                    : b
                                )
                              )
                            }
                            className="pl-10 text-right border-accent/20 focus:ring-accent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-primary/10">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingItem ? "Editar" : "Adicionar"}{" "}
              {editingSection && sections[editingSection as keyof typeof sections]?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Digite o nome..."
                className="border-primary/20 focus:ring-primary"
              />
            </div>

            {editingSection && sections[editingSection as keyof typeof sections]?.allowColor && (
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-primary/20 cursor-pointer"
                  />
                  <Input
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="flex-1 border-primary/20 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {editingSection === "subcategories" && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                  <SelectTrigger className="border-primary/20 focus:ring-primary">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="border-primary/20">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleSave} disabled={!newItemName.trim() || isSaving}>
                {isSaving ? "Salvando..." : editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
