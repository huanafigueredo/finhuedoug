import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Heart, Check, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useRecipients } from "@/hooks/useRecipients";
import { useCreateTransaction, useUpdateTransaction, useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";

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

const persons = ["Huana", "Douglas"];
const installmentOptions = [2, 3, 4, 5, 6, 10, 12];
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
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();
  const { data: transactionsData = [], isLoading: transactionsLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
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

  // Recurring income fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(1);
  const [recurringDuration, setRecurringDuration] = useState<string>("indefinite");

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
        setType(transaction.type);
        setCategory(transaction.category || "");
        setSubcategory(transaction.subcategory || "");
        setPaidBy(transaction.paid_by || "");
        setForWho(transaction.for_who || "");
        setIsCouple(transaction.is_couple || false);
        setValue(transaction.total_value.toString().replace(".", ","));
        setIncomeOrigin(transaction.income_origin || "");
        setIsInstallment(transaction.is_installment || false);
        setTotalInstallments(transaction.total_installments || 2);
        
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

  const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const valuePerPerson = isCouple ? numericValue / 2 : numericValue;
  const installmentValue = isInstallment && totalInstallments > 1 ? numericValue / totalInstallments : numericValue;

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
      value: numericValue,
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

      const transactionData = {
        date: format(date, "yyyy-MM-dd"),
        description,
        type,
        category: category || undefined,
        subcategory: subcategory || undefined,
        total_value: numericValue,
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
        // Recurring fields (only for income)
        is_recurring: type === "income" && isRecurring,
        recurring_day: type === "income" && isRecurring ? recurringDay : undefined,
        recurring_duration: type === "income" && isRecurring ? recurringDuration : undefined,
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
        await createTransaction.mutateAsync(transactionData);
        setShowSuccess(true);
        setTimeout(() => {
          let toastDescription = "O lançamento foi registrado com sucesso.";
          if (isInstallment && totalInstallments > 1) {
            toastDescription = `Criadas ${totalInstallments} parcelas de ${formatCurrency(installmentValue)}`;
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

  const isLoading = banksLoading || paymentMethodsLoading || recipientsLoading || ((isEditMode || isDuplicateMode) && transactionsLoading);

  // Generate installment preview
  const installmentPreview = () => {
    if (!isInstallment || totalInstallments <= 1 || !date || numericValue <= 0) return null;
    
    const previews = [];
    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDate = addMonths(date, i - 1);
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
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
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          setDate(d);
                          if (d) setFieldErrors(prev => ({ ...prev, date: undefined }));
                        }}
                        initialFocus
                        className="pointer-events-auto"
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

              {/* Value - For Income (before Category) */}
              {type === "income" && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Total <span className="text-destructive">*</span></Label>
                  <Input
                    id="value"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      const num = parseFloat(e.target.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
                      if (num > 0) setFieldErrors(prev => ({ ...prev, value: undefined }));
                    }}
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
                        <Label className="text-foreground">Receita mensal recorrente</Label>
                        <p className="text-sm text-muted-foreground">
                          Gerar automaticamente nos próximos meses
                        </p>
                      </div>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>

                  {isRecurring && (
                    <div className="grid md:grid-cols-2 gap-6 pl-4 border-l-2 border-success/30">
                      <div className="space-y-2">
                        <Label>Dia do mês</Label>
                        <Input
                          type="number"
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
                        <Label>Duração</Label>
                        <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                          <SelectTrigger>
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
                  <Label>Categoria</Label>
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
                    <SelectTrigger className={cn(fieldErrors.category && "border-destructive")}>
                      <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.category && <p className="text-sm text-destructive">{fieldErrors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Subcategoria</Label>
                  <Select 
                    value={subcategory} 
                    onValueChange={setSubcategory}
                    disabled={subcategoriesLoading || !categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!categoryId ? "Selecione uma categoria" : subcategoriesLoading ? "Carregando..." : "Selecione"} />
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{type === "income" ? "Quem recebeu" : "Quem pagou"}</Label>
                  <Select 
                    value={paidBy} 
                    onValueChange={(v) => {
                      setPaidBy(v);
                      if (v) setFieldErrors(prev => ({ ...prev, paidBy: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(fieldErrors.paidBy && "border-destructive")}>
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
                  <Label>{type === "income" ? "Origem da receita" : "Para quem"}</Label>
                  <Select value={forWho} onValueChange={setForWho} disabled={recipientsLoading}>
                    <SelectTrigger>
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
                      <Label className="text-foreground">Compra do Casal</Label>
                      <p className="text-sm text-muted-foreground">
                        O valor será dividido entre os dois
                      </p>
                    </div>
                  </div>
                  <Switch checked={isCouple} onCheckedChange={setIsCouple} />
                </div>
              )}

              {/* Value - For Expense (after Couple Toggle) */}
              {type === "expense" && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Total <span className="text-destructive">*</span></Label>
                  <Input
                    id="value"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      const num = parseFloat(e.target.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
                      if (num > 0) setFieldErrors(prev => ({ ...prev, value: undefined }));
                    }}
                    className={cn("text-2xl font-semibold h-14", fieldErrors.value && "border-destructive")}
                  />
                  {fieldErrors.value && <p className="text-sm text-destructive">{fieldErrors.value}</p>}
                </div>
              )}

              {/* Value Preview */}
              {isCouple && numericValue > 0 && !isInstallment && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Valor por pessoa
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(valuePerPerson)}
                    </span>
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
                        <Label className="text-foreground">Parcelado?</Label>
                        <p className="text-sm text-muted-foreground">
                          Dividir em múltiplas parcelas
                        </p>
                      </div>
                    </div>
                    <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
                  </div>

                  {isInstallment && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Número de Parcelas</Label>
                        <Select
                          value={totalInstallments.toString()}
                          onValueChange={(v) => setTotalInstallments(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {installmentOptions.map((n) => (
                              <SelectItem key={n} value={n.toString()}>
                                {n}x de {numericValue > 0 ? formatCurrency(numericValue / n) : "R$ 0,00"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Valor por pessoa (cada parcela)</span>
                                <span className="font-medium text-primary">
                                  {formatCurrency(installmentValue / 2)}
                                </span>
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
                    <Label>Banco Pagador</Label>
                    <Select 
                      value={bank} 
                      onValueChange={(v) => {
                        setBank(v);
                        if (v) setFieldErrors(prev => ({ ...prev, bank: undefined }));
                      }} 
                      disabled={banksLoading}
                    >
                      <SelectTrigger className={cn(fieldErrors.bank && "border-destructive")}>
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
                    <Label>Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                      <SelectTrigger>
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
                    <Label>Banco de Recebimento</Label>
                    <Select 
                      value={receivingBank} 
                      onValueChange={(v) => {
                        setReceivingBank(v);
                        if (v) setFieldErrors(prev => ({ ...prev, receivingBank: undefined }));
                      }} 
                      disabled={banksLoading}
                    >
                      <SelectTrigger className={cn(fieldErrors.receivingBank && "border-destructive")}>
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
                    <Label>Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paymentMethodsLoading}>
                      <SelectTrigger>
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
      </main>

      <Footer />
    </div>
  );
}
