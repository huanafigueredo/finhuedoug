import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategoriesMutations";
import { useAddSubcategory, useUpdateSubcategory, useDeleteSubcategory } from "@/hooks/useSubcategoriesMutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronRight, Plus, Pencil, Trash2, Folder, Tag, Loader2, GripVertical } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CategoriesSection() {
    const { toast } = useToast();
    const { data: categories = [], isLoading: catLoading } = useCategories();
    const { data: subcategories = [], isLoading: subLoading } = useSubcategories();

    // Category Mutations
    const addCategory = useAddCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    // Subcategory Mutations
    const addSubcategory = useAddSubcategory();
    const updateSubcategory = useUpdateSubcategory();
    const deleteSubcategory = useDeleteSubcategory();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<"category" | "subcategory">("category");
    const [editingItem, setEditingItem] = useState<{ id: string; name: string; category_id?: string } | null>(null);
    const [newName, setNewName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<string>("");

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: string; type: "category" | "subcategory"; name: string } | null>(null);

    const getSubcategories = (categoryId: string) => {
        return subcategories.filter(s => s.category_id === categoryId);
    };

    const handleOpenAddCategory = () => {
        setEditingType("category");
        setEditingItem(null);
        setNewName("");
        setIsDialogOpen(true);
    };

    const handleOpenEditCategory = (category: any) => {
        setEditingType("category");
        setEditingItem(category);
        setNewName(category.name);
        setIsDialogOpen(true);
    };

    const handleOpenAddSubcategory = (categoryId: string) => {
        setEditingType("subcategory");
        setEditingItem(null);
        setSelectedParentId(categoryId);
        setNewName("");
        setIsDialogOpen(true);
    };

    const handleOpenEditSubcategory = (sub: any) => {
        setEditingType("subcategory");
        setEditingItem(sub);
        setSelectedParentId(sub.category_id);
        setNewName(sub.name);
        setIsDialogOpen(true);
    };

    const handleOpenDelete = (id: string, name: string, type: "category" | "subcategory") => {
        setDeleteItem({ id, name, type });
        setDeleteConfirmOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;

        try {
            if (editingType === "category") {
                if (editingItem) {
                    await updateCategory.mutateAsync({ id: editingItem.id, name: newName });
                } else {
                    await addCategory.mutateAsync({ name: newName });
                }
            } else {
                if (!selectedParentId) {
                    toast({ title: "Selecione uma categoria pai", variant: "destructive" });
                    return;
                }
                if (editingItem) {
                    await updateSubcategory.mutateAsync({
                        id: editingItem.id,
                        name: newName,
                        category_id: selectedParentId
                    });
                } else {
                    await addSubcategory.mutateAsync({
                        name: newName,
                        category_id: selectedParentId
                    });
                }
            }

            toast({ title: "Salvo com sucesso!" });
            setIsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;

        try {
            if (deleteItem.type === "category") {
                await deleteCategory.mutateAsync(deleteItem.id);
            } else {
                await deleteSubcategory.mutateAsync(deleteItem.id);
            }
            toast({ title: "Excluído com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteItem(null);
        }
    };

    const isSaving = addCategory.isPending || updateCategory.isPending || addSubcategory.isPending || updateSubcategory.isPending;

    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddCategory}
                className="w-full sm:w-auto"
            >
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
            </Button>

            {catLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    Nenhuma categoria cadastrada.
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {categories.map((category) => (
                        <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-card px-2">
                            <div className="flex items-center justify-between py-2">
                                <AccordionTrigger className="hover:no-underline py-2 px-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-2 cursor-grab opacity-50" onClick={(e) => e.stopPropagation()} aria-hidden="true" />
                                        <Folder className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{category.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({getSubcategories(category.id).length} subs)
                                        </span>
                                    </div>
                                </AccordionTrigger>

                                <div className="flex items-center gap-1 mr-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 sm:h-8 sm:w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditCategory(category);
                                        }}
                                    >
                                        <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 sm:h-8 sm:w-8 hover:bg-destructive/10 hover:text-destructive ml-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDelete(category.id, category.name, "category");
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <AccordionContent className="pt-0 pb-3 px-4">
                                <div className="space-y-1 p-2 bg-muted/30 rounded-lg mt-2">
                                    {getSubcategories(category.id).map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-background transition-colors group border border-transparent hover:border-border/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                <span className="text-sm text-foreground/90">{sub.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 sm:h-6 sm:w-6"
                                                    onClick={() => handleOpenEditSubcategory(sub)}
                                                >
                                                    <Pencil className="w-4 h-4 sm:w-3 sm:h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 sm:h-6 sm:w-6 hover:text-destructive ml-1"
                                                    onClick={() => handleOpenDelete(sub.id, sub.name, "subcategory")}
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs text-muted-foreground hover:text-primary mt-1 pl-3"
                                        onClick={() => handleOpenAddSubcategory(category.id)}
                                    >
                                        <Plus className="w-3 h-3 mr-2" />
                                        Adicionar Subcategoria
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Editar" : "Adicionar"} {editingType === "category" ? "Categoria" : "Subcategoria"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nome..."
                            />
                        </div>

                        {editingType === "subcategory" && (
                            <div className="space-y-2">
                                <Label>Categoria Pai</Label>
                                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={!newName.trim() || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {deleteItem?.type === "category" ? "Categoria" : "Subcategoria"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{deleteItem?.name}"?
                            {deleteItem?.type === "category" &&
                                <p className="mt-2 text-destructive font-medium">Isso também excluirá todas as subcategorias contidas nela.</p>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
