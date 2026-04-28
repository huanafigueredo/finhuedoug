import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategoryBudgets } from "@/hooks/useCategoryBudgets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { Repeat, LineChart, Plus, AlertCircle, TrendingUp, Zap, Ghost, XCircle, ArrowDownRight, Sparkles, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, subMonths, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Planejamento() {
  const { data: transactions = [] } = useTransactions();
  const { data: budgets = [] } = useCategoryBudgets();
  const [activeTab, setActiveTab] = useState("radar");
  
  // Sandbox State
  const [simTitle, setSimTitle] = useState("");
  const [simValue, setSimValue] = useState("");
  const [simInstallments, setSimInstallments] = useState("1");
  const [isIncome, setIsIncome] = useState(false);
  const [simulations, setSimulations] = useState<any[]>([]);

  // 1. Radar de Assinaturas (Subscriptions Logic)
  const { activeSubs, ghostSubs } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && !t.savings_deposit_id);
    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i));
    
    // Group by description (Fuzzy/Normalized matching)
    const groups: Record<string, any[]> = {};
    expenses.forEach(t => {
      let name = t.description.toLowerCase().trim()
        .replace(/[0-9]/g, '')
        .replace(/ - parcela.*/g, '')
        .replace(/ltda/g, '')
        .replace(/s\.?a\.?/g, '')
        .trim();
      
      const words = name.split(/\s+/).filter(w => w.length > 2).slice(0, 2);
      const key = words.join(' ') || name;
      
      if (key.length < 3) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const active: any[] = [];
    const ghosts: any[] = [];

    Object.entries(groups).forEach(([key, txs]) => {
      const monthsPresent = new Set<number>();
      let latestValue = 0;
      let previousValue = 0;
      let oldestValue = 0;
      let latestDate = new Date(0);
      let oldestDate = new Date();
      
      txs.forEach(t => {
        const d = parseISO(t.date);
        last6Months.forEach((m, idx) => {
          if (isSameMonth(d, m)) {
            monthsPresent.add(idx);
            const val = Number(t.total_value) || 0;
            if (d > latestDate) {
              latestDate = d;
              previousValue = latestValue;
              latestValue = val;
            }
            if (d < oldestDate) {
              oldestDate = d;
              oldestValue = val;
            }
          }
        });
      });

      const descCounts: Record<string, number> = {};
      txs.forEach(t => descCounts[t.description] = (descCounts[t.description] || 0) + 1);
      const originalName = Object.keys(descCounts).reduce((a, b) => descCounts[a] > descCounts[b] ? a : b);

      if (monthsPresent.size >= 2) {
        const isActiveNow = monthsPresent.has(0) || monthsPresent.has(1);
        
        // Calcular Inflação Silenciosa
        let inflationPct = 0;
        if (oldestValue > 0 && latestValue > oldestValue && monthsPresent.size > 2) {
          inflationPct = ((latestValue - oldestValue) / oldestValue) * 100;
        }

        const subObj = {
          id: crypto.randomUUID(),
          name: originalName,
          value: latestValue,
          previousValue: previousValue,
          hasIncreased: previousValue > 0 && latestValue > previousValue,
          inflationPct: Math.round(inflationPct),
          frequency: monthsPresent.size,
          lastDate: latestDate,
          expectedNextDate: new Date(new Date().getFullYear(), new Date().getMonth() + (monthsPresent.has(0) ? 1 : 0), latestDate.getDate())
        };

        if (isActiveNow) {
          active.push(subObj);
        } else {
          // Present in the past (e.g. months 2, 3, 4) but not 0 or 1
          if (monthsPresent.has(2) || monthsPresent.has(3)) {
            ghosts.push(subObj);
          }
        }
      }
    });

    return { 
      activeSubs: active.sort((a, b) => b.value - a.value),
      ghostSubs: ghosts.sort((a, b) => b.value - a.value)
    };
  }, [transactions]);

  const totalSubscriptions = activeSubs.reduce((acc, s) => acc + s.value, 0);

  // 2. Simulador (Sandbox Logic)
  const handleAddSimulation = () => {
    if (!simTitle || !simValue) return;
    setSimulations([...simulations, {
      id: crypto.randomUUID(),
      title: simTitle,
      value: parseFloat(simValue) || 0,
      installments: parseInt(simInstallments) || 1,
      isIncome: isIncome,
      startMonth: new Date().getMonth() + 1
    }]);
    setSimTitle("");
    setSimValue("");
    setSimInstallments("1");
    setIsIncome(false);
  };

  const handleSimulateCancel = (subName: string, subValue: number) => {
    setSimulations([...simulations, {
      id: crypto.randomUUID(),
      title: `Cancelar: ${subName}`,
      value: subValue * 6, // simulate savings for 6 months
      installments: 6,
      isIncome: true, // canceling an expense acts like income/savings
      startMonth: new Date().getMonth() + 1
    }]);
    setActiveTab("simulador");
  };

  const removeSimulation = (id: string) => {
    setSimulations(simulations.filter(s => s.id !== id));
  };

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.budget_amount, 0);

  const projectionData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i));
    const monthlyTotals: number[] = [0,0,0,0,0,0];
    
    transactions.forEach(t => {
      if (t.type !== 'expense' || t.savings_deposit_id) return;
      const d = parseISO(t.date);
      last6Months.forEach((m, i) => {
        if (isSameMonth(m, d)) {
          monthlyTotals[i] += Number(t.total_value) || 0;
        }
      });
    });

    // Baseline calculation removing the highest outlier for realism
    const sortedTotals = [...monthlyTotals].filter(v => v > 0).sort((a, b) => a - b);
    let baselineExpense = 0;
    if (sortedTotals.length >= 3) {
      sortedTotals.pop(); // remove highest outlier
      baselineExpense = sortedTotals.reduce((a, b) => a + b, 0) / sortedTotals.length;
    } else {
      baselineExpense = monthlyTotals[0] || 0;
    }

    const data = [];
    const currentMonth = new Date();
    for (let i = 1; i <= 6; i++) {
      const projDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      let simExpense = 0;
      let simIncome = 0;
      
      simulations.forEach(sim => {
        if (i <= sim.installments) {
          const monthlyVal = (sim.value / sim.installments);
          if (sim.isIncome) simIncome += monthlyVal;
          else simExpense += monthlyVal;
        }
      });

      // Renda/Economia entra como negativo na despesa para abaixar a barra
      data.push({
        name: format(projDate, "MMM", { locale: ptBR }),
        Baseline: baselineExpense,
        "Novo Gasto": simExpense,
        "Economia/Renda": -simIncome,
        TotalLiquido: baselineExpense + simExpense - simIncome,
        Teto: totalBudgetLimit > 0 ? totalBudgetLimit : undefined
      });
    }
    return data;
  }, [transactions, simulations, totalBudgetLimit]);

  // Assistência CDI Básica
  const simulatedValue = parseFloat(simValue) || 0;
  const simulatedInstallments = parseInt(simInstallments) || 1;
  const isWorthCash = !isIncome && simulatedInstallments > 1 && simulatedValue > 500;

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-8 pb-32">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Laboratório</h1>
              <p className="text-slate-500">Ferramentas avançadas de inteligência financeira</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-up" style={{ animationDelay: "100ms" }}>
            <TabsList className="grid w-full grid-cols-2 max-w-md bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">
                <Repeat className="w-4 h-4 mr-2" /> Radar de Assinaturas
              </TabsTrigger>
              <TabsTrigger value="simulador" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">
                <LineChart className="w-4 h-4 mr-2" /> Simulador "E se?"
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: RADAR DE ASSINATURAS */}
            <TabsContent value="radar" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 bg-white dark:bg-slate-900 border-none shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30 pb-8">
                    <CardTitle className="text-indigo-900 dark:text-indigo-300">Custo Fixo Invisível</CardTitle>
                    <CardDescription className="text-indigo-700/70 dark:text-indigo-400/70">O que drena sua conta todo mês</CardDescription>
                  </CardHeader>
                  <CardContent className="-mt-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <p className="text-4xl font-display font-light text-slate-900 dark:text-white">
                        {formatCurrency(totalSubscriptions)}
                      </p>
                      <p className="text-sm text-slate-500 mt-2 font-medium">
                        Identificamos {activeSubs.length} cobranças recorrentes.
                      </p>
                    </div>

                    {ghostSubs.length > 0 && (
                      <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Ghost className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 text-sm">Assinaturas Eliminadas</h4>
                        </div>
                        <p className="text-xs text-emerald-600/80 mb-3">Você deixou de pagar {ghostSubs.length} serviços recentemente.</p>
                        {ghostSubs.map((g, i) => (
                          <div key={i} className="flex justify-between text-xs font-medium text-emerald-700 dark:text-emerald-500 border-b border-emerald-200/50 dark:border-emerald-800/50 py-1 last:border-0">
                            <span>{g.name}</span>
                            <span>{formatCurrency(g.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2rem]">
                  <CardHeader>
                    <CardTitle>Cobranças Detectadas</CardTitle>
                    <CardDescription>Análise com detecção inteligente de inflação silenciosa.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeSubs.map((sub, i) => (
                        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-200">{sub.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>Previsão: dia {format(sub.expectedNextDate, "dd")}</span>
                                {sub.inflationPct > 0 && (
                                  <span className="flex items-center gap-1 text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                                    <TrendingUp className="w-3 h-3" /> +{sub.inflationPct}% no ano
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="font-display text-lg text-slate-900 dark:text-white">
                                {formatCurrency(sub.value)}
                              </p>
                              {sub.hasIncreased && (
                                <p className="text-[10px] text-rose-500 font-bold flex items-center justify-start sm:justify-end gap-1">
                                  <AlertCircle className="w-3 h-3" /> Subiu este mês
                                </p>
                              )}
                            </div>
                            
                            {/* SINERGY ACTION */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSimulateCancel(sub.name, sub.value)}
                              className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                            >
                              E se cancelar?
                            </Button>
                          </div>
                        </div>
                      ))}
                      {activeSubs.length === 0 && (
                        <p className="text-center text-slate-500 py-8">Nenhuma recorrência detectada.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: SIMULADOR */}
            <TabsContent value="simulador" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2rem]">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="space-y-1">
                      <CardTitle>Nova Simulação</CardTitle>
                      <CardDescription>Crie cenários hipotéticos.</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-3">
                          <HelpCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Como usar</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-display text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-500" /> Como usar o Simulador "E se?"
                          </DialogTitle>
                          <DialogDescription className="text-base pt-2">
                            A máquina do tempo das suas finanças. Teste o futuro antes de passar o cartão.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-4 text-slate-700 dark:text-slate-300">
                          
                          <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-xs">1</span> 
                              Entendendo o Gráfico
                            </h3>
                            <ul className="list-disc pl-10 space-y-2 text-sm">
                              <li><strong>A Barra Cinza (Baseline):</strong> É o seu custo de vida padrão atual (ignora meses de pico). Representa o dinheiro que você já "queima" todo mês.</li>
                              <li><strong>A Linha Vermelha (Teto):</strong> Seu limite de segurança (orçamentos). Passar daqui significa criar dívida e bater no teto (Colisão).</li>
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-xs">2</span> 
                              Nova Despesa (Modo Cinza)
                            </h3>
                            <p className="pl-8 text-sm">Deixe a chave desligada (cinza). Digite "iPhone", valor 5000, parcelas 10. Você verá tijolos vermelhos crescendo sobre suas barras cinzas, pressionando o seu teto. Pressione o <strong>( x )</strong> em Cenários Ativos para apagar se quiser.</p>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs">3</span> 
                              Renda ou Economia (Modo Verde)
                            </h3>
                            <p className="pl-8 text-sm">Ligue a chave (fica verde). Digite "13º Salário". O gráfico vai mostrar blocos verdes que <strong>empurram seus gastos para baixo</strong>, dando mais folga no seu orçamento.</p>
                          </div>

                          <div className="space-y-2 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-indigo-500" /> Sinergia (Combo)
                            </h3>
                            <p className="text-sm mt-2">Vá no "Radar de Assinaturas" e clique em <strong>"E se cancelar?"</strong> na frente de um serviço ruim. O app converte isso numa economia (Verde). Volte aqui e adicione o gasto da sua TV Nova (Vermelho). O gráfico fará o cabo de guerra entre o gasto cortado e o novo!</p>
                          </div>

                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Label htmlFor="type-toggle" className="flex flex-col gap-1 cursor-pointer">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Tipo de Simulação</span>
                        <span className="text-xs text-slate-500">{isIncome ? 'Renda/Economia (Entrada)' : 'Nova Despesa (Saída)'}</span>
                      </Label>
                      <Switch 
                        id="type-toggle" 
                        checked={isIncome} 
                        onCheckedChange={setIsIncome}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>O que é?</Label>
                      <Input 
                        placeholder={isIncome ? "Ex: 13º Salário, Cancelamento..." : "Ex: Viagem, TV Nova..."}
                        value={simTitle}
                        onChange={e => setSimTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Total</Label>
                        <Input 
                          placeholder="0,00" 
                          type="number"
                          value={simValue}
                          onChange={e => setSimValue(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parcelas (Meses)</Label>
                        <Input 
                          type="number" 
                          min="1" max="48"
                          value={simInstallments}
                          onChange={e => setSimInstallments(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {isWorthCash && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          <strong>Dica Financeira:</strong> Vai parcelar {formatCurrency(simulatedValue)} em {simulatedInstallments}x? Tente negociar pelo menos 5% de desconto à vista. Renderia mais que deixar na poupança!
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleAddSimulation} 
                      className={cn("w-full mt-4 gap-2 rounded-xl", isIncome ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "")} 
                      disabled={!simTitle || !simValue}
                    >
                      <Plus className="w-4 h-4" /> Projetar Impacto
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 dark:shadow-black/20 rounded-[2rem] overflow-hidden flex flex-col">
                  <CardHeader>
                    <CardTitle>Colisão de Orçamento (6 Meses)</CardTitle>
                    <CardDescription>O Baseline exclui gastos atípicos do passado para maior precisão.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px] w-full pt-4 pb-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectionData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `R$${val/1000}k`} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                          formatter={(value: number) => formatCurrency(Math.abs(value))}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                        <Bar dataKey="Baseline" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Novo Gasto" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Economia/Renda" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                        
                        {totalBudgetLimit > 0 && (
                          <ReferenceLine 
                            y={totalBudgetLimit} 
                            stroke="#ef4444" 
                            strokeDasharray="4 4" 
                            strokeWidth={2}
                            label={{ position: 'insideTopLeft', value: 'Teto Global Limite', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {simulations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Cenários Ativos</h4>
                  <div className="flex flex-wrap gap-3">
                    {simulations.map(sim => (
                      <div key={sim.id} className={cn(
                        "px-4 py-2 rounded-full border shadow-sm flex items-center gap-3",
                        sim.isIncome 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                          : "bg-white border-indigo-100 dark:bg-slate-900 dark:border-indigo-900"
                      )}>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{sim.title}</span>
                        <span className={cn("font-bold", sim.isIncome ? "text-emerald-600" : "text-rose-500")}>
                          {sim.isIncome ? '-' : '+'}{formatCurrency(sim.value / sim.installments)}/mês
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sim.installments}x</span>
                        <button onClick={() => removeSimulation(sim.id)} className="text-slate-400 hover:text-rose-500 transition-colors ml-1">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MÓDULO DE INTELIGÊNCIA ARTIFICIAL (CONSELHEIRO DE CENÁRIO) */}
              {simulations.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 font-display">Análise Inteligente do Cenário</h3>
                  </div>

                  <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    {/* Linha 1: Resumo do Impacto */}
                    <p className="leading-relaxed">
                      Você está simulando <strong className="text-slate-900 dark:text-white">{simulations.length} {simulations.length === 1 ? 'cenário' : 'cenários'}</strong>. Isso representa um impacto líquido de{' '}
                      <strong className={cn(
                        "px-2 py-0.5 rounded-md", 
                        simulations.reduce((acc, s) => acc + (s.isIncome ? -(s.value/s.installments) : (s.value/s.installments)), 0) > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {simulations.reduce((acc, s) => acc + (s.isIncome ? -(s.value/s.installments) : (s.value/s.installments)), 0) > 0 ? '+' : ''}{formatCurrency(simulations.reduce((acc, s) => acc + (s.isIncome ? -(s.value/s.installments) : (s.value/s.installments)), 0))} mensais
                      </strong>{' '}
                      no seu fluxo de caixa habitual.
                    </p>

                    {/* Linha 2: Colisão */}
                    {(() => {
                      const collisionMonths = projectionData.filter((d: any) => totalBudgetLimit > 0 && d.TotalLiquido > totalBudgetLimit);
                      if (collisionMonths.length > 0) {
                        return (
                          <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-800 dark:text-rose-300">
                              <strong>Atenção ao Teto:</strong> Essa configuração fará você estourar seu limite de gastos em <strong>{collisionMonths.length} dos próximos 6 meses</strong>, começando por <strong>{collisionMonths[0].name}</strong>. Talvez seja necessário cortar alguma despesa fixa para compensar.
                            </p>
                          </div>
                        )
                      } else if (simulations.some(s => !s.isIncome)) {
                        return (
                          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 dark:text-emerald-300">
                              <strong>Cenário Seguro:</strong> Mesmo adicionando estes novos gastos, você se mantém dentro da margem de segurança do seu teto global (não há colisão nos próximos 6 meses).
                            </p>
                          </div>
                        )
                      }
                      return null;
                    })()}

                    {/* Linha 3: Dica de IA Contextual */}
                    {(() => {
                      const highestExpense = [...simulations].filter(s => !s.isIncome && s.installments > 1).sort((a,b) => b.value - a.value)[0];
                      const highestIncome = [...simulations].filter(s => s.isIncome).sort((a,b) => b.value - a.value)[0];
                      
                      if (highestExpense) {
                        return (
                          <div className="pl-4 border-l-2 border-indigo-300 dark:border-indigo-700 italic text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">Dica Estratégica ({highestExpense.title}):</span>
                            "Antes de fechar em {highestExpense.installments} parcelas, peça desconto para pagamento à vista. Se o desconto for de 10% ou mais, pode valer a pena descapitalizar, considerando a taxa Selic/CDI atual do mercado."
                          </div>
                        )
                      } else if (highestIncome) {
                        return (
                          <div className="pl-4 border-l-2 border-indigo-300 dark:border-indigo-700 italic text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">Dica Estratégica ({highestIncome.title}):</span>
                            "Não deixe essa renda extra parada na conta corrente para ser diluída em gastos invisíveis. Programe a transferência de pelo menos 30% desse valor direto para seus investimentos assim que o dinheiro cair na conta!"
                          </div>
                        )
                      }
                      return null;
                    })()}

                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </AppLayout>
  );
}
