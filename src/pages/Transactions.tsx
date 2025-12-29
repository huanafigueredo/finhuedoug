import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TransactionRow, Transaction } from "@/components/shared/TransactionRow";
import { TransactionCard } from "@/components/shared/TransactionCard";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionDetailsDialog, TransactionDetails } from "@/components/TransactionDetailsDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCategories } from "@/hooks/useCategories";
import { format, parseISO, differenceInMonths, addMonths } from "date-fns";
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

// Helper function to calculate installment info for a given filter month/year
function calculateInstallmentForMonth(
  firstInstallmentDate: Date,
  startInstallment: number,
  totalInstallments: number,
  filterMonth: number,
  filterYear: number
): { currentInstallment: number; isInRange: boolean } | null {
  // Calculate the month/year of the first installment
  const firstMonth = firstInstallmentDate.getMonth() + 1;
  const firstYear = firstInstallmentDate.getFullYear();
  
  // Calculate how many months from first installment to filter date
  const filterDate = new Date(filterYear, filterMonth - 1, 1);
  const firstDate = new Date(firstYear, firstMonth - 1, 1);
  const monthsDiff = differenceInMonths(filterDate, firstDate);
  
  // Calculate the installment number for this month
  const currentInstallment = startInstallment + monthsDiff;
  
  // Check if this installment is within the valid range
  const isInRange = currentInstallment >= startInstallment && currentInstallment <= totalInstallments;
  
  return { currentInstallment, isInRange };
}

export default function Transactions() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<TransactionDetails | null>(null);

  const banks = ["Todos", ...banksData.map((b) => b.name)];
  const paymentMethods = ["Todos", ...paymentMethodsData.map((p) => p.name)];
  const categories = ["Todas", ...categoriesData.map((c) => c.name)];

