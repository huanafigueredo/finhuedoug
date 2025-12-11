import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TransactionRow, Transaction } from "@/components/shared/TransactionRow";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Loader2, Calendar, Users, CreditCard, Tag, X, Heart } from "lucide-react";

import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCategories } from "@/hooks/useCategories";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

const persons = ["Todos", "Huana", "Douglas"];
const forWhoOptions = ["Todos", "Huana", "Douglas", "Casal", "Empresa"];
const types = ["Todos", "Receita", "Despesa"];
const coupleOptions = ["Todos", "Sim", "Não"];
const installmentOptions = ["Todos", "Sim", "Não"];

const days = ["Todos", ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"))];
const months = [
  { value: "Todos", label: "Todos" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function Transactions() {
  const { toast } = useToast();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useTransactions();
  const { data: banksData = [] } = useBanks();
  const { data: paymentMethodsData = [] } = usePaymentMethods();
  const { data: categoriesData = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("Todos");
  const [forWhoFilter, setForWhoFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [bankFilter, setBankFilter] = useState("Todos");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [coupleFilter, setCoupleFilter] = useState("Todos");
  const [installmentFilter, setInstallmentFilter] = useState("Todos");
  const currentDate = new Date();
  const [dayFilter, setDayFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState((currentDate.getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(currentDate.getFullYear().toString());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [transactionToDeleteInfo, setTransactionToDeleteInfo] = useState<{ isParent: boolean; description: string } | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [transactionToDuplicate, setTransactionToDuplicate] = useState<string | null>(null);
  const [duplicateIsInstallment, setDuplicateIsInstallment] = useState(false);
  const [newTransactionModalOpen, setNewTransactionModalOpen] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const [duplicateTransactionId, setDuplicateTransactionId] = useState<string | null>(null);

  // Transform DB transactions to UI format
  const transactions: (Transaction & { rawDate: Date })[] = transactionsData.map((t) => ({
    id: t.id,
    date: format(parseISO(t.date), "dd/MM/yyyy"),
    rawDate: parseISO(t.date),
    description: t.description,
    person: t.paid_by || "-",
    forWho: t.for_who || "-",
    category: t.category || "-",
    bank: t.bank_name || "-",
    paymentMethod: t.payment_method_name || "-",
    totalValue: Number(t.total_value),
    valuePerPerson: Number(t.value_per_person || t.total_value),
    isCouple: t.is_couple || false,
    type: t.type as "income" | "expense",
    isInstallment: t.is_installment || false,
    installmentNumber: t.installment_number || undefined,
    totalInstallments: t.total_installments || undefined,
  }));

  const banks = ["Todos", ...banksData.map((b) => b.name)];
  const paymentMethods = ["Todos", ...paymentMethodsData.map((p) => p.name)];
  const categories = ["Todas", ...categoriesData.map((c) => c.name)];
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const uniqueYears = [...new Set([currentYear, ...transactions.map((t) => t.rawDate.getFullYear())])];
    return ["Todos", ...uniqueYears.sort((a, b) => b - a).map(String)];
  }, [transactions]);

  const filteredTransactions = transactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (personFilter !== "Todos" && t.person !== personFilter) return false;
    if (forWhoFilter !== "Todos" && t.forWho !== forWhoFilter) return false;
    if (categoryFilter !== "Todas" && t.category !== categoryFilter) return false;
    if (bankFilter !== "Todos" && t.bank !== bankFilter) return false;
    if (paymentFilter !== "Todos" && t.paymentMethod !== paymentFilter) return false;
    if (typeFilter !== "Todos") {
      const isIncome = typeFilter === "Receita";
      if ((t.type === "income") !== isIncome) return false;
    }
    if (coupleFilter !== "Todos") {
      const isCouple = coupleFilter === "Sim";
      if (t.isCouple !== isCouple) return false;
    }
    if (installmentFilter !== "Todos") {
      const isInstallment = installmentFilter === "Sim";
      if (t.isInstallment !== isInstallment) return false;
    }
    if (dayFilter !== "Todos") {
      const day = t.rawDate.getDate().toString().padStart(2, "0");
      if (day !== dayFilter) return false;
    }
    if (monthFilter !== "Todos") {
      const month = (t.rawDate.getMonth() + 1).toString();
      if (month !== monthFilter) return false;
    }
    if (yearFilter !== "Todos") {
      const year = t.rawDate.getFullYear().toString();
      if (year !== yearFilter) return false;
    }
    return true;
  });

  // Count active filters
  const activeFilters = [
    search,
    personFilter !== "Todos" ? personFilter : null,
    forWhoFilter !== "Todos" ? forWhoFilter : null,
    categoryFilter !== "Todas" ? categoryFilter : null,
    bankFilter !== "Todos" ? bankFilter : null,
    paymentFilter !== "Todos" ? paymentFilter : null,
    typeFilter !== "Todos" ? typeFilter : null,
    coupleFilter !== "Todos" ? coupleFilter : null,
    installmentFilter !== "Todos" ? installmentFilter : null,
    dayFilter !== "Todos" ? dayFilter : null,
  ].filter(Boolean);

  const clearAllFilters = () => {
    setSearch("");
    setPersonFilter("Todos");
    setForWhoFilter("Todos");
    setCategoryFilter("Todas");
    setBankFilter("Todos");
    setPaymentFilter("Todos");
    setTypeFilter("Todos");
    setCoupleFilter("Todos");
    setInstallmentFilter("Todos");
    setDayFilter("Todos");
    setMonthFilter("Todos");
    setYearFilter("Todos");
  };

  const handleDeleteClick = (id: string) => {
    const tx = transactionsData.find((t) => t.id === id);
    if (tx) {
      const isParent = tx.is_installment && !tx.is_generated_installment;
      setTransactionToDeleteInfo({
        isParent: isParent || false,
        description: tx.description,
      });
    }
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction.mutateAsync(transactionToDelete);
      toast({
        title: "Lançamento excluído",
        description: transactionToDeleteInfo?.isParent
          ? "O lançamento e todas as parcelas foram excluídos."
          : "O lançamento foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o lançamento.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      setTransactionToDeleteInfo(null);
    }
  };

  const handleDuplicateClick = (id: string) => {
    const tx = transactionsData.find((t) => t.id === id);
    if (tx?.is_installment) {
      setTransactionToDuplicate(id);
      setDuplicateIsInstallment(true);
      setDuplicateDialogOpen(true);
    } else {
      setEditTransactionId(null);
      setDuplicateTransactionId(id);
      setNewTransactionModalOpen(true);
    }
  };

  const confirmDuplicate = () => {
    if (transactionToDuplicate) {
      setEditTransactionId(null);
      setDuplicateTransactionId(transactionToDuplicate);
      setNewTransactionModalOpen(true);
    }
    setDuplicateDialogOpen(false);
    setTransactionToDuplicate(null);
    setDuplicateIsInstallment(false);
  };

  const handleEditClick = (id: string) => {
    setDuplicateTransactionId(null);
    setEditTransactionId(id);
    setNewTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Lançamentos
              </h1>
              <p className="text-muted-foreground">
                Gerencie todas as transações do casal
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="gradient" size="sm" onClick={() => {
                setEditTransactionId(null);
                setDuplicateTransactionId(null);
                setNewTransactionModalOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
          </div>

          {/* Filters - Redesigned */}
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft mb-6">
            {/* Header with active filters count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-romantic flex items-center justify-center shadow-glow">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Filtros</span>
                  {activeFilters.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {activeFilters.length} ativo{activeFilters.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-primary">
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Search Bar - Full Width */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/30 border-primary/10 focus:border-primary focus:ring-primary text-base"
                />
              </div>
            </div>

            {/* Filter Groups */}
            <div className="space-y-6">
              {/* Row 1: Date Filters */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Período</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="border-primary/20 focus:ring-primary bg-white/50">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent className="border-primary/20">
                      {days.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="border-primary/20 focus:ring-primary bg-white/50">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="border-primary/20">
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="border-primary/20 focus:ring-primary bg-white/50">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent className="border-primary/20">
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Person & Payment */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Person Filters */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/5 to-lavender/5 border border-accent/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-accent uppercase tracking-wide">Pessoas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={personFilter} onValueChange={setPersonFilter}>
                      <SelectTrigger className="border-accent/20 focus:ring-accent bg-white/50">
                        <SelectValue placeholder="Pessoa" />
                      </SelectTrigger>
                      <SelectContent className="border-accent/20">
                        {persons.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={forWhoFilter} onValueChange={setForWhoFilter}>
                      <SelectTrigger className="border-accent/20 focus:ring-accent bg-white/50">
                        <SelectValue placeholder="Para Quem" />
                      </SelectTrigger>
                      <SelectContent className="border-accent/20">
                        {forWhoOptions.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Filters */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-success/5 to-emerald-400/5 border border-success/10">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-success" />
                    <span className="text-xs font-semibold text-success uppercase tracking-wide">Pagamento</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={bankFilter} onValueChange={setBankFilter}>
                      <SelectTrigger className="border-success/20 focus:ring-success bg-white/50">
                        <SelectValue placeholder="Banco" />
                      </SelectTrigger>
                      <SelectContent className="border-success/20">
                        {banks.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="border-success/20 focus:ring-success bg-white/50">
                        <SelectValue placeholder="Método" />
                      </SelectTrigger>
                      <SelectContent className="border-success/20">
                        {paymentMethods.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Row 3: Category & Type */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-lavender/5 to-mauve/5 border border-lavender/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-lavender" />
                    <span className="text-xs font-semibold text-lavender uppercase tracking-wide">Categorização</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="border-lavender/20 focus:ring-lavender bg-white/50">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent className="border-lavender/20">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={coupleFilter} onValueChange={setCoupleFilter}>
                      <SelectTrigger className="border-lavender/20 focus:ring-lavender bg-white/50">
                        <SelectValue placeholder="Casal?" />
                      </SelectTrigger>
                      <SelectContent className="border-lavender/20">
                        {coupleOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c === "Sim" && <Heart className="w-3 h-3 inline mr-1 text-primary" />}
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Type Filter */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-soft/50 to-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Tipo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="border-primary/20 focus:ring-primary bg-white/50">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="border-primary/20">
                        {types.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={installmentFilter} onValueChange={setInstallmentFilter}>
                      <SelectTrigger className="border-primary/20 focus:ring-primary bg-white/50">
                        <SelectValue placeholder="Parcelado?" />
                      </SelectTrigger>
                      <SelectContent className="border-primary/20">
                        {installmentOptions.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft overflow-hidden">
            {transactionsLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary/5 to-accent/5">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pessoa
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Banco
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Parcela
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Por Pessoa
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onDuplicate={handleDuplicateClick}
                      />
                    ))}
                  </tbody>
                  {filteredTransactions.length > 0 && (
                    <tfoot className="bg-gradient-to-r from-primary/5 to-accent/5 border-t border-primary/10">
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                          Total Despesas:
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-primary">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.totalValue, 0)
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                          Total Receitas:
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-success">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0)
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                      <tr className="border-t border-primary/10">
                        <td colSpan={7} className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                          Saldo:
                        </td>
                        <td className="px-4 py-4 text-sm font-bold">
                          {(() => {
                            const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0);
                            const expenses = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.totalValue, 0);
                            const balance = income - expenses;
                            return (
                              <span className={balance >= 0 ? "text-success" : "text-destructive"}>
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance)}
                              </span>
                            );
                          })()}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {!transactionsLoading && filteredTransactions.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum lançamento encontrado
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-primary/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {transactionToDeleteInfo?.isParent ? (
                <>
                  Este é um lançamento parcelado. <strong>Todas as parcelas serão excluídas.</strong>
                  <br /><br />
                  Deseja continuar?
                </>
              ) : (
                "Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
              )}
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

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent className="border-primary/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar lançamento parcelado?</AlertDialogTitle>
            <AlertDialogDescription>
              Este é um lançamento parcelado. Ao duplicar, <strong>todas as parcelas serão recriadas</strong> a partir da data atual.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDuplicate} className="bg-gradient-romantic text-white">
              Duplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction Form Modal */}
      <TransactionFormModal
        open={newTransactionModalOpen}
        onOpenChange={setNewTransactionModalOpen}
        editId={editTransactionId}
        duplicateId={duplicateTransactionId}
      />
    </div>
  );
}
