import { useState, useEffect } from "react";
import { z } from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(1);
  const [recurringDuration, setRecurringDuration] = useState<string>("indefinite");

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
        setIsRecurring(false);
        setRecurringDay(1);
        setRecurringDuration("indefinite");
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

  const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const valuePerPerson = isCouple ? numericValue / 2 : numericValue;
  const installmentValue = isInstallment && totalInstallments > 1 ? numericValue / totalInstallments : numericValue;

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
        date: format(date || new Date(), "yyyy-MM-dd"),
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
        start_from_installment: isInstallment && isAlreadyStarted ? startFromInstallment : undefined,
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

  const formatCurrencyMask = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "";
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(reais);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyMask(e.target.value);
    setValue(formatted);
    const num = parseFloat(formatted.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    if (num > 0) setFieldErrors(prev => ({ ...prev, value: undefined }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? "Editar Lançamento" : isDuplicateMode ? "Duplicar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <div className="space-y-6">
              {/* Type Toggle */}
              <div className="flex items-center justify-center gap-4 pt-4">
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
              <div className="grid md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder={type === "income" ? "Ex: Salário, Pix cliente X" : "Ex: Supermercado Extra"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Value - For Income */}
              {type === "income" && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Total <span className="text-destructive">*</span></Label>
                  <Input
                    id="value"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={handleValueChange}
                    onFocus={handleValueFocus}
                    className={cn("text-2xl font-semibold h-14", fieldErrors.value && "border-destructive")}
                  />
                  {fieldErrors.value && <p className="text-sm text-destructive">{fieldErrors.value}</p>}
                </div>
              )}

              {/* Recurring Income Toggle */}
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
                    <div className="grid md:grid-cols-2 gap-4 pl-4 border-l-2 border-success/30">
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
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category & Subcategory */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
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
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>Subcategoria</Label>
                  <Select 
                    value={subcategory} 
                    onValueChange={setSubcategory}
                    disabled={subcategoriesLoading || !categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!categoryId ? "Selecione uma categoria" : "Selecione"} />
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
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{type === "income" ? "Quem recebeu" : "Quem pagou"}</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>{type === "income" ? "Origem da receita" : "Para quem"}</Label>
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
                <div className="space-y-4">
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

                  {/* Valor por pessoa - Only when isCouple is true */}
                  {isCouple && numericValue > 0 && (
                    <div className="space-y-2">
                      <Label>Valor por pessoa</Label>
                      <Input
                        value={formatCurrency(valuePerPerson)}
                        readOnly
                        className="text-lg font-semibold bg-muted cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Value - For Expense */}
              {type === "expense" && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Total <span className="text-destructive">*</span></Label>
                  <Input
                    id="value"
                    placeholder="R$ 0,00"
                    value={value}
                    onChange={handleValueChange}
                    onFocus={handleValueFocus}
                    className={cn("text-2xl font-semibold h-14", fieldErrors.value && "border-destructive")}
                  />
                  {fieldErrors.value && <p className="text-sm text-destructive">{fieldErrors.value}</p>}
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
                        <p className="text-sm text-muted-foreground">Dividir em múltiplas parcelas</p>
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
                          onValueChange={(v) => {
                            const newTotal = parseInt(v);
                            setTotalInstallments(newTotal);
                            // Reset startFrom if it's >= new total
                            if (startFromInstallment >= newTotal) {
                              setStartFromInstallment(1);
                            }
                          }}
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

                      {/* Already Started Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                        <div>
                          <Label className="text-foreground text-sm">Compra já iniciada?</Label>
                          <p className="text-xs text-muted-foreground">
                            Lançar parcelas a partir de uma específica
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
                        <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                          <Label>Iniciar a partir da parcela</Label>
                          <Input
                            type="number"
                            min={1}
                            max={totalInstallments - 1}
                            value={startFromInstallment}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setStartFromInstallment(Math.min(totalInstallments - 1, Math.max(1, val)));
                            }}
                            placeholder="Ex: 3"
                            className="w-32"
                          />
                          <p className="text-xs text-muted-foreground">
                            Serão geradas {totalInstallments - startFromInstallment + 1} parcelas ({startFromInstallment}/{totalInstallments} até {totalInstallments}/{totalInstallments})
                          </p>
                        </div>
                      )}

                      {preview && preview.length > 0 && (
                        <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <CreditCard className="w-4 h-4" />
                            Preview das Parcelas
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2">
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco Pagador</Label>
                    <Select value={bank} onValueChange={setBank} disabled={banksLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione"} />
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco de Recebimento</Label>
                    <Select value={receivingBank} onValueChange={setReceivingBank} disabled={banksLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={banksLoading ? "Carregando..." : "Selecione"} />
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
                  onClick={() => onOpenChange(false)}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
