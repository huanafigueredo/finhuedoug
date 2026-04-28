import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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
  Loader2,
  Briefcase,
  User,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCoupleMembers, useAddCoupleMember, useUpdateCoupleMember, useDeleteCoupleMember } from "@/hooks/useCoupleMembers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { PersonalizationSection } from "@/components/settings/PersonalizationSection";
import { SplitSettingsSection } from "@/components/settings/SplitSettingsSection";
import { BanksSection } from "@/components/settings/BanksSection";
import { PaymentMethodsSection } from "@/components/settings/PaymentMethodsSection";
import { RecipientsSection } from "@/components/settings/RecipientsSection";
import { CategoriesSection } from "@/components/settings/CategoriesSection";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/settings/ColorPicker";

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
  { id: "account", label: "Conta", icon: LogOut },
];

export default function Settings() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("general");

  // Account Deletion State
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { user, signOut } = useAuth();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Couple members
  const { data: coupleMembers = [], isLoading: coupleMembersLoading } = useCoupleMembers();
  const addCoupleMember = useAddCoupleMember();
  const updateCoupleMember = useUpdateCoupleMember();
  const deleteCoupleMember = useDeleteCoupleMember();

  // People modal state
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<{ id: string; name: string; avatar_url: string | null; position: number; color: string | null; type: "person" | "business" } | null>(null);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonColor, setNewPersonColor] = useState("#3b82f6");
  const [newPersonType, setNewPersonType] = useState<"person" | "business">("person");
  const [deletePersonConfirmOpen, setDeletePersonConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{ id: string; name: string } | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer for Scroll Sync
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Don't update from observer if we are currently clicking to scroll
      if (isScrolling) return;

      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Find the entry that is highest on the screen
        const topEntry = visibleEntries.reduce((prev, current) => {
          return (prev.boundingClientRect.top < current.boundingClientRect.top) ? prev : current;
        });
        
        setActiveSection(topEntry.target.id);

        // Scroll the mobile nav to show the active tab
        if (isMobile) {
          const navItem = document.getElementById(`nav-item-${topEntry.target.id}`);
          const scrollArea = document.getElementById('settings-mobile-nav')?.querySelector('[data-radix-scroll-area-viewport]');
          if (navItem && scrollArea) {
            const navRect = navItem.getBoundingClientRect();
            const scrollRect = scrollArea.getBoundingClientRect();
            
            if (navRect.left < scrollRect.left || navRect.right > scrollRect.right) {
               navItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          }
        }
      }
    };

    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleIntersect, options);

    Object.values(sectionRefs.current).forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isMobile, isScrolling]);

  const openAddPersonDialog = () => {
    setEditingPerson(null);
    setNewPersonName("");
    setNewPersonColor("#3b82f6");
    setNewPersonType("person");
    setIsPeopleDialogOpen(true);
  };

  const openEditPersonDialog = (person: any) => {
    setEditingPerson(person);
    setNewPersonName(person.name);
    setNewPersonColor(person.color || "#3b82f6");
    setNewPersonType(person.type || "person");
    setIsPeopleDialogOpen(true);
  };

  const handleSavePerson = async () => {
    if (!newPersonName.trim()) return;

    try {
      if (editingPerson) {
        await updateCoupleMember.mutateAsync({
          id: editingPerson.id,
          name: newPersonName.trim(),
          color: newPersonColor,
          type: newPersonType
        });
        toast({ title: "Pessoa atualizada!", description: "Dados salvos com sucesso." });
      } else {
        await addCoupleMember.mutateAsync({
          name: newPersonName.trim(),
          color: newPersonColor,
          type: newPersonType
        });
        toast({ title: "Pessoa adicionada!", description: "Nova pessoa criada com sucesso." });
      }
      setIsPeopleDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const confirmDeletePerson = (id: string, name: string) => {
    setPersonToDelete({ id, name });
    setDeletePersonConfirmOpen(true);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;
    try {
      await deleteCoupleMember.mutateAsync(personToDelete.id);
      toast({ title: "Pessoa removida!" });
    } catch (error) {
      toast({ title: "Erro ao remover pessoa", variant: "destructive" });
    } finally {
      setDeletePersonConfirmOpen(false);
      setPersonToDelete(null);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsScrolling(true);
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    const element = sectionRefs.current[sectionId];
    if (element) {
      // Adjusted offset for sticky header
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Reset isScrolling after animation completes
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    }
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
      id={id}
      ref={(el) => { sectionRefs.current[id] = el; }}
      className="scroll-mt-[100px]"
    >
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {children}
      <Separator className="my-6" />
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

            {/* Mobile: Horizontal Tabs Navigation */}
            {isMobile && (
              <div className="mb-6 -mx-4 sticky top-0 bg-background/95 backdrop-blur z-20 py-2 border-b">
                <div className="relative w-full">
                  {/* Left fade indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                  
                  <ScrollArea id="settings-mobile-nav" className="w-full whitespace-nowrap px-4">
                    <div className="flex w-max space-x-2 p-1">
                      {navSections.map((section) => (
                        <button
                          key={section.id}
                          id={`nav-item-${section.id}`}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                            activeSection === section.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <section.icon className="w-4 h-4" />
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Right fade indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                </div>
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
                  <p className="text-sm font-medium text-foreground">Janeiro 2026</p>
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
              description="Gerencie as pessoas do casal."
            >
              <div className="space-y-3">
                {coupleMembersLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-16 w-full bg-muted/30 rounded-lg animate-pulse" />)}
                  </div>
                ) : coupleMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nenhuma pessoa cadastrada.</p>
                ) : (
                  coupleMembers.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => openEditPersonDialog(person)}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="relative p-0.5 rounded-full"
                          style={{ background: person.color || 'transparent' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-background rounded-full p-0.5">
                            <AvatarUpload
                              name={person.name}
                              avatar={person.avatar_url}
                              memberId={person.id}
                              size="md"
                              editable={true}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{person.name}</span>
                            {person.type === 'business' && (
                              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Dashboard toggle */}
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Label htmlFor={`dashboard-${person.id}`} className="text-xs text-muted-foreground cursor-pointer">
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPersonDialog(person);
                            }}
                            className="p-2 sm:p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeletePerson(person.id, person.name);
                            }}
                            className="p-2 sm:p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ml-2 sm:ml-0"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
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
              <BanksSection />
            </SectionWrapper>

            {/* Payment Methods Section */}
            <SectionWrapper
              id="payment-methods"
              title="Formas de Pagamento"
              description="Configure as formas de pagamento disponíveis."
            >
              <PaymentMethodsSection />
            </SectionWrapper>

            {/* Recipients Section */}
            <SectionWrapper
              id="recipients"
              title="Para Quem"
              description="Destinatários de transferências e pagamentos."
            >
              <RecipientsSection />
            </SectionWrapper>

            {/* Categories Section */}
            <SectionWrapper
              id="categories"
              title="Categorias e Subcategorias"
              description="Organize suas transações por categorias."
            >
              <CategoriesSection />
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
                        Excluir sua conta é uma ação permanente. Todos os seus dados serão apagados.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteAccountConfirmOpen(true)}
                        className="w-full sm:w-auto"
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

      {/* People Add/Edit Dialog */}
      <Dialog open={isPeopleDialogOpen} onOpenChange={setIsPeopleDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? "Editar Pessoa" : "Adicionar Pessoa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">

            {/* Type Selector */}
            <div className="space-y-3">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setNewPersonType("person")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                    newPersonType === "person"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted bg-card text-muted-foreground"
                  )}
                >
                  <User className={cn("w-6 h-6", newPersonType === "person" ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">Pessoa</span>
                </div>

                <div
                  onClick={() => setNewPersonType("business")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                    newPersonType === "business"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted bg-card text-muted-foreground"
                  )}
                >
                  <Briefcase className={cn("w-6 h-6", newPersonType === "business" ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">Entidade / Projeto</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Digite o nome..."
                maxLength={50}
              />
            </div>

            <ColorPicker color={newPersonColor} onChange={setNewPersonColor} label="Cor de Identificação" />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsPeopleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSavePerson}
                disabled={!newPersonName.trim() || addCoupleMember.isPending || updateCoupleMember.isPending}
              >
                {addCoupleMember.isPending || updateCoupleMember.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingPerson ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Person Delete Confirmation */}
      <AlertDialog open={deletePersonConfirmOpen} onOpenChange={setDeletePersonConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{personToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-destructive hover:bg-destructive/90"
            >
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
                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente.
              </p>
              <p className="pt-2">
                Para confirmar, digite <strong className="text-destructive">EXCLUIR</strong> abaixo:
              </p>
              <Input
                value={deleteAccountText}
                onChange={(e) => setDeleteAccountText(e.target.value)}
                placeholder="Digite EXCLUIR para confirmar"
                className="mt-2"
                autoCapitalize="characters"
                inputMode="text"
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
                  const { error } = await supabase.rpc('delete_user_account');

                  if (error) throw error;

                  toast({
                    title: "Conta excluída",
                    description: "Sua conta foi excluída com sucesso. Você será redirecionado.",
                  });

                  await signOut();
                } catch (error: any) {
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
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir minha conta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
