import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TransactionRow, Transaction } from "@/components/shared/TransactionRow";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Link } from "react-router-dom";

const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "09/12/2024",
    description: "Supermercado Extra",
    person: "Huana",
    category: "Alimentação",
    bank: "Nubank",
    paymentMethod: "Débito",
    totalValue: 320.5,
    valuePerPerson: 160.25,
    isCouple: true,
    type: "expense",
  },
  {
    id: "2",
    date: "08/12/2024",
    description: "Conta de Luz",
    person: "Douglas",
    category: "Moradia",
    bank: "Inter",
    paymentMethod: "Débito",
    totalValue: 180.0,
    valuePerPerson: 90.0,
    isCouple: true,
    type: "expense",
  },
  {
    id: "3",
    date: "05/12/2024",
    description: "Salário Dezembro",
    person: "Huana",
    category: "Trabalho",
    bank: "Nubank",
    paymentMethod: "Transferência",
    totalValue: 5500.0,
    valuePerPerson: 5500.0,
    isCouple: false,
    type: "income",
  },
  {
    id: "4",
    date: "04/12/2024",
    description: "Restaurante Japonês",
    person: "Douglas",
    category: "Lazer",
    bank: "Nubank",
    paymentMethod: "Crédito",
    totalValue: 189.9,
    valuePerPerson: 94.95,
    isCouple: true,
    type: "expense",
  },
  {
    id: "5",
    date: "03/12/2024",
    description: "Netflix",
    person: "Huana",
    category: "Assinaturas",
    bank: "Inter",
    paymentMethod: "Crédito",
    totalValue: 55.9,
    valuePerPerson: 27.95,
    isCouple: true,
    type: "expense",
  },
  {
    id: "6",
    date: "01/12/2024",
    description: "Freelance Website",
    person: "Douglas",
    category: "Trabalho",
    bank: "Inter",
    paymentMethod: "Pix",
    totalValue: 2000.0,
    valuePerPerson: 2000.0,
    isCouple: false,
    type: "income",
  },
];

const persons = ["Todos", "Huana", "Douglas"];
const categories = ["Todas", "Alimentação", "Moradia", "Lazer", "Trabalho", "Assinaturas"];
const banks = ["Todos", "Nubank", "Inter", "Itaú"];
const paymentMethods = ["Todos", "Débito", "Crédito", "Pix", "Transferência"];
const types = ["Todos", "Receita", "Despesa"];
const coupleOptions = ["Todos", "Sim", "Não"];

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [bankFilter, setBankFilter] = useState("Todos");
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [coupleFilter, setCoupleFilter] = useState("Todos");

  const filteredTransactions = mockTransactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (personFilter !== "Todos" && t.person !== personFilter) return false;
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
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Lançamentos
              </h1>
              <p className="text-muted-foreground">
                Gerencie todas as transações do casal
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Link to="/novo">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Lançamento
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <div className="relative lg:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger>
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

              <Select value={coupleFilter} onValueChange={setCoupleFilter}>
                <SelectTrigger>
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

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
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

              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger>
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

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
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

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
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
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pessoa
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Por Pessoa
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={(id) => console.log("Edit", id)}
                      onDelete={(id) => console.log("Delete", id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum lançamento encontrado
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
