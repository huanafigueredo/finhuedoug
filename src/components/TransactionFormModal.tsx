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
import { useSplitCalculation } from "@/hooks/useSplitCalculation";
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
  const { calculateSplitForTransaction } = useSplitCalculation();

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
  
  // Calculate value per person using split settings (proporcional, personalizado, or 50-50)
  const splitResult = calculateSplitForTransaction(totalValue, category, subcategory);
  // valuePerPerson represents how much person1 pays (based on split settings)
  const valuePerPerson = isCouple ? splitResult.person1 : totalValue;

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
      {/* Type Toggle - Always on top and centered */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-6 border-b border-border/50 mb-6">
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
            "px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
            type === "expense"
              ? "bg-primary text-primary-foreground shadow-lg scale-105"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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
            "px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
            type === "income"
              ? "bg-success text-success-foreground shadow-lg scale-105"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          )}
        >
          Receita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Details */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
              <Check className="w-4 h-4" /> Detalhes principais
            </h3>
            
            {/* Value Field - Large and emphasized */}
            <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <Label htmlFor="value" className="text-xs font-semibold text-primary">
                {isInstallment && valueMode === "installment" ? "Valor da Parcela" : "Valor Total"}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">R$</span>
                <Input
                  id="value"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={value.replace("R$ ", "")}
                  onChange={handleValueChange}
                  onFocus={handleValueFocus}
                  className={cn(
                    "pl-12 text-3xl font-black h-16 border-none bg-transparent focus-visible:ring-0 shadow-none",
                    fieldErrors.value && "text-destructive"
                  )}
                />
              </div>
              {fieldErrors.value && <p className="text-xs text-destructive font-medium">{fieldErrors.value}</p>}
              
              {isInstallment && valueMode === "installment" && numericValue > 0 && !isEditingInstallment && (
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Total da compra: <span className="font-bold text-foreground">{formatCurrency(totalValue)}</span>
                </p>
              )}
            </div>

            {/* Date & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Data</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 rounded-xl",
                        !date && "text-muted-foreground",
                        fieldErrors.date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                      {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        if (d) setFieldErrors(prev => ({ ...prev, date: undefined }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Onde ou o quê?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Observation */}
            <div className="space-y-2">
              <Label htmlFor="observacao" className="text-xs font-semibold">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Mais detalhes sobre este lançamento..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="min-h-[100px] rounded-xl resize-none"
                maxLength={1500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{observacao.length}/1500</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Classification & Settings */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-6 p-5 rounded-2xl bg-muted/40 border border-border/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Classificação
            </h3>

            {/* Category Section */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Categoria</Label>
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
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Subcategoria</Label>
                <Select value={subcategory} onValueChange={setSubcategory} disabled={!categoryId}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriesData.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ownership Section */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Pagou</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Para quem</Label>
                <Select value={forWho} onValueChange={(val) => { setForWho(val); setIsCouple(val === "Casal"); }}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Couple & Installments Toggles */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              {type === "expense" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Heart className={cn("w-4 h-4", isCouple ? "text-primary fill-primary" : "text-muted-foreground")} />
                    <Label className="text-xs font-semibold cursor-pointer">Compra do Casal</Label>
                  </div>
                  <Switch checked={isCouple} onCheckedChange={setIsCouple} />
                </div>
              )}

              {type === "expense" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CreditCard className={cn("w-4 h-4", isInstallment ? "text-primary" : "text-muted-foreground")} />
                    <Label className="text-xs font-semibold cursor-pointer">Parcelado?</Label>
                  </div>
                  <Switch checked={isInstallment} onCheckedChange={val => { setIsInstallment(val); if (!val) setValueMode("total"); }} />
                </div>
              )}

              {type === "income" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className={cn("w-4 h-4", isRecurring ? "text-success" : "text-muted-foreground")} />
                    <Label className="text-xs font-semibold cursor-pointer">Recorrente?</Label>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>
              )}
            </div>

            {/* Bank & Payment Method */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
               <div className="space-y-2">
                <Label className="text-xs font-semibold">Banco</Label>
                <Select value={type === "income" ? receivingBank : bank} onValueChange={type === "income" ? setReceivingBank : setBank}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(b => (
                      <SelectItem key={b.id} value={b.name}>
                        <div className="flex items-center gap-2">
                          {b.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />}
                          {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Meio</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditional Sections (Installments/Recurring) below the main cards if active */}
          {isInstallment && type === "expense" && (
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-primary uppercase">Configurações de Parcelamento</Label>
                  {!isEditingInstallment && (
                    <div className="flex gap-1 bg-muted p-1 rounded-md">
                      <button type="button" onClick={() => setValueMode("total")} className={cn("px-2 py-1 text-[10px] font-bold rounded", valueMode === "total" ? "bg-background shadow-sm" : "text-muted-foreground")}>TOTAL</button>
                      <button type="button" onClick={() => setValueMode("installment")} className={cn("px-2 py-1 text-[10px] font-bold rounded", valueMode === "installment" ? "bg-background shadow-sm" : "text-muted-foreground")}>PARCELA</button>
                    </div>
                  )}
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Quantidade de Parcelas</Label>
                    <Select value={totalInstallments.toString()} onValueChange={v => setTotalInstallments(parseInt(v))}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map(n => (
                          <SelectItem key={n} value={n.toString()}>{n}x de {formatCurrency(totalValue / n)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Já iniciada?</span>
                    <Switch checked={isAlreadyStarted} onCheckedChange={val => { setIsAlreadyStarted(val); if(!val) setStartFromInstallment(1); }} />
                  </div>

                  {isAlreadyStarted && (
                    <div className="flex items-center gap-3 bg-background p-2 rounded-lg border border-border">
                       <Label className="text-xs font-semibold">Parcela atual:</Label>
                       <Select value={String(startFromInstallment)} onValueChange={v => setStartFromInstallment(parseInt(v))}>
                          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: totalInstallments }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={String(num)}>{num}/{totalInstallments}</SelectItem>
                            ))}
                          </SelectContent>
                       </Select>
                    </div>
                  )}
               </div>
            </div>
          )}

          {isRecurring && type === "income" && (
            <div className="p-5 rounded-2xl bg-success/5 border border-success/10 space-y-4 animate-in fade-in slide-in-from-top-2">
               <Label className="text-xs font-bold text-success uppercase">Configurações de Recorrência</Label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Dia do mês</Label>
                    <Input type="number" min={1} max={31} value={recurringDay} onChange={e => setRecurringDay(parseInt(e.target.value))} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Duração</Label>
                    <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {recurringDurationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh] rounded-t-[32px]">
          <DrawerHeader className="px-6 pt-4 pb-2 text-center border-b border-border/50">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
            <DrawerTitle className="text-xl font-black">{modalTitle}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-auto px-0">
            <div className="pb-24">
              {formContent}
            </div>
          </ScrollArea>
          <DrawerFooter className="absolute bottom-0 left-0 right-0 pt-4 pb-8 px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl ring-1 ring-black/5">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-3xl font-black tracking-tight">{modalTitle}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(92vh-180px)]">
          <div className="py-2">
            {formContent}
          </div>
        </ScrollArea>
        <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/10">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
