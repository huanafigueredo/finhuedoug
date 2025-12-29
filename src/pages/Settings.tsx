import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  ChevronDown,
  UserCircle,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";
import { useBanks, useAddBank, useUpdateBank, useDeleteBank } from "@/hooks/useBanks";
import { usePaymentMethods, useAddPaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePaymentMethods";
import { useRecipients, useAddRecipient, useUpdateRecipient, useDeleteRecipient } from "@/hooks/useRecipients";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategoriesMutations";
import { useAddSubcategory, useUpdateSubcategory, useDeleteSubcategory } from "@/hooks/useSubcategoriesMutations";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConfigItem {
  id: string;
  name: string;
  color?: string | null;
  category_id?: string;
}

// Sidebar navigation items
const navSections = [
  { id: "general", label: "Geral", icon: SettingsIcon, hasSubmenu: false },
  { id: "people", label: "Pessoas", icon: UserCircle, hasSubmenu: false },
  { id: "banks", label: "Bancos", icon: CreditCard, hasSubmenu: true },
  { id: "payment-methods", label: "Formas de Pagamento", icon: Wallet, hasSubmenu: true },
  { id: "recipients", label: "Para Quem", icon: Users, hasSubmenu: true },
  { id: "categories", label: "Categorias", icon: Folder, hasSubmenu: true },
  { id: "subcategories", label: "Subcategorias", icon: Tag, hasSubmenu: true },
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

  // Section refs for scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // User settings for editable names
  const { data: userSettings, isLoading: settingsLoading } = useUserSettings();
  const updateUserSettings = useUpdateUserSettings();
  const [person1Name, setPerson1Name] = useState("Huana");
  const [person2Name, setPerson2Name] = useState("Douglas");

  // Sync person names with settings
  useEffect(() => {
    if (userSettings) {
      setPerson1Name(userSettings.person_1_name || "Huana");
      setPerson2Name(userSettings.person_2_name || "Douglas");
    }
  }, [userSettings]);

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

  const handleSaveNames = async () => {
    try {
      await updateUserSettings.mutateAsync({
        person_1_name: person1Name.trim() || "Huana",
        person_2_name: person2Name.trim() || "Douglas",
      });
      toast({
        title: "Nomes atualizados!",
        description: "Os nomes foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar os nomes.",
        variant: "destructive",
      });
    }
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
      if (section === "banks") {
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
      case "banks": return "Bancos";
      case "payment-methods": return "Formas de Pagamento";
      case "recipients": return "Para Quem";
      case "categories": return "Categorias";
      case "subcategories": return "Subcategorias";
      default: return "";
    }
  };

  // Render a config item for SIDEBAR submenu (compact)
  const renderSidebarConfigItem = (sectionKey: string, item: ConfigItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 group transition-colors text-xs"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {item.color && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
        )}
        <span className="truncate text-muted-foreground">{item.name}</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); openEditDialog(sectionKey, item); }}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); confirmDelete(sectionKey, item.id, item.name); }}
          className="p-1 rounded hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </button>
      </div>
    </div>
  );

  // Render a config item for MAIN content area
  const renderConfigItem = (sectionKey: string, item: ConfigItem) => (
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
    </div>
  );

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

  // Config list section for MAIN content
  const ConfigListSection = ({ 
    sectionKey, 
    items, 
    isLoading,
  }: { 
    sectionKey: string;
    items: ConfigItem[];
    isLoading: boolean;
  }) => (
    <div className="space-y-1">
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhum item cadastrado.</p>
      ) : (
        items.map((item) => renderConfigItem(sectionKey, item))
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => openAddDialog(sectionKey)}
        className="mt-3"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );

  // Get items for a section
  const getSectionItems = (sectionId: string): { items: ConfigItem[]; isLoading: boolean } => {
    switch (sectionId) {
      case "banks":
        return { items: banks.map((b) => ({ id: b.id, name: b.name, color: b.color })), isLoading: banksLoading };
      case "payment-methods":
        return { items: paymentMethods.map((p) => ({ id: p.id, name: p.name })), isLoading: paymentMethodsLoading };
      case "recipients":
        return { items: recipients.map((r) => ({ id: r.id, name: r.name })), isLoading: recipientsLoading };
      case "categories":
        return { items: categories.map((c) => ({ id: c.id, name: c.name })), isLoading: categoriesLoading };
      case "subcategories":
        return { items: subcategories.map((s) => ({ id: s.id, name: s.name, category_id: s.category_id })), isLoading: subcategoriesLoading };
      default:
        return { items: [], isLoading: false };
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation - Desktop only */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50">
            <ScrollArea className="h-full py-4">
              <nav className="px-3 space-y-1">
                {navSections.map((section) => {
                  const isActive = activeSection === section.id;
                  const sectionData = section.hasSubmenu ? getSectionItems(section.id) : null;
                  
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="w-4 h-4" />
                          {section.label}
                        </div>
                        {section.hasSubmenu && (
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isActive ? "rotate-0" : "-rotate-90"
                          )} />
                        )}
                      </button>
                      
                      {/* Submenu with items */}
                      {section.hasSubmenu && isActive && sectionData && (
                        <div className="ml-4 mt-1 pl-3 border-l border-border/50 space-y-0.5 animate-fade-up">
                          {sectionData.isLoading ? (
                            <p className="text-xs text-muted-foreground py-1 px-2">Carregando...</p>
                          ) : sectionData.items.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1 px-2">Nenhum item</p>
                          ) : (
                            sectionData.items.map((item) => renderSidebarConfigItem(section.id, item))
                          )}
                          <button
                            onClick={() => openAddDialog(section.id)}
                            className="flex items-center gap-2 py-1.5 px-2 text-xs text-primary hover:bg-primary/5 rounded-md w-full transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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

            {/* Mobile: Section navigation */}
            {isMobile && (
              <div className="mb-6 space-y-1">
                {navSections.map((section) => {
                  const isActive = activeSection === section.id;
                  const sectionData = section.hasSubmenu ? getSectionItems(section.id) : null;
                  
                  return (
                    <div key={section.id} className="bg-card rounded-lg border border-border">
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left",
                          isActive
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="w-4 h-4" />
                          {section.label}
                        </div>
                        {section.hasSubmenu && (
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isActive ? "rotate-0" : "-rotate-90"
                          )} />
                        )}
                      </button>
                      
                      {/* Submenu with items */}
                      {section.hasSubmenu && isActive && sectionData && (
                        <div className="px-4 pb-3 space-y-0.5 animate-fade-up">
                          {sectionData.isLoading ? (
                            <p className="text-xs text-muted-foreground py-1 px-2">Carregando...</p>
                          ) : sectionData.items.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1 px-2">Nenhum item</p>
                          ) : (
                            sectionData.items.map((item) => renderSidebarConfigItem(section.id, item))
                          )}
                          <button
                            onClick={() => openAddDialog(section.id)}
                            className="flex items-center gap-2 py-2 px-2 text-xs text-primary hover:bg-primary/5 rounded-md w-full transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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

            {/* People Section */}
            <SectionWrapper
              id="people"
              title="Pessoas"
              description="Personalize os nomes usados nos lançamentos e relatórios."
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pessoa 1</Label>
                  <Input
                    value={person1Name}
                    onChange={(e) => setPerson1Name(e.target.value)}
                    placeholder="Nome da pessoa 1"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pessoa 2</Label>
                  <Input
                    value={person2Name}
                    onChange={(e) => setPerson2Name(e.target.value)}
                    placeholder="Nome da pessoa 2"
                    maxLength={50}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveNames}
                disabled={updateUserSettings.isPending}
                className="mt-4"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateUserSettings.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </SectionWrapper>

            {/* Banks Section */}
            <SectionWrapper
              id="banks"
              title="Bancos"
              description="Gerencie as instituições financeiras."
            >
              <ConfigListSection
                sectionKey="banks"
                items={banks.map((b) => ({ id: b.id, name: b.name, color: b.color }))}
                isLoading={banksLoading}
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
                items={paymentMethods.map((p) => ({ id: p.id, name: p.name }))}
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
                items={recipients.map((r) => ({ id: r.id, name: r.name }))}
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
    </AppLayout>
  );
}
