import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Heart, Check, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useRecipients } from "@/hooks/useRecipients";
import { useCreateTransaction, useUpdateTransaction, useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useBudgetAlert } from "@/hooks/useBudgetAlert";
import { useGamificationEvents } from "@/hooks/useGamificationEvents";
import {
  parseCurrencyToCents,
  centsToReais,
  reaisToCents,
  formatCentsToDisplay,
  formatCurrencyInput,
  calculateInstallmentCents,
  calculateTotalFromInstallmentCents,
  validateInstallmentValues,
} from "@/lib/currency";

const transactionSchema = z.object({
  date: z.date().optional(),
  description: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").trim().optional(),
  type: z.enum(["expense", "income"], { required_error: "Tipo é obrigatório" }),
  value: z.number()
    .positive("Valor deve ser maior que zero")
    .max(999999999, "Valor máximo excedido"),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  paidBy: z.string().max(100).optional(),
  forWho: z.string().max(100).optional(),
  isCouple: z.boolean(),
  isInstallment: z.boolean(),
  totalInstallments: z.number().min(2).max(48).optional(),
  incomeOrigin: z.string().max(100).optional(),
});


const installmentOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18];
const recurringDurationOptions = [
  { value: "indefinite", label: "Sem prazo definido" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];


interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  duplicateId?: string | null;
  onSuccess?: () => void;
}

