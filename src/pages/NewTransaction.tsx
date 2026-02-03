import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Heart,
  Check,
  ArrowLeft,
  CreditCard,
  Loader2,
  Camera,
  ScanLine,
  ShoppingCart,
  Tag,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useComprovantesMutations } from "@/hooks/useComprovantes";

// Helper to compress image before sending to Edge Function
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // Slighting smaller for better stability
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG 0.6 quality for smaller payload
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
import { useToast } from "@/hooks/use-toast";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useRecipients } from "@/hooks/useRecipients";
import { useCreateTransaction, useUpdateTransaction, useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useSplitCalculation } from "@/hooks/useSplitCalculation";
import {
  parseCurrencyToCents,
  centsToReais,
  reaisToCents,
  formatCentsToDisplay,
  calculateInstallmentCents,
  calculateTotalFromInstallmentCents,
  validateInstallmentValues,
} from "@/lib/currency";

// Validation schema for transactions
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

export default function NewTransaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const duplicateId = searchParams.get("duplicate");
  const isEditMode = !!editId;
  const isDuplicateMode = !!duplicateId;
  const loadId = editId || duplicateId;

  const { toast } = useToast();
  const { members, person1, person2 } = usePersonNames();
  const persons = members.map(m => m.name);
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { calculateSplitForTransaction } = useSplitCalculation();

  const { uploadComprovante, saveItensExtraidos } = useComprovantesMutations();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [observacao, setObservacao] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // Fetch categories based on transaction type
  const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories(type);
  // Fetch subcategories based on selected category
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

  // Installment fields
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState<number>(2);
  const [isAlreadyStarted, setIsAlreadyStarted] = useState(false);
  const [startFromInstallment, setStartFromInstallment] = useState<number>(1);

  // Value mode: "total" or "installment"
  const [valueMode, setValueMode] = useState<"total" | "installment">("total");

  // Recurring income fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(1);
  const [recurringDuration, setRecurringDuration] = useState<string>("indefinite");

  // Receipt Scanning
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    total_value?: number;
    date?: string;
    merchant_name?: string;
    category?: string;
    items?: Array<{ nome: string; quantidade?: number; valor?: number; categoria?: string }>;
    tags?: string[];
    summary?: string;
  } | null>(null);
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmScan = () => {
    if (!scannedResult) return;

    const { total_value, date: scanDate, merchant_name, category: scanCategory } = scannedResult;

    if (total_value) {
      setValue(formatCentsToDisplay(reaisToCents(Number(total_value))));
    }
    if (scanDate) {
      try {
        const [y, m, d] = scanDate.split("-").map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setDate(new Date(y, m - 1, d, 12));
        }
      } catch (e) {
        console.error("Error parsing scan date:", e);
      }
    }
    if (merchant_name) {
      setDescription(merchant_name);
    }
    if (scannedResult.summary) {
      setObservacao(prev => prev ? `${prev}\n${scannedResult.summary}` : (scannedResult.summary || ''));
    }
    if (scanCategory) {
      const rawCat = scanCategory.toLowerCase();
      const match = categoriesData.find(c =>
        c.name.toLowerCase().includes(rawCat) || rawCat.includes(c.name.toLowerCase())
      );
      if (match) {
        setCategory(match.name);
        setCategoryId(match.id);
      }
    }

    setShowScanConfirm(false);
    setScannedResult(null);
    toast({
      title: "Dados aplicados!",
      description: "O formulário foi preenchido com as informações do cupom.",
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannedFile(file);
    setIsScanning(true);
    try {
      const base64 = await compressImage(file);

      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { image: base64 }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Save result and show modal instead of direct population
      setScannedResult(data);
      setShowScanConfirm(true);

    } catch (err: any) {
      console.error("Scanning error:", err);
      let errorDetail = err.message || "";

      // If error message contains JSON (from our new backend structured error)
      if (err.message && err.message.includes("{")) {
        try {
          const parsed = JSON.parse(err.message.substring(err.message.indexOf("{")));
          errorDetail = parsed.error || errorDetail;
        } catch (e) { }
      }

      toast({
        variant: "destructive",
        title: "Erro ao ler cupom",
        description: `Verifique se a foto está clara. ${errorDetail}`,
      });
    } finally {
      setIsScanning(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Field validation errors
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

  // Load transaction data if editing or duplicating
  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && !transactionsLoading && transactionsData.length > 0 && !isInitialized) {
      const transaction = transactionsData.find(t => t.id === loadId);
      if (transaction) {
        // Use current date when duplicating, original date when editing
        setDate(isDuplicateMode ? new Date() : parseISO(transaction.date));
        // Remove installment suffix from description if present
        const cleanDescription = transaction.description.replace(/\s*\(Parcela \d+\/\d+\)$/, "");
        setDescription(cleanDescription);
        setObservacao(transaction.observacao || "");
        setType(transaction.type);
        setCategory(transaction.category || "");
        setSubcategory(transaction.subcategory || "");
        setPaidBy(transaction.paid_by || "");
        setForWho(transaction.for_who || "");
        setIsCouple(transaction.is_couple || false);
        // For installment transactions, show installment value; otherwise show total
        const isNewStyleInstallment = transaction.is_installment &&
          transaction.installment_value &&
          transaction.installment_value > 0 &&
          !transaction.is_generated_installment;

        if (isNewStyleInstallment) {
          setValue(formatCentsToDisplay(reaisToCents(transaction.installment_value!)));
          setValueMode("installment");
        } else {
          setValue(formatCentsToDisplay(reaisToCents(transaction.total_value)));
        }
        setIncomeOrigin(transaction.income_origin || "");
        // Initialize installment settings
        setIsInstallment(transaction.is_installment || false);
        setTotalInstallments(transaction.total_installments || 2);

        // Initialize "Already Started" state
        if (transaction.is_installment && transaction.installment_number && transaction.installment_number > 1) {
          setIsAlreadyStarted(true);
          setStartFromInstallment(transaction.installment_number);
        } else {
          setIsAlreadyStarted(false);
          setStartFromInstallment(1);
        }

        // Set bank and payment method names
        const bankRecord = banks.find(b => b.id === transaction.bank_id);
        if (bankRecord) setBank(bankRecord.name);

        const paymentMethodRecord = paymentMethods.find(p => p.id === transaction.payment_method_id);
        if (paymentMethodRecord) setPaymentMethod(paymentMethodRecord.name);

        const receivingBankRecord = banks.find(b => b.id === transaction.receiving_bank_id);
        if (receivingBankRecord) setReceivingBank(receivingBankRecord.name);

        // Set category ID for subcategory loading
        const categoryRecord = categoriesData.find(c => c.name === transaction.category);
        if (categoryRecord) setCategoryId(categoryRecord.id);

        setIsInitialized(true);
      }
    }
  }, [isEditMode, isDuplicateMode, loadId, transactionsData, transactionsLoading, banks, paymentMethods, categoriesData, isInitialized]);

  // Parse input value to cents using currency utilities
  const inputValueCents = parseCurrencyToCents(value);
  const numericValue = centsToReais(inputValueCents);

  // Calculate total and installment values based on mode
  let totalValueCents: number;
  let installmentValueCents: number;

  if (valueMode === "installment") {
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

  // Convert to reais for display and submission
  const totalValue = centsToReais(totalValueCents);
  const installmentValue = centsToReais(installmentValueCents);

  // Calculate value per person using split settings (proporcional, personalizado, or 50-50)
  const splitResult = calculateSplitForTransaction(totalValue, category, subcategory);
  const valuePerPerson = isCouple ? splitResult.person1 : totalValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFieldErrors({});

    // Validate required fields - only value is mandatory
    const errors: FieldErrors = {};

    if (numericValue <= 0) {
      errors.value = type === "income" ? "Informe o valor da receita" : "Informe o valor da despesa";
    }

    // If there are errors, set them and stop submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Campo obrigatório",
        description: "Informe o valor do lançamento.",
        variant: "destructive",
      });
      return;
    }

    // Validate form data with Zod
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

    setIsSaving(true);

    try {
      const selectedBank = banks.find((b) => b.name === bank);
      const selectedPaymentMethod = paymentMethods.find((p) => p.name === paymentMethod);
      const selectedRecipient = recipients.find((r) => r.name === forWho);
      const selectedReceivingBank = banks.find((b) => b.name === receivingBank);

      const transactionData: any = {
        date: format(date, "yyyy-MM-dd"),
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
        // Explicitly send installment_number because useUpdateTransaction ignores start_from_installment
        installment_number: isInstallment && isAlreadyStarted ? startFromInstallment : 1,
        start_from_installment: isInstallment && isAlreadyStarted ? startFromInstallment : undefined,
        modo_valor_informado: isInstallment ? valueMode : undefined,
        // Recurring fields (only for income)
        is_recurring: type === "income" && isRecurring,
        recurring_day: type === "income" && isRecurring ? recurringDay : undefined,
        recurring_duration: type === "income" && isRecurring ? recurringDuration : undefined,
        // Comprovantes and Extraction
        tags: scannedResult?.tags,
        resumo_curto: scannedResult?.summary,
        status_extracao: scannedResult ? 'concluido' : undefined,
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
          navigate("/lancamentos");
        }, 1000);
      } else {
        const result = await createTransaction.mutateAsync(transactionData);

        // Handle attachments and items from Scan
        if (result?.id && (scannedFile || scannedResult?.items)) {
          try {
            if (scannedFile) {
              await uploadComprovante.mutateAsync({
                lancamentoId: result.id,
                file: scannedFile,
              });
            }
            if (scannedResult?.items && scannedResult.items.length > 0) {
              await saveItensExtraidos.mutateAsync({
                lancamentoId: result.id,
                itens: scannedResult.items as any,
                tags: scannedResult.tags || [],
                resumoCurto: scannedResult.summary || '',
                adicionarResumoObservacao: false
              });
            }
          } catch (err) {
            console.error("Error saving capture details:", err);
          }
        }


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
          navigate("/lancamentos");
        }, 1000);
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

  // Format value as Brazilian currency mask using centralized currency utilities
  const formatCurrencyMask = (input: string): string => {
    const cents = parseCurrencyToCents(input);
    if (cents === 0) return "";
    return formatCentsToDisplay(cents);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyMask(e.target.value);
    setValue(formatted);
    // Extract numeric value for validation
    const num = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    if (num > 0) setFieldErrors(prev => ({ ...prev, value: undefined }));
  };

  const handleValueFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const isLoading = banksLoading || paymentMethodsLoading || recipientsLoading || ((isEditMode || isDuplicateMode) && transactionsLoading);

  // Generate installment preview
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {isEditMode ? "Editar Lançamento" : isDuplicateMode ? "Duplicar Lançamento" : "Novo Lançamento"}
          </h1>

          {!isEditMode && !isDuplicateMode && (
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleReceiptUpload}
              />
              <Button
                variant="outline"
                className="gap-2 w-full md:w-auto border-dashed border-primary/50 hover:bg-primary/5 hover:border-primary text-primary"
                onClick={handleScanClick}
                disabled={isScanning}
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isScanning ? "Lendo Cupom..." : "Escanear Cupom Fiscal"}
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">
            {isEditMode ? "Altere os dados da transação" : isDuplicateMode ? "Crie um novo lançamento baseado no anterior" : "Registre uma nova transação para o casal"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-8">
            {/* Type Toggle */}
            <div className="flex items-center justify-center gap-4">
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
                  "px-6 py-3 rounded-xl font-medium transition-all duration-300",
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
                  "px-6 py-3 rounded-xl font-medium transition-all duration-300",
                  type === "income"
                    ? "bg-success text-success-foreground shadow-soft"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Receita
              </button>
            </div>

            {/* Date & Description */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date-trigger">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-trigger"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        fieldErrors.date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
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
                {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder={type === "income" ? "Ex: Salário, Pix cliente X, Cashback cartão" : "Ex: Supermercado Extra"}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  className={cn(fieldErrors.description && "border-destructive")}
                />
                {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Detalhes do gasto, contexto, o que foi comprado, para quem foi, motivo, etc."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="min-h-[80px] resize-y"
                maxLength={1500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {observacao.length}/1500
              </p>
            </div>

            {/* Value - For Income (before Category) */}
            {type === "income" && (
              <div className="space-y-2">
                <Label htmlFor="value">Valor Total <span className="text-destructive">*</span></Label>
                <Input
                  id="value"
                  type="text"
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={value}
                  onChange={handleValueChange}
                  onFocus={handleValueFocus}
                  className={cn("text-2xl font-semibold h-14", fieldErrors.value && "border-destructive")}
                />
                {fieldErrors.value && <p className="text-sm text-destructive">{fieldErrors.value}</p>}
              </div>
            )}

            {/* Recurring Income Toggle - Only for Income */}
            {type === "income" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className={cn("w-5 h-5", isRecurring ? "text-success" : "text-muted-foreground")} />
                    <div>
                      <Label htmlFor="recurring-switch" className="text-foreground">Receita mensal recorrente</Label>
                      <p className="text-sm text-muted-foreground">
                        Gerar automaticamente nos próximos meses
                      </p>
                    </div>
                  </div>
                  <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>

                {isRecurring && (
                  <div className="grid md:grid-cols-2 gap-6 pl-4 border-l-2 border-success/30">
                    <div className="space-y-2">
                      <Label htmlFor="recurring_day">Dia do mês</Label>
                      <Input
                        id="recurring_day"
                        name="recurring_day"
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
                      />
                      <p className="text-xs text-muted-foreground">
                        A receita será lançada neste dia todo mês
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurring-duration-trigger">Duração</Label>
                      <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                        <SelectTrigger id="recurring-duration-trigger">
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
                      <p className="text-xs text-muted-foreground">
                        {recurringDuration === "indefinite"
                          ? "Serão gerados 12 lançamentos futuros"
                          : `Serão gerados ${recurringDuration} lançamentos`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category & Subcategory */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category-trigger">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    const selectedCategory = categoriesData.find(c => c.name === value);
                    setCategory(value);
                    setCategoryId(selectedCategory?.id || "");
                    setSubcategory(""); // Reset subcategory when category changes
                    if (value) setFieldErrors(prev => ({ ...prev, category: undefined }));
                  }}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger id="category-trigger" className={cn(fieldErrors.category && "border-destructive")}>
                    <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Map(categoriesData.map(c => [c.name, c])).values()).map((c, idx) => (
                      <SelectItem key={`${c.id}-${idx}`} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category && <p className="text-sm text-destructive">{fieldErrors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-trigger">Subcategoria</Label>
                <Select
                  value={subcategory}
                  onValueChange={setSubcategory}
                  disabled={subcategoriesLoading || !categoryId}
                >
                  <SelectTrigger id="subcategory-trigger">
                    <SelectValue placeholder={!categoryId ? "Selecione uma categoria" : subcategoriesLoading ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Map(subcategoriesData.map(s => [s.name, s])).values()).map((s, idx) => (
                      <SelectItem key={`${s.id}-${idx}`} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Who Paid & For Whom */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="paid-by-trigger">{type === "income" ? "Quem recebeu" : "Quem pagou"}</Label>
                <Select
                  value={paidBy}
                  onValueChange={(v) => {
                    setPaidBy(v);
                    if (v) setFieldErrors(prev => ({ ...prev, paidBy: undefined }));
                  }}
                >
                  <SelectTrigger id="paid-by-trigger" className={cn(fieldErrors.paidBy && "border-destructive")}>
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
                {fieldErrors.paidBy && <p className="text-sm text-destructive">{fieldErrors.paidBy}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="for-who-trigger">{type === "income" ? "Origem da receita" : "Para quem"}</Label>
                <Select
                  value={forWho}
                  onValueChange={(value) => {
                    setForWho(value);
                    // Auto-toggle "Compra do Casal" based on selection
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
                  <SelectTrigger id="for-who-trigger">
                    <SelectValue placeholder={recipientsLoading ? "Carregando..." : "Selecione"} />
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Heart className={cn("w-5 h-5", isCouple ? "text-primary fill-primary" : "text-muted-foreground")} />
                  <div>
                    <Label htmlFor="couple-switch" className="text-foreground">Compra do Casal</Label>
                    <p className="text-sm text-muted-foreground">
                      O valor será dividido entre os dois
                    </p>
                  </div>
                </div>
                <Switch id="couple-switch" checked={isCouple} onCheckedChange={setIsCouple} />
              </div>
            )}

            {/* Value - For Expense (after Couple Toggle) */}
            {type === "expense" && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label htmlFor="value">
                    {isInstallment && valueMode === "installment" ? "Valor da Parcela" : "Valor Total"} <span className="text-destructive">*</span>
                  </Label>
                  {isInstallment && (
                    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setValueMode("total")}
                        className={cn(
                          "px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
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
                          "px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
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
                  className={cn("text-2xl font-semibold h-14", fieldErrors.value && "border-destructive")}
                />
                {fieldErrors.value && <p className="text-sm text-destructive">{fieldErrors.value}</p>}

                {/* Show calculated total when in installment mode */}
                {isInstallment && valueMode === "installment" && numericValue > 0 && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor total da compra</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Value Preview */}
            {isCouple && numericValue > 0 && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-sm text-muted-foreground mb-2">
                  Divisão do valor {isInstallment ? "(por parcela)" : ""}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{person1} ({splitResult.person1Percentage}%)</p>
                    <p className="text-base font-semibold text-primary">
                      {formatCurrency(isInstallment ? installmentValue * (splitResult.person1Percentage / 100) : splitResult.person1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{person2} ({splitResult.person2Percentage}%)</p>
                    <p className="text-base font-semibold text-primary">
                      {formatCurrency(isInstallment ? installmentValue * (splitResult.person2Percentage / 100) : splitResult.person2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Installment Section - Only for Expenses */}
            {type === "expense" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <CreditCard className={cn("w-5 h-5", isInstallment ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <Label htmlFor="installment-switch" className="text-foreground">Parcelado?</Label>
                      <p className="text-sm text-muted-foreground">
                        Dividir em múltiplas parcelas
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="installment-switch"
                    checked={isInstallment}
                    onCheckedChange={(checked) => {
                      setIsInstallment(checked);
                      if (!checked) setValueMode("total");
                    }}
                  />
                </div>

                {isInstallment && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="installments-count-trigger">Número de Parcelas</Label>
                      <Select
                        value={totalInstallments.toString()}
                        onValueChange={(v) => {
                          const newTotal = parseInt(v);
                          setTotalInstallments(newTotal);
                          // Reset startFromInstallment if it exceeds new total
                          if (startFromInstallment >= newTotal) {
                            setStartFromInstallment(1);
                          }
                        }}
                      >
                        <SelectTrigger id="installments-count-trigger">
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

                    {/* Already Started Purchase Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                      <div>
                        <Label htmlFor="already-started-switch" className="text-foreground text-sm">Compra já iniciada?</Label>
                        <p className="text-xs text-muted-foreground">
                          Se já pagou algumas parcelas
                        </p>
                      </div>
                      <Switch
                        id="already-started-switch"
                        checked={isAlreadyStarted}
                        onCheckedChange={(checked) => {
                          setIsAlreadyStarted(checked);
                          if (!checked) setStartFromInstallment(1);
                        }}
                      />
                    </div>

                    {/* Start From Installment Select */}
                    {isAlreadyStarted && (
                      <div className="space-y-2">
                        <Label htmlFor="start-installment-trigger">Começar a partir da parcela</Label>
                        <Select
                          value={startFromInstallment.toString()}
                          onValueChange={(v) => setStartFromInstallment(parseInt(v))}
                        >
                          <SelectTrigger id="start-installment-trigger">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: totalInstallments }, (_, i) => i + 1).map((n) => (
                              <SelectItem key={n} value={n.toString()}>
                                {n}/{totalInstallments}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Serão criadas {totalInstallments - startFromInstallment + 1} parcelas (de {startFromInstallment} até {totalInstallments})
                        </p>
                      </div>
                    )}

                    {/* Installment Preview */}
                    {preview && preview.length > 0 && (
                      <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CreditCard className="w-4 h-4" />
                          Preview das Parcelas
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {preview.map((p) => (
                            <div
                              key={p.number}
                              className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50"
                            >
                              <span className="text-muted-foreground">
                                Parcela {p.number}/{totalInstallments} - {p.date}
                              </span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(p.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {isCouple && (
                          <div className="pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground mb-1">Divisão (cada parcela)</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">{person1}:</span>{" "}
                                <span className="font-medium text-primary">
                                  {formatCurrency(installmentValue * (splitResult.person1Percentage / 100))}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{person2}:</span>{" "}
                                <span className="font-medium text-primary">
                                  {formatCurrency(installmentValue * (splitResult.person2Percentage / 100))}
                                </span>
                              </div>
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bank-trigger">Banco Pagador</Label>
                  <Select
                    value={bank}
                    onValueChange={(v) => {
                      setBank(v);
                      if (v) setFieldErrors(prev => ({ ...prev, bank: undefined }));
                    }}
                    disabled={banksLoading}
                  >
                    <SelectTrigger id="bank-trigger" className={cn(fieldErrors.bank && "border-destructive")}>
                      <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          <div className="flex items-center gap-2">
                            {b.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: b.color }}
                              />
                            )}
                            {b.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.bank && <p className="text-sm text-destructive">{fieldErrors.bank}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method-trigger">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                    <SelectTrigger id="payment-method-trigger">
                      <SelectValue placeholder={paymentMethodsLoading ? "Carregando..." : "Selecione"} />
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

            {/* Income Specific Fields */}
            {type === "income" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="receiving-bank-trigger">Banco de Recebimento</Label>
                  <Select
                    value={receivingBank}
                    onValueChange={(v) => {
                      setReceivingBank(v);
                      if (v) setFieldErrors(prev => ({ ...prev, receivingBank: undefined }));
                    }}
                    disabled={banksLoading}
                  >
                    <SelectTrigger id="receiving-bank-trigger" className={cn(fieldErrors.receivingBank && "border-destructive")}>
                      <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          <div className="flex items-center gap-2">
                            {b.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: b.color }}
                              />
                            )}
                            {b.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.receivingBank && <p className="text-sm text-destructive">{fieldErrors.receivingBank}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-payment-method-trigger">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                    <SelectTrigger id="income-payment-method-trigger">
                      <SelectValue placeholder={paymentMethodsLoading ? "Carregando..." : "Selecione"} />
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || isLoading} className="min-w-32">
                {showSuccess ? (
                  <Check className="w-5 h-5 animate-check" />
                ) : isSaving ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isEditMode ? "Salvar Alterações" : "Salvar Lançamento"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Scanned Data Confirmation Modal */}
      <Dialog open={showScanConfirm} onOpenChange={setShowScanConfirm}>
        <DialogContent className="max-w-md bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ScanLine className="w-5 h-5" />
              Confirmar Dados do Cupom
            </DialogTitle>
            <DialogDescription>
              A IA identificou as seguintes informações no cupom. Deseja aplicá-las ao formulário?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Estabelecimento:</span>
              <span className="col-span-2 font-display font-medium">{scannedResult?.merchant_name || 'Não identificado'}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 border-t border-border pt-3">
              <span className="text-sm font-medium text-muted-foreground">Valor Total:</span>
              <span className="col-span-2 font-display text-xl font-bold text-primary">
                {scannedResult?.total_value ? `R$ ${scannedResult.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4 border-t border-border pt-3">
              <span className="text-sm font-medium text-muted-foreground">Data:</span>
              <span className="col-span-2 capitalize">
                {scannedResult?.date ? format(new Date(scannedResult.date.split('-').map(Number)[0], scannedResult.date.split('-').map(Number)[1] - 1, scannedResult.date.split('-').map(Number)[2], 12), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não identificada'}
              </span>
            </div>

            {scannedResult?.summary && (
              <div className="grid grid-cols-3 items-start gap-4 border-t border-border pt-3">
                <span className="text-sm font-medium text-muted-foreground">Resumo:</span>
                <span className="col-span-2 text-sm italic">"{scannedResult.summary}"</span>
              </div>
            )}

            {scannedResult?.items && scannedResult.items.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  Itens Identificados ({scannedResult.items.length})
                </div>
                <div className="space-y-2">
                  {scannedResult.items.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-secondary/30 p-2 rounded-lg">
                      <span className="truncate mr-2">{item.quantidade ? `${item.quantidade}x ` : ''}{item.nome}</span>
                      <span className="font-medium whitespace-nowrap">
                        {item.valor ? `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </span>
                    </div>
                  ))}
                  {scannedResult.items.length > 10 && (
                    <p className="text-[10px] text-center text-muted-foreground">E mais {scannedResult.items.length - 10} itens...</p>
                  )}
                </div>
              </div>
            )}

            {scannedResult?.tags && scannedResult.tags.length > 0 && (
              <div className="grid grid-cols-3 items-start gap-4 border-t border-border pt-3">
                <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {scannedResult.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] py-0">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowScanConfirm(false)}>
              Descartar
            </Button>
            <Button onClick={handleConfirmScan} className="gap-2">
              <Check className="w-4 h-4" />
              Confirmar e Preencher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
