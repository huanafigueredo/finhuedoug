import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronRight,
  UserCircle,
  Settings as SettingsIcon,
  Sparkles,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useBanks, useAddBank, useUpdateBank, useDeleteBank } from "@/hooks/useBanks";
import { usePaymentMethods, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePaymentMethods";
import { useRecipients, useAddRecipient, useUpdateRecipient, useDeleteRecipient } from "@/hooks/useRecipients";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategoriesMutations";
import { useAddSubcategory, useUpdateSubcategory, useDeleteSubcategory } from "@/hooks/useSubcategoriesMutations";
import { useCoupleMembers, useAddCoupleMember, useUpdateCoupleMember, useDeleteCoupleMember } from "@/hooks/useCoupleMembers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { PersonalizationSection } from "@/components/settings/PersonalizationSection";
import { SplitSettingsSection } from "@/components/settings/SplitSettingsSection";

interface ConfigItem {
  id: string;
  name: string;
  color?: string | null;
  category_id?: string;
  user_id?: string | null;
}

// Sidebar navigation items
const navSections = [
  { id: "general", label: "Geral", icon: SettingsIcon },
  { id: "personalization", label: "Personalização", icon: Sparkles },
  { id: "people", label: "Pessoas", icon: UserCircle },
  { id: "split", label: "Divisão de Despesas", icon: Wallet },
  { id: "banks", label: "Bancos", icon: CreditCard },
  { id: "payment-methods", label: "Formas de Pagamento", icon: Wallet },
  { id: "recipients", label: "Para Quem", icon: Users },
  { id: "categories", label: "Categorias", icon: Folder },
  { id: "subcategories", label: "Subcategorias", icon: Tag },
  { id: "account", label: "Conta", icon: LogOut },
];

export default function Settings() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("general");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemColor, setNewItemColor] = useState("#D77A61");
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ section: string; id: string; name: string } | null>(null);
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { user, signOut } = useAuth();

  // Section refs for scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Couple members (dynamic people system)
  const { data: coupleMembers = [], isLoading: coupleMembersLoading } = useCoupleMembers();
  const addCoupleMember = useAddCoupleMember();
  const updateCoupleMember = useUpdateCoupleMember();
  const deleteCoupleMember = useDeleteCoupleMember();
  
  // People modal state
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<{ id: string; name: string; avatar_url: string | null; position: number } | null>(null);
  const [newPersonName, setNewPersonName] = useState("");

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

  const openAddPersonDialog = () => {
    setEditingPerson(null);
    setNewPersonName("");
    setIsPeopleDialogOpen(true);
  };

  const openEditPersonDialog = (person: { id: string; name: string; avatar_url: string | null; position: number }) => {
    setEditingPerson(person);
    setNewPersonName(person.name);
    setIsPeopleDialogOpen(true);
  };

  const handleSavePerson = async () => {
    if (!newPersonName.trim()) return;
    
    try {
      if (editingPerson) {
        await updateCoupleMember.mutateAsync({ id: editingPerson.id, name: newPersonName.trim() });
        toast({ title: "Pessoa atualizada!", description: "Nome salvo com sucesso." });
      } else {
        await addCoupleMember.mutateAsync({ name: newPersonName.trim() });
        toast({ title: "Pessoa adicionada!", description: "Nova pessoa criada com sucesso." });
      }
      setIsPeopleDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const handleDeletePerson = async (id: string, name: string) => {
    setItemToDelete({ section: "people", id, name });
    setDeleteConfirmOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "";
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      } else if (editingSection === "payment-methods") {
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
      if (section === "people") {
        await deleteCoupleMember.mutateAsync(id);
      } else if (section === "banks") {
        await deleteBank.mutateAsync(id);
      } else if (section === "payment-methods") {
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

  const getSectionLabel = (section: string) => {
    switch (section) {
      case "people": return "Pessoa";
      case "banks": return "Bancos";
      case "payment-methods": return "Formas de Pagamento";
      case "recipients": return "Para Quem";
      case "categories": return "Categorias";
      case "subcategories": return "Subcategorias";
      default: return "";
    }
  };

  // Render a config list item
  const renderConfigItem = (sectionKey: string, item: ConfigItem) => {
    // Categories and subcategories are global - everyone can edit/delete
    // For other items (banks, payment_methods, recipients), only user-owned items can be edited
    const isGlobalEditableSection = sectionKey === "categories" || sectionKey === "subcategories";
    const isSystemItem = !isGlobalEditableSection && (item.user_id === null || item.user_id === undefined);
    
    return (
      <div
        key={item.id}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 group transition-colors"
      >
        <div className="flex items-center gap-3">
          {item.color && (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm text-foreground">{item.name}</span>
            {sectionKey === "subcategories" && item.category_id && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                {getCategoryName(item.category_id)}
              </span>
            )}
          </div>
        </div>
        {!isSystemItem && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEditDialog(sectionKey, item)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => confirmDelete(sectionKey, item.id, item.name)}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Section component
  const SectionWrapper = ({ 
    id, 
    title, 
    description, 
    children 
  }: { 
    id: string; 
    title: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div 
      ref={(el) => { sectionRefs.current[id] = el; }}
      className="scroll-mt-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {children}
      <Separator className="my-6" />
    </div>
  );

  // Config list section
  const ConfigListSection = ({ 
    sectionKey, 
    items, 
    isLoading,
    allowColor = false,
  }: { 
    sectionKey: string;
    items: ConfigItem[];
    isLoading: boolean;
    allowColor?: boolean;
  }) => (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => openAddDialog(sectionKey)}
        className="mb-3"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar
      </Button>
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhum item cadastrado.</p>
      ) : (
        items.map((item) => renderConfigItem(sectionKey, item))
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation - Desktop only */}
        {!isMobile && (
          <aside className="w-56 flex-shrink-0 border-r border-border bg-card/50">
            <ScrollArea className="h-full py-4">
              <nav className="px-3 space-y-1">
                {navSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground mt-1">
                Personalize bancos, categorias e preferências.
              </p>
            </div>

            {/* Mobile: Section selector */}
            {isMobile && (
              <div className="mb-6">
                <Select value={activeSection} onValueChange={scrollToSection}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {navSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        <div className="flex items-center gap-2">
                          <section.icon className="w-4 h-4" />
                          {section.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* General Section */}
            <SectionWrapper
              id="general"
              title="Geral"
              description="Informações gerais do aplicativo."
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Versão</p>
                  <p className="text-sm font-medium text-foreground">1.0.0</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última atualização</p>
                  <p className="text-sm font-medium text-foreground">Dezembro 2025</p>
                </div>
              </div>
            </SectionWrapper>

            {/* Personalization Section */}
            <SectionWrapper
              id="personalization"
              title="Personalização"
              description="Equipe temas e molduras de avatar desbloqueados."
            >
              <PersonalizationSection />
            </SectionWrapper>

            {/* People Section */}
            <SectionWrapper
              id="people"
              title="Pessoas"
              description="Gerencie as pessoas do casal. Clique no avatar para alterar a foto."
            >
              <div className="space-y-3">
                {coupleMembersLoading ? (
                  <p className="text-sm text-muted-foreground py-2">Carregando...</p>
                ) : coupleMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nenhuma pessoa cadastrada. Adicione as pessoas do casal.</p>
                ) : (
                  coupleMembers.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 group transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <AvatarUpload
                          name={person.name}
                          avatar={person.avatar_url}
                          memberId={person.id}
                          size="md"
                          editable={true}
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground">{person.name}</span>
                          <p className="text-xs text-muted-foreground">Pessoa {person.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Dashboard toggle */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`dashboard-${person.id}`} className="text-xs text-muted-foreground hidden sm:inline">
                            Dashboard
                          </Label>
                          <Switch
                            id={`dashboard-${person.id}`}
                            checked={person.show_on_dashboard}
                            onCheckedChange={async (checked) => {
                              try {
                                await updateCoupleMember.mutateAsync({ id: person.id, show_on_dashboard: checked });
                                toast({
                                  title: checked ? "Avatar será exibido no Dashboard" : "Avatar removido do Dashboard",
                                });
                              } catch (error) {
                                toast({ title: "Erro ao atualizar", variant: "destructive" });
                              }
                            }}
                          />
                        </div>
                        {/* Edit/Delete buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditPersonDialog(person)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeletePerson(person.id, person.name)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddPersonDialog}
                  className="mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pessoa
                </Button>
              </div>
            </SectionWrapper>

            {/* Split Settings Section */}
            <SectionWrapper
              id="split"
              title="Divisão de Despesas"
              description="Configure como as despesas do casal são divididas entre vocês."
            >
              <SplitSettingsSection />
            </SectionWrapper>

            {/* Banks Section */}
            <SectionWrapper
              id="banks"
              title="Bancos"
              description="Gerencie as instituições financeiras."
            >
              <ConfigListSection
                sectionKey="banks"
                items={banks.map((b) => ({ id: b.id, name: b.name, color: b.color, user_id: b.user_id }))}
                isLoading={banksLoading}
                allowColor
              />
            </SectionWrapper>

            {/* Payment Methods Section */}
            <SectionWrapper
              id="payment-methods"
              title="Formas de Pagamento"
              description="Configure as formas de pagamento disponíveis."
            >
              <ConfigListSection
                sectionKey="payment-methods"
                items={paymentMethods.map((p) => ({ id: p.id, name: p.name, user_id: p.user_id }))}
                isLoading={paymentMethodsLoading}
              />
            </SectionWrapper>

            {/* Recipients Section */}
            <SectionWrapper
              id="recipients"
              title="Para Quem"
              description="Destinatários de transferências e pagamentos."
            >
              <ConfigListSection
                sectionKey="recipients"
                items={recipients.map((r) => ({ id: r.id, name: r.name, user_id: r.user_id }))}
                isLoading={recipientsLoading}
              />
            </SectionWrapper>

            {/* Categories Section */}
            <SectionWrapper
              id="categories"
              title="Categorias"
              description="Organize suas transações por categorias."
            >
              <ConfigListSection
                sectionKey="categories"
                items={categories.map((c) => ({ id: c.id, name: c.name }))}
                isLoading={categoriesLoading}
              />
            </SectionWrapper>

            {/* Subcategories Section */}
            <SectionWrapper
              id="subcategories"
              title="Subcategorias"
              description="Detalhamento adicional para cada categoria."
            >
              <ConfigListSection
                sectionKey="subcategories"
                items={subcategories.map((s) => ({ id: s.id, name: s.name, category_id: s.category_id }))}
                isLoading={subcategoriesLoading}
              />
            </SectionWrapper>

            {/* Account Section */}
            <SectionWrapper
              id="account"
              title="Conta"
              description="Gerencie sua conta e dados."
            >
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
                </div>
                
                <Separator />
                
                <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-destructive mb-1">Zona de Perigo</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Excluir sua conta é uma ação permanente. Todos os seus dados serão apagados e não poderão ser recuperados.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteAccountConfirmOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir minha conta
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SectionWrapper>

          </div>
        </main>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Adicionar"}{" "}
              {editingSection && getSectionLabel(editingSection)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Digite o nome..."
              />
            </div>

            {editingSection === "banks" && (
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {editingSection === "subcategories" && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
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

      {/* People Add/Edit Dialog */}
      <Dialog open={isPeopleDialogOpen} onOpenChange={setIsPeopleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? "Editar Pessoa" : "Adicionar Pessoa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Digite o nome..."
                maxLength={50}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsPeopleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePerson} 
                disabled={!newPersonName.trim() || addCoupleMember.isPending || updateCoupleMember.isPending}
              >
                {addCoupleMember.isPending || updateCoupleMember.isPending ? "Salvando..." : editingPerson ? "Salvar" : "Adicionar"}
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

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteAccountConfirmOpen} onOpenChange={(open) => {
        setDeleteAccountConfirmOpen(open);
        if (!open) setDeleteAccountText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir conta permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente, incluindo:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Todas as transações</li>
                <li>Configurações de divisão</li>
                <li>Metas de economia</li>
                <li>Recorrências e contas agendadas</li>
                <li>Perfis do casal</li>
              </ul>
              <p className="pt-2">
                Para confirmar, digite <strong className="text-destructive">EXCLUIR</strong> abaixo:
              </p>
              <Input
                value={deleteAccountText}
                onChange={(e) => setDeleteAccountText(e.target.value)}
                placeholder="Digite EXCLUIR para confirmar"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteAccountText !== "EXCLUIR" || isDeletingAccount}
              onClick={async () => {
                setIsDeletingAccount(true);
                try {
                  // Delete all user data via Supabase RPC or cascading deletes
                  const userId = user?.id;
                  if (!userId) throw new Error("Usuário não autenticado");

                  // Delete user data in order (due to foreign key constraints)
                  // The order matters: children first, then parents
                  await supabase.from("itens_lancamento").delete().eq("user_id", userId);
                  await supabase.from("comprovantes_lancamento").delete().eq("user_id", userId);
                  await supabase.from("savings_deposits").delete().eq("user_id", userId);
                  await supabase.from("savings_goals").delete().eq("user_id", userId);
                  await supabase.from("contas_agendadas").delete().eq("user_id", userId);
                  await supabase.from("recorrencias").delete().eq("user_id", userId);
                  await supabase.from("category_splits").delete().eq("user_id", userId);
                  await supabase.from("category_budgets").delete().eq("user_id", userId);
                  await supabase.from("split_settings").delete().eq("user_id", userId);
                  await supabase.from("user_rewards").delete().eq("user_id", userId);
                  await supabase.from("user_challenges").delete().eq("user_id", userId);
                  await supabase.from("user_achievements").delete().eq("user_id", userId);
                  await supabase.from("user_gamification").delete().eq("user_id", userId);
                  await supabase.from("monthly_xp").delete().eq("user_id", userId);
                  await supabase.from("monthly_financial_rankings").delete().eq("user_id", userId);
                  await supabase.from("couple_members").delete().eq("user_id", userId);
                  await supabase.from("banks").delete().eq("user_id", userId);
                  await supabase.from("payment_methods").delete().eq("user_id", userId);
                  await supabase.from("recipients").delete().eq("user_id", userId);
                  await supabase.from("user_settings").delete().eq("user_id", userId);

                  // Transactions need account_id deletion - get account first
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("account_id")
                    .eq("id", userId)
                    .single();

                  if (profile?.account_id) {
                    await supabase.from("transactions").delete().eq("account_id", profile.account_id);
                    await supabase.from("account_members").delete().eq("account_id", profile.account_id);
                    await supabase.from("accounts").delete().eq("id", profile.account_id);
                  }

                  // Delete profile
                  await supabase.from("profiles").delete().eq("id", userId);

                  toast({
                    title: "Conta excluída",
                    description: "Sua conta foi excluída com sucesso. Você será redirecionado.",
                  });

                  // Sign out and redirect
                  await signOut();
                } catch (error: any) {
                  console.error("Error deleting account:", error);
                  toast({
                    title: "Erro ao excluir conta",
                    description: error?.message || "Não foi possível excluir sua conta. Tente novamente.",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeletingAccount(false);
                  setDeleteAccountConfirmOpen(false);
                }
              }}
            >
              {isDeletingAccount ? "Excluindo..." : "Excluir minha conta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
