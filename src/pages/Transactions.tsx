import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
import { Plus, Search, Filter, Loader2, Heart, FileDown, ChevronDown, ChevronUp, X } from "lucide-react";
import { exportTransactionsToPdf } from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useSplitCalculation } from "@/hooks/useSplitCalculation";

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

const types = ["Todos", "Receita", "Despesa"];
const coupleOptions = ["Todos", "Sim", "Não"];
const metaOptions = ["Todos", "Sim", "Não"];
const installmentOptions = ["Todos", "Sim", "Não"];
const splitOptions = ["Todos", "Proporcional", "50/50"];

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
  const firstMonth = firstInstallmentDate.getMonth() + 1;
  const firstYear = firstInstallmentDate.getFullYear();
  
  const filterDate = new Date(filterYear, filterMonth - 1, 1);
  const firstDate = new Date(firstYear, firstMonth - 1, 1);
  const monthsDiff = differenceInMonths(filterDate, firstDate);
  
  const currentInstallment = startInstallment + monthsDiff;
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
  const { person1, person2, members } = usePersonNames();
  const deleteTransaction = useDeleteTransaction();
  const { calculateSplitForTransaction } = useSplitCalculation();

  // Helper to translate person identifiers to names
  const translatePerson = (personId: string | null | undefined): string => {
    if (!personId || personId === "-") return "-";
    if (personId === "person1") return person1;
    if (personId === "person2") return person2;
    return personId;
  };

  // Dynamic persons from couple_members
  const persons = ["Todos", ...members.map(m => m.name)];
  const forWhoOptions = ["Todos", ...members.map(m => m.name), "Casal", "Empresa"];

  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("Todos");
  const [forWhoFilter, setForWhoFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [bankFilter, setBankFilter] = useState("Todos");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [coupleFilter, setCoupleFilter] = useState("Todos");
  const [installmentFilter, setInstallmentFilter] = useState("Todos");
  const [metaFilter, setMetaFilter] = useState("Todos");
  const [splitFilter, setSplitFilter] = useState("Todos");
  const currentDate = new Date();
  const [dayFilter, setDayFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState((currentDate.getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(currentDate.getFullYear().toString());
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (personFilter !== "Todos") count++;
    if (forWhoFilter !== "Todos") count++;
    if (categoryFilter !== "Todas") count++;
    if (bankFilter !== "Todos") count++;
    if (paymentFilter !== "Todos") count++;
    if (typeFilter !== "Todos") count++;
    if (coupleFilter !== "Todos") count++;
    if (installmentFilter !== "Todos") count++;
    if (metaFilter !== "Todos") count++;
    if (splitFilter !== "Todos") count++;
    if (dayFilter !== "Todos") count++;
    return count;
  }, [personFilter, forWhoFilter, categoryFilter, bankFilter, paymentFilter, typeFilter, coupleFilter, installmentFilter, metaFilter, splitFilter, dayFilter]);

  // Clear all filters
  const clearFilters = () => {
    setPersonFilter("Todos");
    setForWhoFilter("Todos");
    setCategoryFilter("Todas");
    setBankFilter("Todos");
    setPaymentFilter("Todos");
    setTypeFilter("Todos");
    setCoupleFilter("Todos");
    setInstallmentFilter("Todos");
    setMetaFilter("Todos");
    setSplitFilter("Todos");
    setDayFilter("Todos");
    setSearch("");
  };

  // Transform and filter transactions with dynamic installment calculation
  const filteredTransactions = useMemo(() => {
    const filterMonthNum = monthFilter !== "Todos" ? parseInt(monthFilter) : null;
    const filterYearNum = yearFilter !== "Todos" ? parseInt(yearFilter) : null;

    return transactionsData
      .map((t) => {
        const rawDate = parseISO(t.date);
        
        const isNewStyleInstallment = t.is_installment && 
          !t.is_generated_installment && 
          !t.parent_transaction_id &&
          t.total_installments && 
          t.total_installments > 1;

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
            return null;
          }

          const monthsFromStart = result.currentInstallment - startInstallment;
          const installmentDate = addMonths(rawDate, monthsFromStart);
          
          const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.total_value) / t.total_installments!;
          
          // Calculate split for couple expenses
          const split = t.is_couple 
            ? calculateSplitForTransaction(installmentValue, t.category, t.subcategory, t.custom_person1_percentage, t.custom_person2_percentage)
            : null;

          return {
            id: t.id,
            date: format(installmentDate, "dd/MM/yyyy"),
            rawDate: installmentDate,
            description: t.description,
            observacao: t.observacao,
            person: translatePerson(t.paid_by),
            forWho: translatePerson(t.for_who),
            category: t.category || "-",
            subcategory: t.subcategory || "-",
            bank: t.bank_name || "-",
            paymentMethod: t.payment_method_name || "-",
            totalValue: installmentValue,
            valuePerPerson: split?.person1 || installmentValue,
            isCouple: t.is_couple || false,
            type: t.type as "income" | "expense",
            isInstallment: true,
            installmentNumber: result.currentInstallment,
            totalInstallments: t.total_installments,
            realTotalValue: Number(t.total_value),
            installmentValue: installmentValue,
            tags: t.tags || [],
            resumo_curto: t.resumo_curto || undefined,
            status_extracao: t.status_extracao || undefined,
            isNewStyleInstallment: true,
            firstInstallmentDate: rawDate,
            startInstallment: startInstallment,
            savingsDepositId: t.savings_deposit_id || null,
            // Split fields for display
            person1Share: split?.person1,
            person2Share: split?.person2,
            person1Name: person1,
            person2Name: person2,
            splitPercentages: split ? { person1: split.person1Percentage, person2: split.person2Percentage } : undefined,
          };
        }

        // Calculate split for couple expenses (non-installment)
        const baseValue = Number(t.total_value);
        const split = t.is_couple 
          ? calculateSplitForTransaction(baseValue, t.category, t.subcategory, t.custom_person1_percentage, t.custom_person2_percentage)
          : null;

        return {
          id: t.id,
          date: format(rawDate, "dd/MM/yyyy"),
          rawDate,
          description: t.description,
          observacao: t.observacao,
          person: translatePerson(t.paid_by),
          forWho: translatePerson(t.for_who),
          category: t.category || "-",
          subcategory: t.subcategory || "-",
          bank: t.bank_name || "-",
          paymentMethod: t.payment_method_name || "-",
          totalValue: Number(t.total_value),
          valuePerPerson: split?.person1 || baseValue,
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
          savingsDepositId: t.savings_deposit_id || null,
          // Split fields for display
          person1Share: split?.person1,
          person2Share: split?.person2,
          person1Name: person1,
          person2Name: person2,
          splitPercentages: split ? { person1: split.person1Percentage, person2: split.person2Percentage } : undefined,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .filter((t) => {
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
        if (metaFilter !== "Todos") {
          const hasMeta = metaFilter === "Sim";
          const isMeta = !!t.savingsDepositId;
          if (isMeta !== hasMeta) return false;
        }
        if (splitFilter !== "Todos") {
          // Only applies to couple transactions
          if (!t.isCouple) return false;
          const isProportional = t.splitPercentages && t.splitPercentages.person1 !== 50;
          if (splitFilter === "Proporcional" && !isProportional) return false;
          if (splitFilter === "50/50" && isProportional) return false;
        }

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
          if (dayFilter !== "Todos") {
            const day = t.rawDate.getDate().toString().padStart(2, "0");
            if (day !== dayFilter) return false;
          }
        }

        return true;
      });
  }, [transactionsData, search, personFilter, forWhoFilter, categoryFilter, bankFilter, paymentFilter, typeFilter, coupleFilter, installmentFilter, metaFilter, splitFilter, dayFilter, monthFilter, yearFilter, calculateSplitForTransaction]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const allYears = transactionsData.flatMap((t) => {
      const date = parseISO(t.date);
      if (t.is_installment && t.total_installments && !t.is_generated_installment) {
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

  // Calculate summary (separate savings goal deposits from regular expenses)
  const summary = useMemo(() => {
    const regularExpenses = filteredTransactions
      .filter(t => t.type === "expense" && !t.savingsDepositId)
      .reduce((sum, t) => sum + t.totalValue, 0);
    const savingsDeposits = filteredTransactions
      .filter(t => t.type === "expense" && !!t.savingsDepositId)
      .reduce((sum, t) => sum + t.totalValue, 0);
    const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0);
    return {
      expenses: regularExpenses,
      savingsDeposits,
      totalExpenses: regularExpenses + savingsDeposits,
      income,
      balance: income - regularExpenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

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
        firstInstallmentDate: tx.firstInstallmentDate,
        startInstallment: tx.startInstallment,
        savingsDepositId: tx.savingsDepositId,
        person1Share: tx.person1Share,
        person2Share: tx.person2Share,
        person1Name: tx.person1Name,
        person2Name: tx.person2Name,
        splitPercentages: tx.splitPercentages,
      } as any);
      setDetailsDialogOpen(true);
    }
  };

  const handleEditFromDetails = (id: string) => {
    setDetailsDialogOpen(false);
    handleEditClick(id);
  };

  const handleExportPdf = () => {
    const totalExpenses = summary.expenses;
    const totalIncome = summary.income;
    
    exportTransactionsToPdf(
      filteredTransactions.map(t => ({
        date: t.date,
        description: t.description,
        person: t.person,
        forWho: t.forWho,
        category: t.category,
        bank: t.bank,
        paymentMethod: t.paymentMethod,
        totalValue: t.totalValue,
        type: t.type,
        isInstallment: t.isInstallment,
        installmentNumber: t.installmentNumber,
        totalInstallments: t.totalInstallments,
      })),
      {
        month: monthFilter,
        year: yearFilter,
        category: categoryFilter,
        type: typeFilter,
        person: personFilter,
      },
      {
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
      }
    );
    toast({
      title: "PDF exportado",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <AppLayout>
      <div className="min-h-screen pb-32 md:pb-8">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Header */}
          <div className="flex flex-col gap-3 mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Lançamentos
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {summary.count} {summary.count === 1 ? 'transação' : 'transações'}
                </p>
              </div>
              
              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={filteredTransactions.length === 0}
                  className="gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar PDF
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setEditTransactionId(null);
                    setDuplicateTransactionId(null);
                    setNewTransactionModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Lançamento
                </Button>
              </div>
            </div>

            {/* Main filters row - Month/Year + Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-shrink-0">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[130px] h-10">
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
                
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[90px] h-10">
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

              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10"
                  />
                  {search && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Filter toggle button */}
                <Button
                  variant={showFilters || activeFiltersCount > 0 ? "secondary" : "outline"}
                  size="default"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1.5 h-10 px-3"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="h-5 px-1.5 text-xs ml-0.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                  {showFilters ? (
                    <ChevronUp className="h-3.5 w-3.5 hidden sm:block" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
                  )}
                </Button>
              </div>
            </div>

            {/* Collapsible Advanced Filters */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent>
                <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Dia</label>
                      <Select value={dayFilter} onValueChange={setDayFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Pessoa</label>
                      <Select value={personFilter} onValueChange={setPersonFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Para Quem</label>
                      <Select value={forWhoFilter} onValueChange={setForWhoFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Banco</label>
                      <Select value={bankFilter} onValueChange={setBankFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Pagamento</label>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Casal</label>
                      <Select value={coupleFilter} onValueChange={setCoupleFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Parcelado</label>
                      <Select value={installmentFilter} onValueChange={setInstallmentFilter}>
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Meta</label>
                      <Select value={metaFilter} onValueChange={setMetaFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Meta" />
                        </SelectTrigger>
                        <SelectContent>
                          {metaOptions.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Divisão</label>
                      <Select value={splitFilter} onValueChange={setSplitFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Divisão" />
                        </SelectTrigger>
                        <SelectContent>
                          {splitOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="flex justify-end pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            {transactionsLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Nenhum lançamento encontrado
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditTransactionId(null);
                    setDuplicateTransactionId(null);
                    setNewTransactionModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar lançamento
                </Button>
              </div>
            ) : isMobile ? (
              /* Mobile: Cards Layout */
              <div className="p-3 space-y-2">
                {filteredTransactions.map((transaction, index) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onDuplicate={handleDuplicateClick}
                    onClick={handleRowClick}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
                  />
                ))}
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
                      <th className="w-[130px] px-2 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="w-[48px] px-2 py-4">
                        
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
                  <tfoot className="bg-secondary/50 border-t border-border">
                    <tr className="bg-primary/10 border-b border-border">
                      <td colSpan={7} className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                        Total do Mês:
                      </td>
                      <td className="px-2 py-3 text-sm font-bold text-primary text-right">
                        {formatCurrency(summary.totalExpenses + summary.income)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                        Despesas:
                      </td>
                      <td className="px-2 py-3 text-sm font-medium text-foreground text-right">
                        {formatCurrency(summary.expenses)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    {summary.savingsDeposits > 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                          🎯 Guardado em Metas:
                        </td>
                        <td className="px-2 py-3 text-sm font-medium text-foreground text-right">
                          {formatCurrency(summary.savingsDeposits)}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                        Receitas:
                      </td>
                      <td className="px-2 py-3 text-sm font-medium text-success text-right">
                        {formatCurrency(summary.income)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    <tr className="border-t border-border">
                      <td colSpan={7} className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">
                        Saldo:
                      </td>
                      <td className="px-2 py-3 text-sm font-medium text-right">
                        <span className={summary.balance >= 0 ? "text-success" : "text-destructive"}>
                          {formatCurrency(summary.balance)}
                        </span>
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    {filteredTransactions.some(t => t.isCouple) && (
                      <tr className="border-t border-border bg-primary/5">
                        <td colSpan={8} className="px-3 py-3 text-right text-sm font-medium text-foreground">
                          <span className="flex items-center justify-end gap-1.5">
                            <Heart className="w-4 h-4 text-primary fill-primary" />
                            Divisão Individual:
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-right">
                          {(() => {
                            const coupleExpenses = filteredTransactions.filter(t => t.type === "expense" && t.isCouple && !t.savingsDepositId);
                            const person1Total = coupleExpenses.reduce((sum, t) => sum + (t.person1Share ?? t.valuePerPerson), 0);
                            const person2Total = coupleExpenses.reduce((sum, t) => sum + (t.person2Share ?? t.valuePerPerson), 0);
                            const person1Name = coupleExpenses[0]?.person1Name || "Pessoa 1";
                            const person2Name = coupleExpenses[0]?.person2Name || "Pessoa 2";
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-foreground font-medium">{person1Name}: {formatCurrency(person1Total)}</span>
                                <span className="text-foreground font-medium">{person2Name}: {formatCurrency(person2Total)}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Fixed Footer with Summary */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-card/95 backdrop-blur-sm border-t border-border z-40">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground leading-tight">Despesas</p>
              <p className="text-sm font-semibold text-destructive">{formatCurrency(summary.expenses)}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground leading-tight">Receitas</p>
              <p className="text-sm font-semibold text-success">{formatCurrency(summary.income)}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground leading-tight">Saldo</p>
              <p className={cn("text-sm font-semibold", summary.balance >= 0 ? "text-primary" : "text-destructive")}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <Button
          onClick={() => {
            setEditTransactionId(null);
            setDuplicateTransactionId(null);
            setNewTransactionModalOpen(true);
          }}
          size="lg"
          className="fixed bottom-16 right-4 md:hidden h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
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
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar lançamento parcelado?</AlertDialogTitle>
            <AlertDialogDescription>
              Este é um lançamento parcelado. Ao duplicar, <strong>todas as parcelas serão recriadas</strong> a partir da data atual.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDuplicate} className="w-full sm:w-auto">
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

      <TransactionDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        transaction={selectedTransactionDetails}
        onEdit={handleEditFromDetails}
      />
    </AppLayout>
  );
}
