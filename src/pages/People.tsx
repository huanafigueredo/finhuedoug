import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Heart } from "lucide-react";

const initialPeople = [
  {
    id: "1",
    name: "Huana",
    avatar: "",
    totalExpenses: "R$ 2.500,00",
    banks: [
      { id: "1", name: "Nubank", color: "#9B59B6" },
      { id: "2", name: "Inter", color: "#FF7F00" },
    ],
  },
  {
    id: "2",
    name: "Douglas",
    avatar: "",
    totalExpenses: "R$ 2.700,00",
    banks: [
      { id: "3", name: "Nubank", color: "#9B59B6" },
      { id: "4", name: "Itaú", color: "#003399" },
    ],
  },
];

const availableBanks = [
  { name: "Nubank", color: "#9B59B6" },
  { name: "Inter", color: "#FF7F00" },
  { name: "Itaú", color: "#003399" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Santander", color: "#EC0000" },
  { name: "C6 Bank", color: "#000000" },
  { name: "PicPay", color: "#21C25E" },
];

export default function People() {
  const [people, setPeople] = useState(initialPeople);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddBank = (personId: string) => {
    setSelectedPerson(personId);
    setIsDialogOpen(true);
  };

  const confirmAddBank = () => {
    if (!selectedPerson || !selectedBank) return;

    const bankInfo = availableBanks.find((b) => b.name === selectedBank);
    if (!bankInfo) return;

    setPeople((prev) =>
      prev.map((person) => {
        if (person.id === selectedPerson) {
          return {
            ...person,
            banks: [
              ...person.banks,
              {
                id: Date.now().toString(),
                name: bankInfo.name,
                color: bankInfo.color,
              },
            ],
          };
        }
        return person;
      })
    );

    setIsDialogOpen(false);
    setSelectedBank("");
    setSelectedPerson(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">O Casal</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Huana & Douglas
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Gerencie os perfis e bancos de cada pessoa do casal
            </p>
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
                onAddBank={() => handleAddBank(person.id)}
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
              Gastos totais do casal este mês
            </p>
            <div className="text-4xl font-display font-bold text-primary">
              R$ 5.200,00
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
              <Button onClick={confirmAddBank} disabled={!selectedBank}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
