import { useState } from "react";
import { usePaymentMethods, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePaymentMethods";
import { SettingsListSection } from "./SettingsListSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, QrCode, Barcode, CreditCard, Banknote, ArrowRightLeft, Wallet } from "lucide-react";

export function PaymentMethodsSection() {
    const { toast } = useToast();
    const { data: methods = [], isLoading } = usePaymentMethods();
    const addMethod = useAddPaymentMethod();
    const updateMethod = useUpdatePaymentMethod();
    const deleteMethod = useDeletePaymentMethod();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
    const [newName, setNewName] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const getPaymentIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("pix")) return <QrCode className="w-4 h-4" />;
        if (lower.includes("boleto")) return <Barcode className="w-4 h-4" />;
        if (lower.includes("crédito") || lower.includes("credito") || lower.includes("card")) return <CreditCard className="w-4 h-4" />;
        if (lower.includes("débito") || lower.includes("debito")) return <CreditCard className="w-4 h-4" />;
        if (lower.includes("dinheiro") || lower.includes("espécie")) return <Banknote className="w-4 h-4" />;
        if (lower.includes("transferência") || lower.includes("transferencia")) return <ArrowRightLeft className="w-4 h-4" />;
        return <Wallet className="w-4 h-4" />;
    };

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
                await updateMethod.mutateAsync({ id: editingItem.id, name: newName });
                toast({ title: "Forma de pagamento atualizada!" });
            } else {
                await addMethod.mutateAsync({ name: newName });
                toast({ title: "Forma de pagamento adicionada!" });
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMethod.mutateAsync(deleteId);
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
                items={methods.map(m => ({
                    id: m.id,
                    name: m.name,
                    icon: getPaymentIcon(m.name)
                }))}
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
                                placeholder="Ex: Cartão de Crédito, Pix..."
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                disabled={!newName.trim() || addMethod.isPending || updateMethod.isPending}
                            >
                                {(addMethod.isPending || updateMethod.isPending) && (
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
