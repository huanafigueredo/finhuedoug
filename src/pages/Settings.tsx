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
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { useBanks, useAddBank, useUpdateBank, useDeleteBank } from "@/hooks/useBanks";
import { usePaymentMethods, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePaymentMethods";
import { useRecipients, useAddRecipient, useUpdateRecipient, useDeleteRecipient } from "@/hooks/useRecipients";
import { useToast } from "@/hooks/use-toast";

interface ConfigItem {
  id: string;
  name: string;
  color?: string | null;
}

const initialBalances = [
  { id: "1", name: "Nubank - Huana", value: "5.000,00" },
  { id: "2", name: "Inter - Huana", value: "2.500,00" },
  { id: "3", name: "Nubank - Douglas", value: "3.800,00" },
  { id: "4", name: "Itaú - Douglas", value: "1.200,00" },
];

export default function Settings() {
  const { toast } = useToast();
  const [balances, setBalances] = useState(initialBalances);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemColor, setNewItemColor] = useState("#D77A61");

  // Data from Supabase
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();

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

  const sections = {
    banks: {
      title: "Bancos",
      icon: CreditCard,
      allowColor: true,
      items: banks.map((b) => ({ id: b.id, name: b.name, color: b.color })),
      isLoading: banksLoading,
    },
    paymentMethods: {
      title: "Formas de Pagamento",
      icon: Wallet,
      allowColor: false,
      items: paymentMethods.map((p) => ({ id: p.id, name: p.name })),
      isLoading: paymentMethodsLoading,
    },
    recipients: {
      title: "Para Quem",
      icon: Users,
      allowColor: false,
      items: recipients.map((r) => ({ id: r.id, name: r.name })),
      isLoading: recipientsLoading,
    },
  };

  const openAddDialog = (sectionKey: string) => {
    setEditingSection(sectionKey);
    setEditingItem(null);
    setNewItemName("");
    setNewItemColor("#D77A61");
    setIsDialogOpen(true);
  };

  const openEditDialog = (sectionKey: string, item: ConfigItem) => {
    setEditingSection(sectionKey);
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemColor(item.color || "#D77A61");
    setIsDialogOpen(true);
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
      }

      toast({
        title: editingItem ? "Item atualizado!" : "Item adicionado!",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (sectionKey: string, itemId: string) => {
    try {
      if (sectionKey === "banks") {
        await deleteBank.mutateAsync(itemId);
      } else if (sectionKey === "paymentMethods") {
        await deletePaymentMethod.mutateAsync(itemId);
      } else if (sectionKey === "recipients") {
        await deleteRecipient.mutateAsync(itemId);
      }

      toast({
        title: "Item removido!",
        description: "O item foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  const isSaving = addBank.isPending || updateBank.isPending || addPaymentMethod.isPending || 
                   updatePaymentMethod.isPending || addRecipient.isPending || updateRecipient.isPending;

  return (
    <div className="min-h-screen bg-background">
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
                  className="rounded-2xl bg-card border border-border shadow-card overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <section.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-display text-lg font-semibold text-foreground">
                        {section.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({section.items.length})
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
                              className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 group"
                            >
                              <div className="flex items-center gap-3">
                                {item.color && (
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                )}
                                <span className="text-sm font-medium text-foreground">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditDialog(key, item)}
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDelete(key, item.id)}
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
                            className="w-full mt-2"
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
                className="rounded-2xl bg-card border border-border shadow-card overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <PiggyBank className="w-5 h-5 text-accent" />
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
                            className="pl-10 text-right"
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
        <DialogContent>
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
                    className="w-12 h-12 rounded-xl border border-border cursor-pointer"
                  />
                  <Input
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!newItemName.trim() || isSaving}>
                {isSaving ? "Salvando..." : editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
