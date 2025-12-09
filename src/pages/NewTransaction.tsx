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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Heart, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBanks } from "@/hooks/useBanks";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useRecipients } from "@/hooks/useRecipients";

const categories = ["Alimentação", "Moradia", "Transporte", "Lazer", "Assinaturas", "Saúde", "Trabalho"];
const subcategories = ["Supermercado", "Restaurante", "Delivery", "Conta de Luz", "Aluguel", "Streaming"];
const persons = ["Huana", "Douglas"];
const incomeOrigins = ["Salário", "Freelance", "Investimentos", "Outros"];

export default function NewTransaction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: recipients = [], isLoading: recipientsLoading } = useRecipients();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
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

  const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const valuePerPerson = isCouple ? numericValue / 2 : numericValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        toast({
          title: "Lançamento salvo!",
          description: "O lançamento foi registrado com sucesso.",
        });
        navigate("/lancamentos");
      }, 1500);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const isLoading = banksLoading || paymentMethodsLoading || recipientsLoading;

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
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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

                <div className="space-y-2">
                  <Label>Subcategoria</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
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
              {isCouple && numericValue > 0 && (
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
