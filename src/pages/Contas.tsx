import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRecorrencias, useRecorrenciasMutations, Recorrencia } from "@/hooks/useRecorrencias";
import { 
  useContasAgendadas, 
  useContasAgendadasMutations, 
  useContasHistorico,
  ContaAgendada 
} from "@/hooks/useContasAgendadas";
import { usePersonNames } from "@/hooks/useUserSettings";
import { RecorrenciaFormModal } from "@/components/RecorrenciaFormModal";
import { ConfirmarPagamentoModal } from "@/components/ConfirmarPagamentoModal";
import { ContasHeroCard } from "@/components/contas/ContasHeroCard";
import { ContaCard } from "@/components/contas/ContaCard";
import { RecorrenciaCard } from "@/components/contas/RecorrenciaCard";
import { ContasFilters } from "@/components/contas/ContasFilters";
import { HistoricoList } from "@/components/contas/HistoricoList";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
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

export default function Contas() {
  const isMobile = useIsMobile();
  const currentDate = new Date();

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedPerson, setSelectedPerson] = useState("todos");

  // Modal/dialog state
  const [activeTab, setActiveTab] = useState("a-vencer");
  const [recorrenciaModalOpen, setRecorrenciaModalOpen] = useState(false);
  const [editingRecorrencia, setEditingRecorrencia] = useState<Recorrencia | null>(null);
  const [confirmarModalOpen, setConfirmarModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaAgendada | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Data fetching
  const { data: recorrencias = [], isLoading: loadingRecorrencias } = useRecorrencias();
  const { data: contasAgendadas = [], isLoading: loadingContas } = useContasAgendadas("pendente");
  const { data: contasHistorico = [], isLoading: loadingHistorico } = useContasHistorico(selectedMonth, selectedYear);
  const { deleteRecorrencia, toggleRecorrencia } = useRecorrenciasMutations();
  const { ignorarConta } = useContasAgendadasMutations();
  const { person1, person2 } = usePersonNames();

  const personOptions = [person1, person2, "Casal"].filter(Boolean);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filter contas by selected month/year and person
  const filteredContas = useMemo(() => {
    const competencia = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    
    return contasAgendadas.filter((conta) => {
      const matchesCompetencia = conta.competencia === competencia;
      const matchesPerson = selectedPerson === "todos" || 
        conta.recorrencia?.pessoa?.toLowerCase() === selectedPerson.toLowerCase();
      return matchesCompetencia && matchesPerson;
    });
  }, [contasAgendadas, selectedMonth, selectedYear, selectedPerson]);

  // Filter historico by person
  const filteredHistorico = useMemo(() => {
    if (selectedPerson === "todos") return contasHistorico;
    return contasHistorico.filter(
      (c) => c.recorrencia?.pessoa?.toLowerCase() === selectedPerson.toLowerCase()
    );
  }, [contasHistorico, selectedPerson]);

  // Group contas by urgency
  const groupedContas = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const atrasadas: ContaAgendada[] = [];
    const hoje: ContaAgendada[] = [];
    const estaSemana: ContaAgendada[] = [];
    const esteMes: ContaAgendada[] = [];

    filteredContas.forEach((conta) => {
      const dueDate = parseISO(conta.data_vencimento);
      const diff = differenceInDays(dueDate, today);

      if (diff < 0) {
        atrasadas.push(conta);
      } else if (diff === 0) {
        hoje.push(conta);
      } else if (diff <= 7) {
        estaSemana.push(conta);
      } else {
        esteMes.push(conta);
      }
    });

    return { atrasadas, hoje, estaSemana, esteMes };
  }, [filteredContas]);

  // Calculate hero card metrics
  const heroMetrics = useMemo(() => {
    const totalPendente = filteredContas.reduce((sum, c) => sum + c.valor, 0);
    const totalPago = filteredHistorico
      .filter((c) => c.status === "confirmado")
      .reduce((sum, c) => sum + c.valor, 0);

    // Find next due
    const proximaConta = filteredContas.length > 0 
      ? filteredContas.reduce((nearest, conta) => {
          const nearestDate = parseISO(nearest.data_vencimento);
          const contaDate = parseISO(conta.data_vencimento);
          return contaDate < nearestDate ? conta : nearest;
        })
      : null;

    const proximoVencimento = proximaConta ? {
      titulo: proximaConta.recorrencia?.titulo || "Conta",
      data: format(parseISO(proximaConta.data_vencimento), "dd MMM", { locale: ptBR }),
      valor: proximaConta.valor,
    } : null;

    const temAtrasadas = groupedContas.atrasadas.length > 0;

    return { totalPendente, totalPago, proximoVencimento, temAtrasadas };
  }, [filteredContas, filteredHistorico, groupedContas]);

  // Handlers
  const handleEditRecorrencia = (recorrencia: Recorrencia) => {
    setEditingRecorrencia(recorrencia);
    setRecorrenciaModalOpen(true);
  };

  const handleDeleteRecorrencia = (recorrencia: Recorrencia) => {
    setDeletingId(recorrencia.id);
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

  const handleIgnorar = async (conta: ContaAgendada) => {
    await ignorarConta.mutateAsync(conta.id);
  };

  const handleToggleRecorrencia = (recorrencia: Recorrencia) => {
    toggleRecorrencia.mutate({ id: recorrencia.id, ativo: !recorrencia.ativo });
  };

  const ContasGroup = ({ 
    title, 
    contas, 
    startIndex = 0 
  }: { 
    title: string; 
    contas: ContaAgendada[];
    startIndex?: number;
  }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {contas.map((conta, index) => (
        <ContaCard
          key={conta.id}
          conta={conta}
          formatCurrency={formatCurrency}
          onConfirmar={handleConfirmarPagamento}
          onIgnorar={handleIgnorar}
          index={startIndex + index}
        />
      ))}
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            📅 Contas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas contas recorrentes
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ContasFilters
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedPerson={selectedPerson}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onPersonChange={setSelectedPerson}
            personOptions={personOptions}
          />
        </div>

        {/* Hero Card */}
        <div className="mb-6">
          <ContasHeroCard
            totalPendente={heroMetrics.totalPendente}
            totalPago={heroMetrics.totalPago}
            proximoVencimento={heroMetrics.proximoVencimento}
            temAtrasadas={heroMetrics.temAtrasadas}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="a-vencer" className="text-xs md:text-sm">
              📅 A Vencer
              {filteredContas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {filteredContas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recorrentes" className="text-xs md:text-sm">
              🔄 Recorrentes
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs md:text-sm">
              📋 Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: A Vencer */}
          <TabsContent value="a-vencer" className="space-y-6">
            {loadingContas ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredContas.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">✨</span>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Nenhuma conta pendente
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Todas as contas deste mês estão em dia!
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("recorrentes")}
                >
                  Ver recorrências
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedContas.atrasadas.length > 0 && (
                  <ContasGroup 
                    title="🚨 Atrasadas" 
                    contas={groupedContas.atrasadas} 
                    startIndex={0}
                  />
                )}
                {groupedContas.hoje.length > 0 && (
                  <ContasGroup 
                    title="⚠️ Vence Hoje" 
                    contas={groupedContas.hoje}
                    startIndex={groupedContas.atrasadas.length}
                  />
                )}
                {groupedContas.estaSemana.length > 0 && (
                  <ContasGroup 
                    title="📆 Esta Semana" 
                    contas={groupedContas.estaSemana}
                    startIndex={groupedContas.atrasadas.length + groupedContas.hoje.length}
                  />
                )}
                {groupedContas.esteMes.length > 0 && (
                  <ContasGroup 
                    title="📅 Este Mês" 
                    contas={groupedContas.esteMes}
                    startIndex={
                      groupedContas.atrasadas.length + 
                      groupedContas.hoje.length + 
                      groupedContas.estaSemana.length
                    }
                  />
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab: Recorrentes */}
          <TabsContent value="recorrentes" className="space-y-4">
            {!isMobile && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingRecorrencia(null);
                    setRecorrenciaModalOpen(true);
                  }}
                >
                  ➕ Nova Recorrência
                </Button>
              </div>
            )}

            {loadingRecorrencias ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando...
              </div>
            ) : recorrencias.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">🔄</span>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Nenhuma recorrência
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Crie recorrências para acompanhar suas contas mensais.
                </p>
                <Button
                  onClick={() => {
                    setEditingRecorrencia(null);
                    setRecorrenciaModalOpen(true);
                  }}
                >
                  ➕ Criar primeira recorrência
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recorrencias.map((recorrencia, index) => (
                  <RecorrenciaCard
                    key={recorrencia.id}
                    recorrencia={recorrencia}
                    formatCurrency={formatCurrency}
                    onEdit={handleEditRecorrencia}
                    onToggle={handleToggleRecorrencia}
                    onDelete={handleDeleteRecorrencia}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico">
            {loadingHistorico ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <HistoricoList
                contas={filteredHistorico}
                formatCurrency={formatCurrency}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB Mobile */}
      {isMobile && activeTab === "recorrentes" && (
        <button
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform z-50"
          onClick={() => {
            setEditingRecorrencia(null);
            setRecorrenciaModalOpen(true);
          }}
        >
          ➕
        </button>
      )}

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
            <AlertDialogTitle>🗑️ Excluir recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá excluir todas as contas pendentes associadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