export function TransactionFormModal({
  open,
  onOpenChange,
  editId,
  duplicateId,
  onSuccess,
}: TransactionFormModalProps) {
  const isEditMode = !!editId;
  const isDuplicateMode = !!duplicateId;
  const loadId = editId || duplicateId;
  
  const { toast } = useToast();
  const { person1, person2 } = usePersonNames();
  const persons = [person1, person2];
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { checkBudgetAlert } = useBudgetAlert();
  const { triggerGamificationEvent } = useGamificationEvents();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [observacao, setObservacao] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");

  const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories(type);
  const { data: subcategoriesData = [], isLoading: subcategoriesLoading } = useSubcategories(categoryId || undefined);
  const [paidBy, setPaidBy] = useState("");
  const [forWho, setForWho] = useState("");
  const [isCouple, setIsCouple] = useState(false);
  const [value, setValue] = useState("");
  const [bank, setBank] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receivingBank, setReceivingBank] = useState("");
  const [incomeOrigin, setIncomeOrigin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState<number>(2);
  const [isAlreadyStarted, setIsAlreadyStarted] = useState(false);
  const [startFromInstallment, setStartFromInstallment] = useState<number>(1);
  
  // Value mode: "total" or "installment"
  const [valueMode, setValueMode] = useState<"total" | "installment">("total");
  
  // Track if we're editing an existing installment (prevents recalculation)
  const [isEditingInstallment, setIsEditingInstallment] = useState(false);
  // Store original values for installment transactions being edited
  const [originalTotalValueCents, setOriginalTotalValueCents] = useState<number | null>(null);
  const [originalInstallmentValueCents, setOriginalInstallmentValueCents] = useState<number | null>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(1);
  const [recurringDuration, setRecurringDuration] = useState<string>("indefinite");

  // Novos campos para forma de pagamento e instituição
  const [formaPagamento, setFormaPagamento] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [cartao, setCartao] = useState("");

  interface FieldErrors {
    date?: string;
    description?: string;
    value?: string;
    category?: string;
    paidBy?: string;
    bank?: string;
    receivingBank?: string;
  }
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset after modal closes
      setTimeout(() => {
        setDate(new Date());
        setDescription("");
        setObservacao("");
        setType("expense");
        setCategory("");
        setCategoryId("");
        setSubcategory("");
        setPaidBy("");
        setForWho("");
        setIsCouple(false);
        setValue("");
        setBank("");
        setPaymentMethod("");
        setReceivingBank("");
        setIncomeOrigin("");
        setIsInstallment(false);
        setTotalInstallments(2);
        setIsAlreadyStarted(false);
        setStartFromInstallment(1);
        setValueMode("total");
        setIsEditingInstallment(false);
        setOriginalTotalValueCents(null);
        setOriginalInstallmentValueCents(null);
        setIsRecurring(false);
        setRecurringDay(1);
        setRecurringDuration("indefinite");
        setFormaPagamento("");
        setInstituicao("");
        setCartao("");
        setFieldErrors({});
        setIsInitialized(false);
        setShowSuccess(false);
        setIsSaving(false);
      }, 200);
    }
  }, [open]);

  // Load transaction data if editing or duplicating
  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && !transactionsLoading && transactionsData.length > 0 && !isInitialized && open) {
      const transaction = transactionsData.find(t => t.id === loadId);
      if (transaction) {
        setDate(isDuplicateMode ? new Date() : parseISO(transaction.date));
        const cleanDescription = transaction.description.replace(/\s*\(Parcela \d+\/\d+\)$/, "");
        setDescription(cleanDescription);
        setObservacao(transaction.observacao || "");
        setType(transaction.type);
        setCategory(transaction.category || "");
        setSubcategory(transaction.subcategory || "");
        setPaidBy(transaction.paid_by || "");
        setForWho(transaction.for_who || "");
        setIsCouple(transaction.is_couple || false);
        setIncomeOrigin(transaction.income_origin || "");
        setIsInstallment(transaction.is_installment || false);
        setTotalInstallments(transaction.total_installments || 2);
        
        // Check if this is a new-style installment transaction (single record with installment_value)
        const isNewStyleInstallment = transaction.is_installment && 
          transaction.installment_value && 
          transaction.installment_value > 0 &&
          !transaction.is_generated_installment;
        
        if (isEditMode && isNewStyleInstallment) {
          // For new-style installment editing:
          // - Show installment value in the input field
          // - Store original values to prevent recalculation
          // - Set mode to "installment" so user sees/edits the installment value
          const installmentValueCents = reaisToCents(transaction.installment_value!);
          const totalValueCents = reaisToCents(transaction.total_value);
          
          setIsEditingInstallment(true);
          setOriginalTotalValueCents(totalValueCents);
          setOriginalInstallmentValueCents(installmentValueCents);
          setValueMode("installment");
          // Display the installment value, not the total
          setValue(formatCentsToDisplay(installmentValueCents));
        } else {
          // For old-style or non-installment transactions, use total_value as before
          setIsEditingInstallment(false);
          setOriginalTotalValueCents(null);
          setOriginalInstallmentValueCents(null);
          setValue(formatCentsToDisplay(reaisToCents(transaction.total_value)));
        }
        
        // Carregar novos campos
        setFormaPagamento((transaction as any).forma_pagamento || "");
        setInstituicao((transaction as any).instituicao || "");
        setCartao((transaction as any).cartao || "");
        
        const bankRecord = banks.find(b => b.id === transaction.bank_id);
        if (bankRecord) setBank(bankRecord.name);
        
        const paymentMethodRecord = paymentMethods.find(p => p.id === transaction.payment_method_id);
        if (paymentMethodRecord) setPaymentMethod(paymentMethodRecord.name);
        
        const receivingBankRecord = banks.find(b => b.id === transaction.receiving_bank_id);
        if (receivingBankRecord) setReceivingBank(receivingBankRecord.name);
        
        const categoryRecord = categoriesData.find(c => c.name === transaction.category);
        if (categoryRecord) setCategoryId(categoryRecord.id);
        
        setIsInitialized(true);
      }
    }
  }, [isEditMode, isDuplicateMode, loadId, transactionsData, transactionsLoading, banks, paymentMethods, categoriesData, isInitialized, open]);

  // Parse input value to cents
  const inputValueCents = parseCurrencyToCents(value);
  const numericValue = centsToReais(inputValueCents);
  
  // Calculate total and installment values based on mode and edit state
  let totalValueCents: number;
  let installmentValueCents: number;
  
  if (isEditingInstallment && isEditMode) {
    // When editing an existing installment transaction:
    // - The user is editing the installment value (input field shows installment)
    // - We preserve the original total value unless user explicitly changes installment count
    // - If user changes the installment value, recalculate total = new_installment * count
    if (inputValueCents !== originalInstallmentValueCents) {
      // User changed the installment value, recalculate total
      installmentValueCents = inputValueCents;
      totalValueCents = calculateTotalFromInstallmentCents(installmentValueCents, totalInstallments);
    } else {
      // User didn't change the value, keep originals
      totalValueCents = originalTotalValueCents || inputValueCents;
      installmentValueCents = originalInstallmentValueCents || inputValueCents;
    }
  } else if (valueMode === "installment") {
    // User is entering installment value, calculate total
    installmentValueCents = inputValueCents;
    totalValueCents = calculateTotalFromInstallmentCents(installmentValueCents, totalInstallments);
  } else {
    // User is entering total value, calculate installment
    totalValueCents = inputValueCents;
    installmentValueCents = isInstallment && totalInstallments > 1 
      ? calculateInstallmentCents(totalValueCents, totalInstallments)
      : totalValueCents;
  }
  
  // Validate installment values to prevent errors
  if (isInstallment && totalInstallments > 1) {
    const validated = validateInstallmentValues(totalValueCents, installmentValueCents, totalInstallments);
    totalValueCents = validated.totalCents;
    installmentValueCents = validated.installmentCents;
  }
  
  // Convert to reais for compatibility with existing code
  const totalValue = centsToReais(totalValueCents);
  const installmentValue = centsToReais(installmentValueCents);
  const valuePerPerson = isCouple ? totalValue / 2 : totalValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFieldErrors({});
    
    const errors: FieldErrors = {};
    
    if (numericValue <= 0) {
      errors.value = type === "income" ? "Informe o valor da receita" : "Informe o valor da despesa";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Campo obrigatório",
        description: "Informe o valor do lançamento.",
        variant: "destructive",
      });
      return;
    }
    
    const validationResult = transactionSchema.safeParse({
      date,
      description: description.trim(),
      type,
      value: totalValue,
      category: category || undefined,
      subcategory: subcategory || undefined,
      paidBy: paidBy || undefined,
      forWho: forWho || undefined,
      isCouple,
      isInstallment: isInstallment && totalInstallments > 1,
      totalInstallments: isInstallment ? totalInstallments : undefined,
      incomeOrigin: incomeOrigin || undefined,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    // Verificar alerta de orçamento antes de salvar (apenas para despesas novas)
    if (type === "expense" && category && !isEditMode) {
      const valueToCheck = isInstallment && totalInstallments > 1 
        ? reaisToCents(installmentValue) 
        : reaisToCents(totalValue);
      
      const budgetAlert = checkBudgetAlert(
        category,
        valueToCheck,
        format(date || new Date(), "yyyy-MM-dd")
      );

      if (budgetAlert) {
        toast({
          title: budgetAlert.status === "exceeded" ? "⚠️ Orçamento ultrapassado!" : "⚡ Atenção ao orçamento",
          description: budgetAlert.message,
          variant: budgetAlert.status === "exceeded" ? "destructive" : "default",
          duration: 6000,
        });
      }
    }

    setIsSaving(true);

    try {
      const selectedBank = banks.find((b) => b.name === bank);
      const selectedPaymentMethod = paymentMethods.find((p) => p.name === paymentMethod);
      const selectedRecipient = recipients.find((r) => r.name === forWho);
      const selectedReceivingBank = banks.find((b) => b.name === receivingBank);

      const transactionData = {
        date: format(date || new Date(), "yyyy-MM-dd"),
        description,
        observacao: observacao.trim() || undefined,
        type,
        category: category || undefined,
        subcategory: subcategory || undefined,
        total_value: totalValue,
        value_per_person: valuePerPerson,
        is_couple: isCouple,
        paid_by: paidBy || undefined,
        for_who: forWho || undefined,
        bank_id: selectedBank?.id,
        payment_method_id: selectedPaymentMethod?.id,
        recipient_id: selectedRecipient?.id,
        receiving_bank_id: selectedReceivingBank?.id,
        income_origin: incomeOrigin || undefined,
        is_installment: isInstallment && totalInstallments > 1,
        total_installments: isInstallment ? totalInstallments : undefined,
        installment_value: isInstallment ? installmentValue : undefined,
        start_from_installment: isInstallment && isAlreadyStarted ? startFromInstallment : undefined,
        modo_valor_informado: isInstallment ? valueMode : undefined,
        is_recurring: type === "income" && isRecurring,
        recurring_day: type === "income" && isRecurring ? recurringDay : undefined,
        recurring_duration: type === "income" && isRecurring ? recurringDuration : undefined,
        // Novos campos
        forma_pagamento: formaPagamento || undefined,
        instituicao: instituicao || undefined,
        cartao: cartao || undefined,
      };

      if (isEditMode && editId) {
        await updateTransaction.mutateAsync({
          id: editId,
          updates: transactionData,
        });
        setShowSuccess(true);
        setTimeout(() => {
          toast({
            title: "Lançamento atualizado!",
            description: "As alterações foram salvas com sucesso.",
          });
          onOpenChange(false);
          onSuccess?.();
        }, 500);
      } else {
        await createTransaction.mutateAsync(transactionData);
        
        // Trigger gamification event for transaction creation
        const personName = paidBy === person2 ? "person2" : "person1";
        await triggerGamificationEvent({
          actionType: "transaction_created",
          personName,
          metadata: { type, category },
        });
        
        setShowSuccess(true);
        setTimeout(() => {
          let toastDescription = "O lançamento foi registrado com sucesso.";
          if (isInstallment && totalInstallments > 1) {
            const installmentsCreated = isAlreadyStarted 
              ? totalInstallments - startFromInstallment + 1 
              : totalInstallments;
            toastDescription = `Criadas ${installmentsCreated} parcelas de ${formatCurrency(installmentValue)}`;
            if (isAlreadyStarted) {
              toastDescription += ` (${startFromInstallment}/${totalInstallments} até ${totalInstallments}/${totalInstallments})`;
            }
          } else if (type === "income" && isRecurring) {
            const months = recurringDuration === "indefinite" ? 12 : parseInt(recurringDuration);
            toastDescription = `Receita recorrente criada! Gerados ${months} lançamentos futuros.`;
          }
          toast({
            title: "Lançamento salvo!",
            description: toastDescription,
          });
          onOpenChange(false);
          onSuccess?.();
        }, 500);
      }
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar o lançamento.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValue(formatted);
    const cents = parseCurrencyToCents(formatted);
    if (cents > 0) setFieldErrors(prev => ({ ...prev, value: undefined }));
  };

  const handleValueFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const isLoading = banksLoading || paymentMethodsLoading || recipientsLoading || ((isEditMode || isDuplicateMode) && transactionsLoading);

  const installmentPreview = () => {
    if (!isInstallment || totalInstallments <= 1 || !date || numericValue <= 0) return null;
    
    const startFrom = isAlreadyStarted ? startFromInstallment : 1;
    const previews = [];
    for (let i = startFrom; i <= totalInstallments; i++) {
      // When already started, the selected date is for the startFrom installment
      const monthOffset = isAlreadyStarted ? (i - startFrom) : (i - 1);
      const installmentDate = addMonths(date, monthOffset);
      previews.push({
        number: i,
        date: format(installmentDate, "dd/MM/yyyy"),
        value: installmentValue,
      });
    }
    return previews;
  };

  const preview = installmentPreview();
  const isMobile = useIsMobile();

  const modalTitle = isEditMode ? "Editar Lançamento" : isDuplicateMode ? "Duplicar Lançamento" : "Novo Lançamento";

  const footerButtons = (
    <div className="flex gap-2 sm:gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSaving}
        className="flex-1 h-10 sm:h-11 text-sm"
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        form="transaction-form"
        disabled={isSaving || isLoading} 
        className="flex-1 h-10 sm:h-11 text-sm min-w-0"
      >
        {showSuccess ? (
          <Check className="w-5 h-5 animate-check" />
        ) : isSaving ? (
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "💾 Salvar"
        )}
      </Button>
    </div>
  );

  const formContent = (
    <form id="transaction-form" onSubmit={handleSubmit} className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        {/* Type Toggle */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              if (type !== "expense") {
                setType("expense");
                setCategory("");
                setCategoryId("");
                setSubcategory("");
              }
            }}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-300",
              type === "expense"
                ? "bg-primary text-primary-foreground shadow-warm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              if (type !== "income") {
                setType("income");
                setCategory("");
                setCategoryId("");
                setSubcategory("");
              }
            }}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-300",
              type === "income"
                ? "bg-success text-success-foreground shadow-soft"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Receita
          </button>
        </div>

        {/* Date & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Data</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 sm:h-10 text-sm",
                    !date && "text-muted-foreground",
                    fieldErrors.date && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) setFieldErrors(prev => ({ ...prev, date: undefined }));
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">Descrição</Label>
            <Input
              id="description"
              placeholder={type === "income" ? "Ex: Salário" : "Ex: Supermercado"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 sm:h-10 text-sm"
            />
          </div>
        </div>

        {/* Observação */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="observacao" className="text-xs sm:text-sm">Observação</Label>
          <Textarea
            id="observacao"
            placeholder="Detalhes do gasto..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
            maxLength={1500}
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
            {observacao.length}/1500
          </p>
        </div>

        {/* Value - For Income */}
        {type === "income" && (
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="value" className="text-xs sm:text-sm">Valor Total <span className="text-destructive">*</span></Label>
            <Input
              id="value"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={value}
              onChange={handleValueChange}
              onFocus={handleValueFocus}
              className={cn("text-xl sm:text-2xl font-semibold h-12 sm:h-14", fieldErrors.value && "border-destructive")}
            />
            {fieldErrors.value && <p className="text-xs sm:text-sm text-destructive">{fieldErrors.value}</p>}
          </div>
        )}

        {/* Recurring Income Toggle */}
        {type === "income" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <CalendarIcon className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", isRecurring ? "text-success" : "text-muted-foreground")} />
                <div>
                  <Label className="text-foreground text-xs sm:text-sm">Receita recorrente</Label>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    Gerar nos próximos meses
                  </p>
                </div>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-2 sm:gap-4 pl-3 sm:pl-4 border-l-2 border-success/30">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Dia do mês</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    value={recurringDay}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setRecurringDay(Math.min(31, Math.max(1, val)));
                    }}
                    placeholder="1-31"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Duração</Label>
                  <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurringDurationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category & Subcategory */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Categoria</Label>
            <Select 
              value={category} 
              onValueChange={(value) => {
                const selectedCategory = categoriesData.find(c => c.name === value);
                setCategory(value);
                setCategoryId(selectedCategory?.id || "");
                setSubcategory("");
              }}
              disabled={categoriesLoading}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder={categoriesLoading ? "..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {categoriesData.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Subcategoria</Label>
            <Select 
              value={subcategory} 
              onValueChange={setSubcategory}
              disabled={subcategoriesLoading || !categoryId}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder={!categoryId ? "Categoria" : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {subcategoriesData.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Who Paid & For Whom */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">{type === "income" ? "Recebeu" : "Pagou"}</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Selecione" />
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">{type === "income" ? "Origem" : "Para quem"}</Label>
            <Select 
              value={forWho} 
              onValueChange={(value) => {
                setForWho(value);
                if (type === "expense") {
                  if (value === "Casal") {
                    setIsCouple(true);
                  } else {
                    setIsCouple(false);
                  }
                }
              }} 
              disabled={recipientsLoading}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder={recipientsLoading ? "..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Couple Toggle - Only for Expenses */}
        {type === "expense" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", isCouple ? "text-primary fill-primary" : "text-muted-foreground")} />
                <div>
                  <Label className="text-foreground text-xs sm:text-sm">Compra do Casal</Label>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    Dividir entre os dois
                  </p>
                </div>
              </div>
              <Switch checked={isCouple} onCheckedChange={setIsCouple} />
            </div>

            {/* Valor por pessoa - Only when isCouple is true */}
            {isCouple && numericValue > 0 && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Valor por pessoa</Label>
                <Input
                  value={formatCurrency(valuePerPerson)}
                  readOnly
                  className="text-base sm:text-lg font-semibold bg-muted cursor-not-allowed h-9 sm:h-10"
                />
              </div>
            )}
          </div>
        )}

        {/* Value - For Expense */}
        {type === "expense" && (
          <div className="space-y-1.5 sm:space-y-2">
            {/* Info banner when editing an existing installment */}
            {isEditingInstallment && isEditMode && (
              <div className="p-2 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-2">
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                  <strong>Editando parcela:</strong> Valor mensal.
                  {originalTotalValueCents && (
                    <span className="block mt-1">
                      Total: <strong>{formatCentsToDisplay(originalTotalValueCents)}</strong>
                    </span>
                  )}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
              <Label htmlFor="value" className="text-xs sm:text-sm">
                {isInstallment && valueMode === "installment" ? "Valor Parcela" : "Valor Total"} <span className="text-destructive">*</span>
              </Label>
              {isInstallment && !isEditingInstallment && (
                <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setValueMode("total")}
                    className={cn(
                      "px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium rounded-md transition-all",
                      valueMode === "total"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setValueMode("installment")}
                    className={cn(
                      "px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium rounded-md transition-all",
                      valueMode === "installment"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Parcela
                  </button>
                </div>
              )}
            </div>
            <Input
              id="value"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={value}
              onChange={handleValueChange}
              onFocus={handleValueFocus}
              className={cn("text-xl sm:text-2xl font-semibold h-12 sm:h-14", fieldErrors.value && "border-destructive")}
            />
            {fieldErrors.value && <p className="text-xs sm:text-sm text-destructive">{fieldErrors.value}</p>}
            
            {/* Show calculated total when in installment mode (not when editing existing) */}
            {isInstallment && valueMode === "installment" && numericValue > 0 && !isEditingInstallment && (
              <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Total da compra</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Installment Section - Only for Expenses */}
        {type === "expense" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", isInstallment ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <Label className="text-foreground text-xs sm:text-sm">Parcelado?</Label>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Dividir em parcelas</p>
                </div>
              </div>
              <Switch 
                checked={isInstallment} 
                onCheckedChange={(checked) => {
                  setIsInstallment(checked);
                  if (!checked) setValueMode("total");
                }} 
              />
            </div>

            {isInstallment && (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Nº Parcelas</Label>
                  <Select
                    value={totalInstallments.toString()}
                    onValueChange={(v) => {
                      const newTotal = parseInt(v);
                      setTotalInstallments(newTotal);
                      if (startFromInstallment >= newTotal) {
                        setStartFromInstallment(1);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {installmentOptions.map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}x de {numericValue > 0 
                            ? valueMode === "installment" 
                              ? formatCurrency(numericValue) 
                              : formatCurrency(numericValue / n) 
                            : "R$ 0,00"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Already Started Toggle */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-background/50 border border-border">
                  <div>
                    <Label className="text-foreground text-xs sm:text-sm">Já iniciada?</Label>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Lançar a partir de parcela específica
                    </p>
                  </div>
                  <Switch 
                    checked={isAlreadyStarted} 
                    onCheckedChange={(checked) => {
                      setIsAlreadyStarted(checked);
                      if (!checked) setStartFromInstallment(1);
                    }} 
                  />
                </div>

                {/* Start From Installment Field */}
                {isAlreadyStarted && (
                  <div className="space-y-1.5 sm:space-y-2 pl-3 sm:pl-4 border-l-2 border-primary/30">
                    <Label className="text-xs sm:text-sm">Iniciar da parcela</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={totalInstallments - 1}
                      value={startFromInstallment}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setStartFromInstallment(Math.min(totalInstallments - 1, Math.max(1, val)));
                      }}
                      placeholder="Ex: 3"
                      className="w-24 sm:w-32 h-9 sm:h-10 text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {totalInstallments - startFromInstallment + 1} parcelas ({startFromInstallment} até {totalInstallments})
                    </p>
                  </div>
                )}

                {preview && preview.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Preview das Parcelas
                    </div>
                    <div className="max-h-24 sm:max-h-32 overflow-y-auto space-y-1.5 sm:space-y-2">
                      {preview.map((p) => (
                        <div
                          key={p.number}
                          className="flex items-center justify-between text-[10px] sm:text-sm p-1.5 sm:p-2 rounded-lg bg-background/50"
                        >
                          <span className="text-muted-foreground">
                            {p.number}/{totalInstallments} - {p.date}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(p.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isAlreadyStarted && startFromInstallment > 1 && (
                      <div className="pt-2 border-t border-border space-y-1">
                        <div className="flex items-center justify-between text-[10px] sm:text-sm">
                          <span className="text-muted-foreground">Já pagas</span>
                          <span className="font-medium text-muted-foreground">{startFromInstallment - 1}x {formatCurrency(installmentValue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] sm:text-sm">
                          <span className="text-muted-foreground">Valor pago</span>
                          <span className="font-medium text-amber-600">{formatCurrency((startFromInstallment - 1) * installmentValue)}</span>
                        </div>
                      </div>
                    )}
                    {isCouple && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-[10px] sm:text-sm">
                          <span className="text-muted-foreground">Por pessoa/parcela</span>
                          <span className="font-medium text-primary">{formatCurrency(installmentValue / 2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bank & Payment - Only for Expenses */}
        {type === "expense" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Banco</Label>
                <Select value={bank} onValueChange={setBank} disabled={banksLoading}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder={banksLoading ? "..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        <div className="flex items-center gap-2">
                          {b.color && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                          )}
                          {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder={paymentMethodsLoading ? "..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Income Specific Fields */}
        {type === "income" && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Banco</Label>
              <Select value={receivingBank} onValueChange={setReceivingBank} disabled={banksLoading}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={banksLoading ? "..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      <div className="flex items-center gap-2">
                        {b.color && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                        )}
                        {b.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder={paymentMethodsLoading ? "..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="px-4 pt-3 pb-1">
            <DrawerTitle className="text-base font-bold">{modalTitle}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-auto px-0 max-h-[calc(90vh-140px)]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2 pb-4 px-4">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-auto max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">{modalTitle}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-160px)]">
          {formContent}
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
