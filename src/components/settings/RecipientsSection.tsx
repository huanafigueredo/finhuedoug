import { useState } from "react";
import { useRecipients, useAddRecipient, useUpdateRecipient, useDeleteRecipient } from "@/hooks/useRecipients";
import { SettingsListSection } from "./SettingsListSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function RecipientsSection() {
    const { toast } = useToast();
    const { data: recipients = [], isLoading } = useRecipients();
    const addRecipient = useAddRecipient();
    const updateRecipient = useUpdateRecipient();
    const deleteRecipient = useDeleteRecipient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
    const [newName, setNewName] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setNewName("");
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        setNewName(item.name);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;

        try {
            if (editingItem) {
                await updateRecipient.mutateAsync({ id: editingItem.id, name: newName });
                toast({ title: "Destinatário atualizado!" });
            } else {
                await addRecipient.mutateAsync({ name: newName });
                toast({ title: "Destinatário adicionado!" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteRecipient.mutateAsync(deleteId);
            toast({ title: "Item removido!" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <>
            <SettingsListSection
                items={recipients.map(r => ({ id: r.id, name: r.name }))}
                isLoading={isLoading}
                onAdd={handleOpenAdd}
                onEdit={handleOpenEdit}
                onDelete={(item) => setDeleteId(item.id)}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar" : "Adicionar"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: Supermercado, Aluguel..."
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                disabled={!newName.trim() || addRecipient.isPending || updateRecipient.isPending}
                            >
                                {(addRecipient.isPending || updateRecipient.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este item?
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