// Transform and filter transactions with dynamic installment calculation
  const filteredTransactions = useMemo(() => {
    const filterMonthNum = monthFilter !== "Todos" ? parseInt(monthFilter) : null;
    const filterYearNum = yearFilter !== "Todos" ? parseInt(yearFilter) : null;

    return transactionsData
      .map((t) => {
        const rawDate = parseISO(t.date);
        
        // New-style: single record for installment, calculate dynamically
        // installment_number = parcela inicial (onde começou)
        const isNewStyleInstallment = t.is_installment && 
          !t.is_generated_installment && 
          !t.parent_transaction_id &&
          t.total_installments && 
          t.total_installments > 1;

        // For new-style installments (single record), calculate dynamic installment
        if (isNewStyleInstallment && filterMonthNum && filterYearNum) {
          const startInstallment = t.installment_number || 1;
          const result = calculateInstallmentForMonth(
            rawDate,
            startInstallment,
            t.total_installments!,
            filterMonthNum,
            filterYearNum
          );

          if (!result || !result.isInRange) {
            return null; // This installment doesn't appear in this month
          }

          // Calculate the date for this specific installment
          const monthsFromStart = result.currentInstallment - startInstallment;
          const installmentDate = addMonths(rawDate, monthsFromStart);
          
          // For table display: use installment value as the "main" value
          const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.total_value) / t.total_installments!;
          const valuePerPerson = t.is_couple ? installmentValue / 2 : installmentValue;

          return {
            id: t.id,
            date: format(installmentDate, "dd/MM/yyyy"),
            rawDate: installmentDate,
            description: t.description,
            observacao: t.observacao,
            person: t.paid_by || "-",
            forWho: t.for_who || "-",
            category: t.category || "-",
            subcategory: t.subcategory || "-",
            bank: t.bank_name || "-",
            paymentMethod: t.payment_method_name || "-",
            // For new-style, totalValue in table = installment value (what shows in the month)
            totalValue: installmentValue,
            valuePerPerson: valuePerPerson,
            isCouple: t.is_couple || false,
            type: t.type as "income" | "expense",
            isInstallment: true,
            installmentNumber: result.currentInstallment,
            totalInstallments: t.total_installments,
            // Keep real total for details dialog
            realTotalValue: Number(t.total_value),
            installmentValue: installmentValue,
            tags: t.tags || [],
            resumo_curto: t.resumo_curto || undefined,
            status_extracao: t.status_extracao || undefined,
            isNewStyleInstallment: true,
            // Store first installment date for details dialog
            firstInstallmentDate: rawDate,
            startInstallment: startInstallment,
          };
        }

        // For old-style installments (multiple records) or non-installments
        return {
          id: t.id,
          date: format(rawDate, "dd/MM/yyyy"),
          rawDate,
          description: t.description,
          observacao: t.observacao,
          person: t.paid_by || "-",
          forWho: t.for_who || "-",
          category: t.category || "-",
          subcategory: t.subcategory || "-",
          bank: t.bank_name || "-",
          paymentMethod: t.payment_method_name || "-",
          totalValue: Number(t.total_value),
          valuePerPerson: Number(t.value_per_person || t.total_value),
          isCouple: t.is_couple || false,
          type: t.type as "income" | "expense",
          isInstallment: t.is_installment || false,
          installmentNumber: t.installment_number || undefined,
          totalInstallments: t.total_installments || undefined,
          installmentValue: t.installment_value ? Number(t.installment_value) : undefined,
          realTotalValue: Number(t.total_value),
          tags: t.tags || [],
          resumo_curto: t.resumo_curto || undefined,
          status_extracao: t.status_extracao || undefined,
          isNewStyleInstallment: false,
          firstInstallmentDate: undefined,
          startInstallment: undefined,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .filter((t) => {
        // Apply other filters
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

        // Date filters - for new-style installments, date is already calculated
        // For old-style, filter by rawDate
        if (!t.isNewStyleInstallment) {
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
        } else {
          // For new-style, just check day filter (month/year already handled)
          if (dayFilter !== "Todos") {
            const day = t.rawDate.getDate().toString().padStart(2, "0");
            if (day !== dayFilter) return false;
          }
        }

        return true;
      });
  }, [transactionsData, search, personFilter, forWhoFilter, categoryFilter, bankFilter, paymentFilter, typeFilter, coupleFilter, installmentFilter, dayFilter, monthFilter, yearFilter]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const allYears = transactionsData.flatMap((t) => {
      const date = parseISO(t.date);
      if (t.is_installment && t.total_installments && !t.is_generated_installment) {
        // For installments, include all years the installment spans
        const startYear = date.getFullYear();
        const endDate = addMonths(date, (t.total_installments - (t.installment_number || 1)));
        const endYear = endDate.getFullYear();
        const years = [];
        for (let y = startYear; y <= endYear; y++) {
          years.push(y);
        }
        return years;
      }
      return [date.getFullYear()];
    });
    const uniqueYears = [...new Set([currentYear, ...allYears])];
    return ["Todos", ...uniqueYears.sort((a, b) => b - a).map(String)];
  }, [transactionsData]);

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

  const handleRowClick = (id: string) => {
    const tx = filteredTransactions.find((t) => t.id === id);
    if (tx) {
      setSelectedTransactionDetails({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        observacao: tx.observacao,
        person: tx.person,
        forWho: tx.forWho,
        category: tx.category,
        subcategory: tx.subcategory,
        bank: tx.bank,
        paymentMethod: tx.paymentMethod,
        // For details, show the REAL total value for installments
        totalValue: tx.isNewStyleInstallment ? (tx.realTotalValue || tx.totalValue) : tx.totalValue,
        valuePerPerson: tx.valuePerPerson,
        isCouple: tx.isCouple,
        type: tx.type,
        isInstallment: tx.isInstallment,
        installmentNumber: tx.installmentNumber,
        totalInstallments: tx.totalInstallments,
        installmentValue: tx.installmentValue,
        tags: tx.tags || [],
        resumo_curto: tx.resumo_curto,
        status_extracao: tx.status_extracao,
        // Pass additional info for new-style installments
        firstInstallmentDate: tx.firstInstallmentDate,
        startInstallment: tx.startInstallment,
      } as any);
      setDetailsDialogOpen(true);
    }
  };

  const handleEditFromDetails = (id: string) => {
    setDetailsDialogOpen(false);
    handleEditClick(id);
  };

  return (
    <div className="min-h-screen bg-background">
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={() => {
                setEditTransactionId(null);
                setDuplicateTransactionId(null);
                setNewTransactionModalOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Dia</label>
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mês</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Pessoa</label>
                <Select value={personFilter} onValueChange={setPersonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Para Quem</label>
                <Select value={forWhoFilter} onValueChange={setForWhoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Para Quem" />
                  </SelectTrigger>
                  <SelectContent>
                    {forWhoOptions.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Casal</label>
                <Select value={coupleFilter} onValueChange={setCoupleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Casal" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupleOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Banco</label>
                <Select value={bankFilter} onValueChange={setBankFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Pagamento</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Parcelado</label>
                <Select value={installmentFilter} onValueChange={setInstallmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Parcelado" />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            {transactionsLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : isMobile ? (
              /* Mobile: Cards Layout */
              <div className="p-4 space-y-3">
                {filteredTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onDuplicate={handleDuplicateClick}
                    onClick={handleRowClick}
                  />
                ))}
                
                {/* Mobile Summary */}
                {filteredTransactions.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-secondary/50 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted-foreground">Total do Mês:</span>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          filteredTransactions.reduce((sum, t) => sum + (t.type === "expense" ? t.totalValue : 0), 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Despesas:</span>
                      <span className="font-medium text-foreground">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.totalValue, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Receitas:</span>
                      <span className="font-medium text-success">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Saldo:</span>
                      {(() => {
                        const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0);
                        const expenses = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.totalValue, 0);
                        const balance = income - expenses;
                        return (
                          <span className={cn("font-medium", balance >= 0 ? "text-success" : "text-destructive")}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance)}
                          </span>
                        );
                      })()}
                    </div>
                    {filteredTransactions.some(t => t.isCouple) && (
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                          P/ Pessoa:
                        </span>
                        {(() => {
                          const incomePerPerson = filteredTransactions.filter(t => t.type === "income" && t.isCouple).reduce((sum, t) => sum + t.valuePerPerson, 0);
                          const expensesPerPerson = filteredTransactions.filter(t => t.type === "expense" && t.isCouple).reduce((sum, t) => sum + t.valuePerPerson, 0);
                          const balancePerPerson = incomePerPerson - expensesPerPerson;
                          return (
                            <span className={cn("font-bold", balancePerPerson >= 0 ? "text-success" : "text-destructive")}>
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balancePerPerson)}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop: Table Layout */
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="w-[85px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Data
                      </th>
                      <th className="min-w-[180px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="w-[80px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pessoa
                      </th>
                      <th className="w-[100px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="w-[90px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Banco
                      </th>
                      <th className="w-[110px] px-3 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="w-[60px] px-2 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Parc.
                      </th>
                      <th className="w-[95px] px-2 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="w-[90px] px-2 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        P/ Pessoa
                      </th>
                      <th className="w-[75px] px-2 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="w-[50px] px-2 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        
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
                        onClick={handleRowClick}
                      />
                    ))}
                  </tbody>
                  {filteredTransactions.length > 0 && (
                    <tfoot className="bg-secondary/50 border-t border-border">
                      {/* Total do Mês - destaque principal */}
                      <tr className="bg-primary/10 border-b border-border">
                        <td colSpan={7} className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                          Total do Mês:
                        </td>
                        <td className="px-2 py-3 text-sm font-bold text-primary text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            filteredTransactions.reduce((sum, t) => {
                              return sum + (t.type === "expense" ? t.totalValue : 0);
                            }, 0)
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                          Despesas:
                        </td>
                        <td className="px-2 py-3 text-sm font-medium text-foreground text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.totalValue, 0)
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                          Receitas:
                        </td>
                        <td className="px-2 py-3 text-sm font-medium text-success text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0)
                          )}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                      <tr className="border-t border-border">
                        <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                          Saldo:
                        </td>
                        <td className="px-2 py-3 text-sm font-medium text-right">
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
                      {/* Total por pessoa (casal) */}
                      {filteredTransactions.some(t => t.isCouple) && (
                        <tr className="border-t border-border bg-primary/5">
                          <td colSpan={8} className="px-3 py-3 text-right text-sm font-medium text-foreground">
                            <span className="flex items-center justify-end gap-1.5">
                              <Heart className="w-4 h-4 text-primary fill-primary" />
                              Por Pessoa (Casal):
                            </span>
                          </td>
                          <td className="px-2 py-3 text-sm font-bold text-primary text-right">
                            {(() => {
                              const incomePerPerson = filteredTransactions
                                .filter(t => t.type === "income" && t.isCouple)
                                .reduce((sum, t) => sum + t.valuePerPerson, 0);
                              const expensesPerPerson = filteredTransactions
                                .filter(t => t.type === "expense" && t.isCouple)
                                .reduce((sum, t) => sum + t.valuePerPerson, 0);
                              const balancePerPerson = incomePerPerson - expensesPerPerson;
                              return (
                                <span className={balancePerPerson >= 0 ? "text-success" : "text-destructive"}>
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balancePerPerson)}
                                </span>
                              );
                            })()}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      )}
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
        <AlertDialogContent>
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
        <AlertDialogContent>
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
            <AlertDialogAction onClick={confirmDuplicate}>
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

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        transaction={selectedTransactionDetails}
        onEdit={handleEditFromDetails}
      />
    </div>
  );
}
