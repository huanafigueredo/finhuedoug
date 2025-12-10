import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PersonCard } from "@/components/shared/PersonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks, useAddBank, useDeleteBank } from "@/hooks/useBanks";
import { toast } from "sonner";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const availableBanks = [
  { name: "Nubank", color: "#9B59B6" },
  { name: "Inter", color: "#FF7F00" },
  { name: "Itaú", color: "#003399" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Santander", color: "#EC0000" },
  { name: "C6 Bank", color: "#000000" },
  { name: "PicPay", color: "#21C25E" },
  { name: "Caixa", color: "#005CA9" },
  { name: "Banco do Brasil", color: "#FFCC00" },
];

export default function People() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: transactions = [] } = useTransactions();
  const { data: banks = [] } = useBanks();
  const createBank = useAddBank();
  const deleteBank = useDeleteBank();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filter transactions by selected month/year
  const filteredTransactions = useMemo(() => {
    const monthIndex = months.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate expenses per person
  const personExpenses = useMemo(() => {
    const person1Expenses = filteredTransactions
      .filter((t) => t.type === "expense" && t.for_who === "Huana")
      .reduce((sum, t) => sum + t.total_value, 0);

    const person2Expenses = filteredTransactions
      .filter((t) => t.type === "expense" && t.for_who === "Douglas")
      .reduce((sum, t) => sum + t.total_value, 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.total_value, 0);

    return { person1Expenses, person2Expenses, totalExpenses };
  }, [filteredTransactions]);

  // Get banks used by each person from transactions
  const personBanks = useMemo(() => {
    const person1BankIds = new Set<string>();
    const person2BankIds = new Set<string>();

    filteredTransactions
      .filter((t) => t.type === "expense" && t.bank_id)
      .forEach((t) => {
        if (t.for_who === "Huana") {
          person1BankIds.add(t.bank_id!);
        } else if (t.for_who === "Douglas") {
          person2BankIds.add(t.bank_id!);
        }
      });

    const person1Banks = banks
      .filter((b) => person1BankIds.has(b.id))
      .map((b) => ({ id: b.id, name: b.name, color: b.color || "#6B7280" }));

    const person2Banks = banks
      .filter((b) => person2BankIds.has(b.id))
      .map((b) => ({ id: b.id, name: b.name, color: b.color || "#6B7280" }));

    return { person1Banks, person2Banks };
  }, [filteredTransactions, banks]);

  const handleAddBank = (personName: string) => {
    setSelectedPerson(personName);
    setIsDialogOpen(true);
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      await deleteBank.mutateAsync(bankId);
      toast.success("Banco excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir banco: " + error.message);
    }
  };

  const confirmAddBank = async () => {
    if (!selectedBank) return;

    const bankInfo = availableBanks.find((b) => b.name === selectedBank);
    if (!bankInfo) return;

    try {
      await createBank.mutateAsync({
        name: bankInfo.name,
        color: bankInfo.color,
      });
      toast.success("Banco adicionado com sucesso!");
      setIsDialogOpen(false);
      setSelectedBank("");
      setSelectedPerson(null);
    } catch (error: any) {
      toast.error("Erro ao adicionar banco: " + error.message);
    }
  };

  const people = [
    {
      id: "1",
      name: "Huana",
      avatar: "",
      totalExpenses: formatCurrency(personExpenses.person1Expenses),
      banks: personBanks.person1Banks,
    },
    {
      id: "2",
      name: "Douglas",
      avatar: "",
      totalExpenses: formatCurrency(personExpenses.person2Expenses),
      banks: personBanks.person2Banks,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">O Casal</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Huana e Douglas
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Gerencie os perfis e bancos de cada pessoa do casal
            </p>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {["2024", "2025"].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* People Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                name={person.name}
                avatar={person.avatar}
                banks={person.banks}
                totalExpenses={person.totalExpenses}
                onAddBank={() => handleAddBank(person.name)}
                onDeleteBank={handleDeleteBank}
              />
            ))}
          </div>

          {/* Summary Card */}
          <div className="mt-12 p-8 rounded-2xl bg-card border border-border shadow-card text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Juntos somos mais fortes
            </h2>
            <p className="text-muted-foreground mb-6">
              Gastos totais do casal em {selectedMonth}/{selectedYear}
            </p>
            <div className="text-4xl font-display font-bold text-primary">
              {formatCurrency(personExpenses.totalExpenses)}
            </div>
          </div>
        </div>
      </main>

      {/* Add Bank Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Adicionar Banco
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Selecione o Banco</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um banco" />
                </SelectTrigger>
                <SelectContent>
                  {availableBanks.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bank.color }}
                        />
                        {bank.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmAddBank} disabled={!selectedBank || createBank.isPending}>
                {createBank.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
