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
import { Loader2, CreditCard, Landmark } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function BanksSection() {
    const { toast } = useToast();
    const { data: banks = [], isLoading } = useBanks();
    const addBank = useAddBank();
    const updateBank = useUpdateBank();
    const deleteBank = useDeleteBank();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: string; name: string; color: string; type: "account" | "credit_card"; closing_day: number | null; due_day: number | null } | null>(null);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("#D77A61");
    const [newType, setNewType] = useState<"account" | "credit_card">("account");
    const [newClosingDay, setNewClosingDay] = useState("");
    const [newDueDay, setNewDueDay] = useState("");

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setNewName("");
        setNewColor("#D77A61");
        setNewType("account");
        setNewClosingDay("");
        setNewDueDay("");
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        setNewName(item.name);
        setNewColor(item.color || "#D77A61");
        setNewType(item.type || "account");
        setNewClosingDay(item.closing_day?.toString() || "");
        setNewDueDay(item.due_day?.toString() || "");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;

        // Validation for Credit Card
        let closingDay: number | null = null;
        let dueDay: number | null = null;

        if (newType === "credit_card") {
            closingDay = parseInt(newClosingDay);
            dueDay = parseInt(newDueDay);

            if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
                toast({ title: "Dia de fechamento inválido", description: "Informe um dia entre 1 e 31.", variant: "destructive" });
                return;
            }
            if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
                toast({ title: "Dia de vencimento inválido", description: "Informe um dia entre 1 e 31.", variant: "destructive" });
                return;
            }
        }

        try {
            if (editingItem) {
                await updateBank.mutateAsync({
                    id: editingItem.id,
                    name: newName,
                    color: newColor,
                    type: newType,
                    closing_day: closingDay,
                    due_day: dueDay
                });
                toast({ title: "Item atualizado com sucesso!" });
            } else {
                await addBank.mutateAsync({
                    name: newName,
                    color: newColor,
                    type: newType,
                    closing_day: closingDay,
                    due_day: dueDay
                });
                toast({ title: "Item adicionado com sucesso!" });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error("Erro ao salvar banco:", error);
            toast({
                title: "Erro ao salvar",
                description: error.message || "Não foi possível salvar as alterações. Verifique se o banco de dados foi atualizado.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteBank.mutateAsync(deleteId);
            toast({ title: "Item removido!" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const getIcon = (type: string) => {
        return type === "credit_card" ? <CreditCard className="w-4 h-4" /> : <Landmark className="w-4 h-4" />;
    };

    return (
        <>
            <SettingsListSection
                items={banks.map(b => ({
                    id: b.id,
                    name: b.name,
                    color: b.color,
                    type: b.type, // Pass original type
                    closing_day: b.closing_day, // Pass original closing_day
                    due_day: b.due_day, // Pass original due_day
                    icon: getIcon(b.type || "account"),
                    subtitle: b.type === "credit_card" && b.closing_day && b.due_day
                        ? `Fecha dia ${b.closing_day} • Vence dia ${b.due_day}`
                        : undefined
                }))}
                isLoading={isLoading}
                onAdd={handleOpenAdd}
                onEdit={handleOpenEdit}
                onDelete={(item) => setDeleteId(item.id)}
            />

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewType("account")}
                                    className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${newType === "account"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted hover:bg-muted/50 text-muted-foreground"
                                        }`}
                                >
                                    <Landmark className="w-5 h-5" />
                                    <span className="text-sm font-medium">Conta Corrente</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewType("credit_card")}
                                    className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${newType === "credit_card"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted hover:bg-muted/50 text-muted-foreground"
                                        }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-sm font-medium">Cartão de Crédito</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={newType === "credit_card" ? "Ex: Nubank Ultravioleta" : "Ex: Conta Principal"}
                            />
                        </div>

                        {newType === "credit_card" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Dia do Fechamento (Virada) *</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={newClosingDay}
                                        onChange={(e) => setNewClosingDay(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Ex: 5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dia do Vencimento *</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={newDueDay}
                                        onChange={(e) => setNewDueDay(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Ex: 12"
                                    />
                                </div>
                            </div>
                        )}

                        <ColorPicker color={newColor} onChange={setNewColor} />

                        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
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
