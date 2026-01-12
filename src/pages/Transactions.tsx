import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionRow, Transaction } from "@/components/shared/TransactionRow";
import { TransactionCard } from "@/components/shared/TransactionCard";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionDetailsDialog, TransactionDetails } from "@/components/TransactionDetailsDialog";
import { ImportarFaturaModal } from "@/components/ImportarFaturaModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Loader2, Heart, FileDown, ChevronDown, ChevronUp, X, CreditCard, Trash2 } from "lucide-react";
import { exportTransactionsToPdf } from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useSplitCalculation } from "@/hooks/useSplitCalculation";

import { useTransactions, useDeleteTransaction, useDeleteMultipleTransactions } from "@/hooks/useTransactions";
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
  const [searchParams] = useSearchParams();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useTransactions();
  const { data: banksData = [] } = useBanks();
  const { data: paymentMethodsData = [] } = usePaymentMethods();
  const { data: categoriesData = [] } = useCategories();
  const { person1, person2, members } = usePersonNames();
  const deleteTransaction = useDeleteTransaction();
  const deleteMultipleTransactions = useDeleteMultipleTransactions();
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
  const [monthFilter, setMonthFilter] = useState(
    searchParams.get('month') || (currentDate.getMonth() + 1).toString()
  );
  const [yearFilter, setYearFilter] = useState(
    searchParams.get('year') || currentDate.getFullYear().toString()
  );
  const [showFilters, setShowFilters] = useState(false);

  // Sync filters with URL params
  useEffect(() => {
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    if (monthParam && monthParam !== monthFilter) {
      setMonthFilter(monthParam);
    }
    if (yearParam && yearParam !== yearFilter) {
      setYearFilter(yearParam);
    }
  }, [searchParams]);
  
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
  const [importarFaturaOpen, setImportarFaturaOpen] = useState(false);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

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

    const result = transactionsData
      .map((t) => {
        // --- CORREÇÃO DE DATA AQUI ---
        // Em vez de parseISO, criamos a data manualmente para ignorar fuso horário
        // Forçamos o horário para 12:00 (meio-dia) para evitar viradas de dia
        let rawDate;
        if (t.date && t.date.length >= 10) {
           const [y, m, d] = t.date.substring(0, 10).split('-').map(Number);
           rawDate = new Date(y, m - 1, d, 12, 0, 0);
        } else {
           rawDate = parseISO(t.date);
        }
        
        const isNewStyleInstallment = t.is_installment && 
          !t.is_generated_installment && 
          !t.parent_transaction_id &&
          t.total_installments && 
          t.total_installments > 1;

        if (isNewStyleInstallment && filterMonthNum && filterYearNum) {
          const startInstallment = t.installment_number || 1;
          const resultCalc = calculateInstallmentForMonth(
            rawDate,
            startInstallment,
            t.total_installments!,
            filterMonthNum,
            filterYearNum
          );

          if (!resultCalc || !resultCalc.isInRange) {
            return null;
          }

          const monthsFromStart = resultCalc.currentInstallment - startInstallment;
          const installmentDate = addMonths(rawDate, monthsFromStart);
          
          const installmentValue = t.installment_value ? Number(t.installment_value) : Number(t.total_value) / t.total_installments!;
          
          // Calculate split for couple expenses
          const split = t.is_couple 
            ? calculateSplitForTransaction(installmentValue, t.category, t.subcategory, t.custom_person1_percentage, t.custom_person2_percentage)
            : null;

          return {
            id: t.id,
            date: format(installmentDate, "dd/MM/yyyy"),
            rawDate: installmentDate, // Data correta para ordenação
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
            installmentNumber: resultCalc.currentInstallment,
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
            person1Share: split?.person1,
            person2Share: split?.person2,
            person1Name: person1,
            person2Name: person2,
            splitPercentages: split ? { person1: split.person1Percentage, person2: split.person2Percentage } : undefined,
          };
        }

        // --- Lógica Padrão (Não é parcela projetada) ---
        
        const isLegacyInstallment = t.is_installment && t.total_installments && t.total_installments > 1;
        const displayValue = isLegacyInstallment && t.installment_value 
          ? Number(t.installment_value) 
          : Number(t.total_value);
        
        const split = t.is_couple 
          ? calculateSplitForTransaction(displayValue, t.category, t.subcategory, t.custom_person1_percentage, t.custom_person2_percentage)
          : null;

        return {
          id: t.id,
          date: format(rawDate, "dd/MM/yyyy"),
          rawDate, // Usando a rawDate corrigida
          description: t.description,
          observacao: t.observacao,
          person: translatePerson(t.paid_by),
          forWho: translatePerson(t.for_who),
          category: t.category || "-",
          subcategory: t.subcategory || "-",
          bank: t.bank_name || "-",
          paymentMethod: t.payment_method_name || "-",
          totalValue: displayValue,
          valuePerPerson: split?.person1 || displayValue,
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
        
        // For "para quem" filter: include if forWho matches OR if it's a couple transaction
        if (forWhoFilter !== "Todos") {
          const matchesPerson = t.forWho === forWhoFilter;
          const isCoupleTransaction = t.isCouple === true;
          if (!matchesPerson && !isCoupleTransaction) return false;
        }
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

      // --- CORREÇÃO DE ORDENAÇÃO ---
      // Ordena por data (mais recente primeiro)
      return result.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  }, [transactionsData, search, personFilter, forWhoFilter, categoryFilter, bankFilter, paymentFilter, typeFilter, coupleFilter, installmentFilter, metaFilter, splitFilter, dayFilter, monthFilter, yearFilter, calculateSplitForTransaction]);

  const years = ["Todos", "2030", "2029", "2028", "2027", "2026", "2025"];

  // Calculate summary (separate savings goal deposits from regular expenses)
  const summary = useMemo(() => {
    const regularExpenses = filteredTransactions
      .filter(t => t.type === "expense" && !t.savingsDepositId)
      .reduce((sum, t) => sum + t.totalValue, 0);
    const savingsDeposits = filteredTransactions
      .filter(t => t.type === "expense" && !!t.savingsDepositId)
      .reduce((sum, t) => sum + t.totalValue, 0);
    const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.totalValue, 0);
    
    // FIXED: Calculate individual expenses PER PERSON (not couple, expense type only)
    const person1Individual = filteredTransactions
      .filter(t => t.type === "expense" && !t.isCouple && !t.savingsDepositId && t.forWho === person1)
      .reduce((sum, t) => sum + t.totalValue, 0);
    
    const person2Individual = filteredTransactions
      .filter(t => t.type === "expense" && !t.isCouple && !t.savingsDepositId && t.forWho === person2)
      .reduce((sum, t) => sum + t.totalValue, 0);
    
    // Calculate couple expense shares per person (expense type only)
    const coupleExpenses = filteredTransactions.filter(t => t.type === "expense" && t.isCouple && !t.savingsDepositId);
    const person1CoupleTotal = coupleExpenses.reduce((sum, t) => sum + (t.person1Share ?? 0), 0);
    const person2CoupleTotal = coupleExpenses.reduce((sum, t) => sum + (t.person2Share ?? 0), 0);
    
    // FIXED: Combined totals = individual expenses (per person) + couple share (per person)
    const person1Combined = person1Individual + person1CoupleTotal;
    const person2Combined = person2Individual + person2CoupleTotal;
    
    // Get names from first couple expense or fallback
    const person1Name = coupleExpenses[0]?.person1Name || person1;
    const person2Name = coupleExpenses[0]?.person2Name || person2;
    
    return {
      expenses: regularExpenses,
      savingsDeposits,
      totalExpenses: regularExpenses + savingsDeposits,
      income,
      balance: income - regularExpenses,
      count: filteredTransactions.length,
      // Per-person fields
      person1Individual,
      person2Individual,
      person1CoupleTotal,
      person2CoupleTotal,
      person1Combined,
      person2Combined,
      person1Name,
      person2Name,
    };
  }, [filteredTransactions, person1, person2]);

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

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      await deleteMultipleTransactions.mutateAsync(Array.from(selectedIds));
      toast({
        title: "Lançamentos excluídos",
        description: `${selectedIds.size} lançamentos foram excluídos com sucesso.`,
      });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os lançamentos.",
        variant: "destructive",
      });
    } finally {
      setBulkDeleteDialogOpen(false);
    }
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
              
              {/* Mobile button for import */}
              <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setImportarFaturaOpen(true)}
                  className="gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  Importar
                </Button>
              </div>

              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                {selectedIds.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir ({selectedIds.size})
                  </Button>
                )}
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
                  variant="outline" 
                  size="sm"
                  onClick={() => setImportarFaturaOpen(true)}
                  className="gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Importar Fatura
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
                      <th className="w-[40px] px-2 py-4">
                        <Checkbox
                          checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </th>
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
                      <tr 
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(transaction.id)}
                      >
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(transaction.id)}
                            onCheckedChange={() => toggleSelect(transaction.id)}
                            aria-label={`Selecionar ${transaction.description}`}
                          />
                        </td>
                        <TransactionRow
                          transaction={transaction}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                          onDuplicate={handleDuplicateClick}
                          onClick={handleRowClick}
                          asFragment
                        />
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Desktop Summary Section - Two Cards */}
                <div className="grid grid-cols-12 gap-4 mt-6">
                  {/* Card 1: Resumo do Mês (5 colunas) */}
                  <div className="col-span-5 bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                      Resumo do Mês
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Movimentação</span>
                        <span className="text-sm font-medium text-primary tabular-nums">
                          {formatCurrency(summary.totalExpenses + summary.income)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Despesas</span>
                        <span className="text-sm font-medium text-primary tabular-nums">
                          {formatCurrency(summary.expenses)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Receitas</span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500 tabular-nums">
                          {formatCurrency(summary.income)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Saldo</span>
                        <span className={cn(
                          "text-lg font-bold tabular-nums",
                          summary.balance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-primary"
                        )}>
                          {formatCurrency(summary.balance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Divisão do Casal (7 colunas) */}
                  {filteredTransactions.some(t => t.isCouple) && (
                    <div className="col-span-7 bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                      <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                        Divisão do Casal
                      </h3>
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                            <th className="text-left font-medium pb-3">Pessoa</th>
                            <th className="text-right font-medium pb-3">
                              <span className="inline-flex items-center gap-1">
                                P/ Pessoa <Heart className="w-3 h-3 text-primary/70" />
                              </span>
                            </th>
                            <th className="text-right font-medium pb-3 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-t-lg">
                              Total Combinado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          <tr className="border-t border-slate-100 dark:border-slate-700">
                            <td className="py-3 text-slate-700 dark:text-slate-200">{summary.person1Name}</td>
                            <td className="py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {formatCurrency(summary.person1CoupleTotal)}
                            </td>
                            <td className="py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 px-3">
                              {formatCurrency(summary.person1Combined)}
                            </td>
                          </tr>
                          <tr className="border-t border-slate-100 dark:border-slate-700">
                            <td className="py-3 text-slate-700 dark:text-slate-200">{summary.person2Name}</td>
                            <td className="py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {formatCurrency(summary.person2CoupleTotal)}
                            </td>
                            <td className="py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-b-lg">
                              {formatCurrency(summary.person2Combined)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Summary Section - Two Cards Stacked */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 z-40 p-3 space-y-3 max-h-[45vh] overflow-y-auto">
          {/* Card 1: Resumo do Mês */}
          <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Resumo do Mês
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Movimentação</span>
              <span className="text-right font-medium text-primary tabular-nums">
                {formatCurrency(summary.totalExpenses + summary.income)}
              </span>
              <span className="text-slate-600 dark:text-slate-300">Despesas</span>
              <span className="text-right font-medium text-primary tabular-nums">
                {formatCurrency(summary.expenses)}
              </span>
              <span className="text-slate-600 dark:text-slate-300">Receitas</span>
              <span className="text-right font-medium text-emerald-600 dark:text-emerald-500 tabular-nums">
                {formatCurrency(summary.income)}
              </span>
              <span className="text-slate-700 dark:text-slate-200 font-medium border-t border-slate-100 dark:border-slate-700 pt-2">Saldo</span>
              <span className={cn(
                "text-right font-bold tabular-nums border-t border-slate-100 dark:border-slate-700 pt-2",
                summary.balance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-primary"
              )}>
                {formatCurrency(summary.balance)}
              </span>
            </div>
          </div>

          {/* Card 2: Divisão do Casal */}
          {filteredTransactions.some(t => t.isCouple) && (
            <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Divisão do Casal
              </h3>
              <div className="space-y-2">
                {/* Header */}
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 uppercase pb-1">
                  <span>Pessoa</span>
                  <div className="flex gap-4">
                    <span className="inline-flex items-center gap-1">
                      P/ Pessoa <Heart className="w-2.5 h-2.5 text-primary/70" />
                    </span>
                    <span className="bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-[10px]">Combinado</span>
                  </div>
                </div>
                {/* Pessoa 1 */}
                <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-700 pt-2">
                  <span className="text-slate-700 dark:text-slate-200">{summary.person1Name}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-slate-600 dark:text-slate-300 tabular-nums">{formatCurrency(summary.person1CoupleTotal)}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded min-w-[90px] text-right">
                      {formatCurrency(summary.person1Combined)}
                    </span>
                  </div>
                </div>
                {/* Pessoa 2 */}
                <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-700 pt-2">
                  <span className="text-slate-700 dark:text-slate-200">{summary.person2Name}</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-slate-600 dark:text-slate-300 tabular-nums">{formatCurrency(summary.person2CoupleTotal)}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded min-w-[90px] text-right">
                      {formatCurrency(summary.person2Combined)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile FAB - positioned above the summary cards */}
        <Button
          onClick={() => {
            setEditTransactionId(null);
            setDuplicateTransactionId(null);
            setNewTransactionModalOpen(true);
          }}
          size="lg"
          className="fixed bottom-[220px] right-4 md:hidden h-14 w-14 rounded-full shadow-lg z-50"
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} lançamentos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. <strong>Todos os {selectedIds.size} lançamentos selecionados serão removidos permanentemente.</strong>
              <br /><br />
              Lançamentos parcelados terão todas as suas parcelas excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedIds.size}
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

      {/* Importar Fatura Modal */}
      <ImportarFaturaModal
        open={importarFaturaOpen}
        onOpenChange={setImportarFaturaOpen}
      />
    </AppLayout>
  );
}
