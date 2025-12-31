import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, ArrowRight, ArrowLeft, Check, Users, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Slider } from "@/components/ui/slider";
import { useAddCoupleMember, useCoupleMembers, useUpdateCoupleMember } from "@/hooks/useCoupleMembers";
import { SplitMode } from "@/hooks/useSplitSettings";
import { useRecipients, useAddRecipient } from "@/hooks/useRecipients";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TogetherLogo } from "@/components/shared/TogetherLogo";

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: existingMembers = [] } = useCoupleMembers();
  const { data: existingRecipients = [] } = useRecipients();
  const addMember = useAddCoupleMember();
  const updateMember = useUpdateCoupleMember();
  const addRecipient = useAddRecipient();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Couple profiles
  const [person1Name, setPerson1Name] = useState("");
  const [person2Name, setPerson2Name] = useState("");

  // Step 2: Split settings
  const [splitMode, setSplitMode] = useState<SplitMode>("50-50");
  const [person1Income, setPerson1Income] = useState(0);
  const [person2Income, setPerson2Income] = useState(0);
  const [person1Percentage, setPerson1Percentage] = useState(50);

  const person2Percentage = 100 - person1Percentage;

  // Calculate proportional percentages
  const totalIncome = person1Income + person2Income;
  const proportionalPerson1 = totalIncome > 0 ? Math.round((person1Income / totalIncome) * 100) : 50;
  const proportionalPerson2 = 100 - proportionalPerson1;

  const FORBIDDEN_NAMES = ["pessoa 1", "pessoa 2"];

  const handleStep1Next = async () => {
    const name1 = person1Name.trim();
    const name2 = person2Name.trim();

    if (!name1 || !name2) {
      toast({
        title: "Preencha os nomes",
        description: "Informe o nome das duas pessoas do casal.",
        variant: "destructive",
      });
      return;
    }

    // Validate that names are not default placeholder names
    if (FORBIDDEN_NAMES.includes(name1.toLowerCase()) || FORBIDDEN_NAMES.includes(name2.toLowerCase())) {
      toast({
        title: "Nomes inválidos",
        description: "Por favor, use nomes reais em vez de 'Pessoa 1' ou 'Pessoa 2'.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if members already exist and update, or create new ones
      const member1 = existingMembers.find(m => m.position === 1);
      const member2 = existingMembers.find(m => m.position === 2);

      if (member1) {
        await updateMember.mutateAsync({ id: member1.id, name: person1Name.trim() });
      } else {
        await addMember.mutateAsync({ name: person1Name.trim() });
      }

      if (member2) {
        await updateMember.mutateAsync({ id: member2.id, name: person2Name.trim() });
      } else {
        await addMember.mutateAsync({ name: person2Name.trim() });
      }

      // Sync with recipients ("Para quem" field)
      const recipientNames = existingRecipients.map(r => r.name.toLowerCase());
      
      // Add person1 as recipient if not exists
      if (!recipientNames.includes(person1Name.trim().toLowerCase())) {
        await addRecipient.mutateAsync({ name: person1Name.trim() });
      }
      
      // Add person2 as recipient if not exists
      if (!recipientNames.includes(person2Name.trim().toLowerCase())) {
        await addRecipient.mutateAsync({ name: person2Name.trim() });
      }
      
      // Add "Casal" as recipient if not exists
      if (!recipientNames.includes("casal")) {
        await addRecipient.mutateAsync({ name: "Casal" });
      }

      setStep(2);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os perfis. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    // Validação de autenticação
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Validação para modo proporcional
    if (splitMode === "proporcional" && (person1Income <= 0 || person2Income <= 0)) {
      toast({
        title: "Informe as rendas",
        description: "Por favor, informe a renda mensal de ambas as pessoas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular percentuais
      let p1Pct = 50;
      let p2Pct = 50;

      if (splitMode === "proporcional") {
        p1Pct = proportionalPerson1;
        p2Pct = proportionalPerson2;
      } else if (splitMode === "personalizado") {
        p1Pct = person1Percentage;
        p2Pct = person2Percentage;
      }

      console.log("ONBOARDING - Iniciando salvamento", { splitMode, p1Pct, p2Pct, userId: user.id });

      // ETAPA 1: Salvar split_settings
      console.log("ONBOARDING - Etapa 1: Salvando split_settings...");
      
      const { data: existingSettings, error: fetchError } = await supabase
        .from("split_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Erro ao buscar configurações existentes: ${fetchError.message}`);
      }

      if (existingSettings) {
        const { error: updateError } = await supabase
          .from("split_settings")
          .update({
            mode: splitMode,
            person1_percentage: p1Pct,
            person2_percentage: p2Pct,
          })
          .eq("id", existingSettings.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar configurações de divisão: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from("split_settings")
          .insert({
            user_id: user.id,
            mode: splitMode,
            person1_percentage: p1Pct,
            person2_percentage: p2Pct,
          });

        if (insertError) {
          throw new Error(`Erro ao criar configurações de divisão: ${insertError.message}`);
        }
      }

      console.log("ONBOARDING - Etapa 1 concluída com sucesso");

      // ETAPA 2: Atualizar rendas se modo proporcional
      if (splitMode === "proporcional") {
        console.log("ONBOARDING - Etapa 2: Atualizando rendas...", { person1Income, person2Income });

        const { data: members, error: membersError } = await supabase
          .from("couple_members")
          .select("id, position")
          .eq("user_id", user.id)
          .order("position");

        if (membersError) {
          throw new Error(`Erro ao buscar membros do casal: ${membersError.message}`);
        }

        if (!members || members.length < 2) {
          throw new Error("Membros do casal não encontrados. Por favor, volte à etapa anterior.");
        }

        const member1 = members.find(m => m.position === 1);
        const member2 = members.find(m => m.position === 2);

        if (!member1 || !member2) {
          throw new Error("Não foi possível identificar os membros do casal.");
        }

        const { error: income1Error } = await supabase
          .from("couple_members")
          .update({ monthly_income_cents: person1Income })
          .eq("id", member1.id);

        if (income1Error) {
          throw new Error(`Erro ao salvar renda de ${person1Name}: ${income1Error.message}`);
        }

        const { error: income2Error } = await supabase
          .from("couple_members")
          .update({ monthly_income_cents: person2Income })
          .eq("id", member2.id);

        if (income2Error) {
          throw new Error(`Erro ao salvar renda de ${person2Name}: ${income2Error.message}`);
        }

        console.log("ONBOARDING - Etapa 2 concluída com sucesso");
      }

      // ETAPA 3: Marcar onboarding como completo
      console.log("ONBOARDING - Etapa 3: Marcando onboarding como completo...");
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(`Erro ao finalizar configuração: ${profileError.message}`);
      }

      console.log("ONBOARDING - Etapa 3 concluída com sucesso");

      // IMPORTANTE: Invalidar cache do onboarding status ANTES de navegar
      // Isso garante que o ProtectedRoute vai ler o valor atualizado
      await queryClient.invalidateQueries({ queryKey: ["profile-onboarding", user.id] });

      // SUCESSO - Só mostra toast e navega se tudo deu certo
      toast({
        title: "Configuração concluída! 🎉",
        description: "Seu together está pronto para usar.",
      });

      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("ONBOARDING - Erro:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar.";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TogetherLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindos ao together! 💕
          </h1>
          <p className="text-muted-foreground">
            Vamos configurar suas finanças em casal
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa {step} de 2</span>
            <span>{step === 1 ? "Perfis" : "Divisão"}</span>
          </div>
          <Progress value={step * 50} className="h-2" />
        </div>

        {/* Step 1: Profiles */}
        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Quem são vocês?
              </CardTitle>
              <CardDescription>
                Informe os nomes das pessoas do casal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="person1">Pessoa 1</Label>
                  <Input
                    id="person1"
                    placeholder="Ex: Maria"
                    value={person1Name}
                    onChange={(e) => setPerson1Name(e.target.value)}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person2">Pessoa 2</Label>
                  <Input
                    id="person2"
                    placeholder="Ex: João"
                    value={person2Name}
                    onChange={(e) => setPerson2Name(e.target.value)}
                    className="text-center"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Heart className="w-8 h-8 text-primary fill-primary animate-pulse" />
              </div>

              <Button
                onClick={handleStep1Next}
                disabled={isSubmitting || !person1Name.trim() || !person2Name.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Salvando..." : "Próximo"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Split Settings */}
        {step === 2 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Como vocês dividem as despesas?
              </CardTitle>
              <CardDescription>
                Escolha o modo de divisão das despesas do casal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ToggleGroup
                type="single"
                value={splitMode}
                onValueChange={(v) => v && setSplitMode(v as SplitMode)}
                className="grid grid-cols-3 gap-2"
              >
                <ToggleGroupItem
                  value="50-50"
                  className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <span className="text-lg">⚖️</span>
                  <span className="text-xs font-medium">50/50</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="proporcional"
                  className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <span className="text-lg">📊</span>
                  <span className="text-xs font-medium">Proporcional</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="personalizado"
                  className="flex flex-col gap-1 h-auto py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <span className="text-lg">✂️</span>
                  <span className="text-xs font-medium">Personalizado</span>
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Proporcional: Income inputs */}
              {splitMode === "proporcional" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground text-center">
                    Informe a renda mensal de cada pessoa
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{person1Name || "Pessoa 1"}</Label>
                      <CurrencyInput
                        value={person1Income}
                        onChange={setPerson1Income}
                        showPrefix
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{person2Name || "Pessoa 2"}</Label>
                      <CurrencyInput
                        value={person2Income}
                        onChange={setPerson2Income}
                        showPrefix
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Personalizado: Percentage slider */}
              {splitMode === "personalizado" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground text-center">
                    Defina os percentuais de cada pessoa
                  </p>
                  <Slider
                    value={[person1Percentage]}
                    onValueChange={([v]) => setPerson1Percentage(v)}
                    min={0}
                    max={100}
                    step={5}
                    className="my-4"
                  />
                </div>
              )}

              {/* Preview */}
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">Divisão resultante:</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{person1Name || "Pessoa 1"}</p>
                    <p className="text-2xl font-bold text-primary">
                      {splitMode === "50-50"
                        ? 50
                        : splitMode === "proporcional"
                        ? proportionalPerson1
                        : person1Percentage}
                      %
                    </p>
                  </div>
                  <Heart className="w-6 h-6 text-primary fill-primary" />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{person2Name || "Pessoa 2"}</p>
                    <p className="text-2xl font-bold text-primary">
                      {splitMode === "50-50"
                        ? 50
                        : splitMode === "proporcional"
                        ? proportionalPerson2
                        : person2Percentage}
                      %
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting || (splitMode === "proporcional" && totalIncome === 0)}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? "Salvando..." : "Concluir"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
