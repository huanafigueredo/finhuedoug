import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Heart, Check, ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useRecipients } from "@/hooks/useRecipients";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";

const persons = ["Huana", "Douglas"];
const incomeOrigins = ["Salário", "Freelance", "Investimentos", "Outros"];
const installmentOptions = [2, 3, 4, 5, 6, 10, 12];

export default function NewTransaction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();
  const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
  const createTransaction = useCreateTransaction();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");

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

  // Installment fields
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState<number>(2);

  const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const valuePerPerson = isCouple ? numericValue / 2 : numericValue;
  const installmentValue = isInstallment && totalInstallments > 1 ? numericValue / totalInstallments : numericValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !description || numericValue <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a data, descrição e valor.",
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

      await createTransaction.mutateAsync({
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
      });

      setShowSuccess(true);
      
      setTimeout(() => {
        toast({
          title: "Lançamento salvo!",
          description: isInstallment && totalInstallments > 1
            ? `Criadas ${totalInstallments} parcelas de ${formatCurrency(installmentValue)}`
            : "O lançamento foi registrado com sucesso.",
        });
        navigate("/lancamentos");
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o lançamento.",
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

  const isLoading = banksLoading || paymentMethodsLoading || recipientsLoading;

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
              Novo Lançamento
            </h1>
            <p className="text-muted-foreground">
              Registre uma nova transação para o casal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-8">
              {/* Type Toggle */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setType("expense")}
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
                  onClick={() => setType("income")}
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
                          !date && "text-muted-foreground"
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
                        onSelect={setDate}
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
                    placeholder="Ex: Supermercado Extra"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

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
                  <Label>Quem pagou</Label>
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
                  <Label>Para quem</Label>
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

              {/* Couple Toggle */}
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

              {/* Value */}
              <div className="space-y-2">
                <Label htmlFor="value">Valor Total</Label>
                <Input
                  id="value"
                  placeholder="R$ 0,00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="text-2xl font-semibold h-14"
                />
              </div>

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

              {/* Bank & Payment */}
              <div className="grid md:grid-cols-2 gap-6">
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

              {/* Income Specific Fields */}
              {type === "income" && (
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
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
                  </div>

                  <div className="space-y-2">
                    <Label>Origem da Receita</Label>
                    <Select value={incomeOrigin} onValueChange={setIncomeOrigin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeOrigins.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
                  ) : (
                    "Salvar Lançamento"
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
