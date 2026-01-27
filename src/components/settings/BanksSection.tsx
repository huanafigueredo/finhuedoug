import { useState } from "react";
import { useBanks, useAddBank, useUpdateBank, useDeleteBank } from "@/hooks/useBanks";
import { SettingsListSection } from "./SettingsListSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "./ColorPicker";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function BanksSection() {
    const { toast } = useToast();
    const { data: banks = [], isLoading } = useBanks();
    const addBank = useAddBank();
    const updateBank = useUpdateBank();
    const deleteBank = useDeleteBank();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: string; name: string; color: string } | null>(null);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("#D77A61");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setNewName("");
        setNewColor("#D77A61");
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        setNewName(item.name);
        setNewColor(item.color || "#D77A61");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;

        try {
            if (editingItem) {
                await updateBank.mutateAsync({ id: editingItem.id, name: newName, color: newColor });
                toast({ title: "Banco atualizado com sucesso!" });
            } else {
                await addBank.mutateAsync({ name: newName, color: newColor });
                toast({ title: "Banco adicionado com sucesso!" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteBank.mutateAsync(deleteId);
            toast({ title: "Banco removido!" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <>
            <SettingsListSection
                items={banks.map(b => ({ id: b.id, name: b.name, color: b.color }))}
                isLoading={isLoading}
                onAdd={handleOpenAdd}
                onEdit={handleOpenEdit}
                onDelete={(item) => setDeleteId(item.id)}
            />

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Banco" : "Adicionar Banco"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome do Banco</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: Nubank, Itaú..."
                            />
                        </div>
                        <ColorPicker color={newColor} onChange={setNewColor} />

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                disabled={!newName.trim() || addBank.isPending || updateBank.isPending}
                            >
                                {(addBank.isPending || updateBank.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Banco</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este banco?
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
        </>
    );
}
