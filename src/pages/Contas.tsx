import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Pencil,
  Trash2,
  Play,
  Pause,
  Clock,
} from "lucide-react";
import { useRecorrencias, useRecorrenciasMutations } from "@/hooks/useRecorrencias";
import { useContasAgendadas, useContasAgendadasMutations, ContaAgendada } from "@/hooks/useContasAgendadas";
import { RecorrenciaFormModal } from "@/components/RecorrenciaFormModal";
import { ConfirmarPagamentoModal } from "@/components/ConfirmarPagamentoModal";
import { format, parseISO, differenceInDays, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

function getUrgencyBadge(dataVencimento: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseISO(dataVencimento);
  const diff = differenceInDays(dueDate, today);

  if (diff < 0) {
    return { label: "Atrasada", variant: "destructive" as const };
  }
  if (diff === 0) {
    return { label: "Vence hoje", variant: "destructive" as const };
  }
  if (diff === 1) {
    return { label: "Vence amanhã", variant: "default" as const };
  }
  if (diff <= 3) {
    return { label: `Vence em ${diff} dias`, variant: "secondary" as const };
  }
  if (diff <= 7) {
    return { label: `Vence em ${diff} dias`, variant: "outline" as const };
  }
  return null;
}

export default function Contas() {
  const [activeTab, setActiveTab] = useState("a-vencer");
  const [recorrenciaModalOpen, setRecorrenciaModalOpen] = useState(false);
  const [editingRecorrencia, setEditingRecorrencia] = useState<any>(null);
  const [confirmarModalOpen, setConfirmarModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaAgendada | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: recorrencias = [], isLoading: loadingRecorrencias } = useRecorrencias();
  const { data: contasAgendadas = [], isLoading: loadingContas } = useContasAgendadas("pendente");
  const { deleteRecorrencia, toggleRecorrencia } = useRecorrenciasMutations();
  const { ignorarConta } = useContasAgendadasMutations();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEditRecorrencia = (recorrencia: any) => {
    setEditingRecorrencia(recorrencia);
    setRecorrenciaModalOpen(true);
  };

  const handleDeleteRecorrencia = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteRecorrencia.mutateAsync(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleConfirmarPagamento = (conta: ContaAgendada) => {
    setSelectedConta(conta);
    setConfirmarModalOpen(true);
  };

  const handleIgnorar = async (contaId: string) => {
    await ignorarConta.mutateAsync(contaId);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Contas
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas contas recorrentes e acompanhe vencimentos
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="a-vencer" className="gap-2">
                <Calendar className="w-4 h-4" />
                A Vencer
                {contasAgendadas.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                    {contasAgendadas.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="recorrentes" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Recorrentes
              </TabsTrigger>
            </TabsList>

            {/* Tab: A Vencer */}
            <TabsContent value="a-vencer" className="space-y-4">
              {loadingContas ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando...
                </div>
              ) : contasAgendadas.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Nenhuma conta pendente
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Suas contas aparecerão aqui conforme os vencimentos se aproximam.
                  </p>
                  <Button onClick={() => setActiveTab("recorrentes")}>
                    Criar recorrência
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contasAgendadas.map((conta) => {
                    const urgency = getUrgencyBadge(conta.data_vencimento);
                    const recorrencia = conta.recorrencia;

                    return (
                      <div
                        key={conta.id}
                        className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">
                                {recorrencia?.titulo}
                              </h3>
                              <Badge variant="outline">Em aberto</Badge>
                              {urgency && (
                                <Badge variant={urgency.variant}>{urgency.label}</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(parseISO(conta.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span>•</span>
                              <span>{conta.competencia}</span>
                              {recorrencia?.pessoa && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{recorrencia.pessoa}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-foreground">
                              {formatCurrency(conta.valor)}
                            </span>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIgnorar(conta.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Ignorar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmarPagamento(conta)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Recorrentes */}
            <TabsContent value="recorrentes" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingRecorrencia(null);
                    setRecorrenciaModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Recorrência
                </Button>
              </div>

              {loadingRecorrencias ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando...
                </div>
              ) : recorrencias.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Nenhuma recorrência cadastrada
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crie recorrências para acompanhar suas contas mensais.
                  </p>
                  <Button
                    onClick={() => {
                      setEditingRecorrencia(null);
                      setRecorrenciaModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira recorrência
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recorrencias.map((recorrencia) => (
                    <div
                      key={recorrencia.id}
                      className={cn(
                        "p-4 rounded-xl bg-card border border-border shadow-card",
                        !recorrencia.ativo && "opacity-60"
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {recorrencia.titulo}
                            </h3>
                            <Badge variant={recorrencia.tipo === "expense" ? "destructive" : "default"}>
                              {recorrencia.tipo === "expense" ? "Despesa" : "Receita"}
                            </Badge>
                            {!recorrencia.ativo && (
                              <Badge variant="secondary">Pausada</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Dia {recorrencia.dia_vencimento}
                            </span>
                            <span>•</span>
                            <span>{formatCurrency(recorrencia.valor_padrao)}</span>
                            {recorrencia.pessoa && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{recorrencia.pessoa}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleRecorrencia.mutate({ id: recorrencia.id, ativo: !recorrencia.ativo })}
                          >
                            {recorrencia.ativo ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRecorrencia(recorrencia)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRecorrencia(recorrencia.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <RecorrenciaFormModal
        open={recorrenciaModalOpen}
        onOpenChange={setRecorrenciaModalOpen}
        recorrencia={editingRecorrencia}
      />

      <ConfirmarPagamentoModal
        open={confirmarModalOpen}
        onOpenChange={setConfirmarModalOpen}
        conta={selectedConta}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá excluir todas as contas pendentes associadas a esta recorrência.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
