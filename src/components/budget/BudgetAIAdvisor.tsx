import { useMemo } from "react";
import { BudgetSummary } from "@/hooks/useBudgetProgress";
import { Sparkles, AlertTriangle, CheckCircle, TrendingDown, PiggyBank, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetAIAdvisorProps {
    summary: BudgetSummary;
    personName?: string;
}

export function BudgetAIAdvisor({ summary, personName }: BudgetAIAdvisorProps) {
    const insights = useMemo(() => {
        const totalPercentage = summary.totalBudgeted > 0
            ? (summary.totalSpent / summary.totalBudgeted) * 100
            : 0;

        const exceededCategories = summary.budgetProgress
            .filter(b => b.status === "exceeded")
            .map(b => b.categoryName);

        const warningCategories = summary.budgetProgress
            .filter(b => b.status === "warning")
            .map(b => ({ name: b.categoryName, percentage: b.percentage }));

        const savingOpportunities = summary.budgetProgress
            .filter(b => b.status === "ok" && b.percentage < 50 && b.budgeted > 0)
            .sort((a, b) => b.remaining - a.remaining) // Sort by most potential savings (absolute value)
            .slice(0, 2); // Top 2

        const tips = [];

        // 1. Overall Status
        if (totalPercentage > 100) {
            tips.push({
                type: "danger",
                title: "Alerta Crítico de Orçamento",
                message: `Atenção${personName ? `, ${personName}` : ""}! O orçamento total foi excedido em ${Math.round(totalPercentage - 100)}%. Pare de gastar imediatamente se possível.`,
                icon: <AlertTriangle className="w-5 h-5 text-red-500" />
            });
        } else if (totalPercentage > 85) {
            tips.push({
                type: "warning",
                title: "Zona de Atenção",
                message: `Você já consumiu ${Math.round(totalPercentage)}% do orçamento total. Reduza gastos não essenciais.`,
                icon: <TrendingDown className="w-5 h-5 text-amber-500" />
            });
        } else {
            tips.push({
                type: "success",
                title: "Saúde Financeira Boa",
                message: `Ótimo ritmo! Você gastou apenas ${Math.round(totalPercentage)}% do planejado. Continue assim.`,
                icon: <CheckCircle className="w-5 h-5 text-green-500" /> // note: lucide exports CheckCircle, lower case is incorrect usually, but let's check imports. Wait, checkCircle is likely CheckCircle. I'll fix this.
            });
        }

        // 2. Specific Category Alerts
        if (exceededCategories.length > 0) {
            tips.push({
                type: "danger",
                title: "Categorias Estouradas",
                message: `O limite estourou em: ${exceededCategories.join(", ")}. Evite qualquer novo gasto nessas áreas.`,
                icon: <AlertTriangle className="w-5 h-5 text-red-500" />
            });
        }

        if (warningCategories.length > 0) {
            const names = warningCategories.map(c => `${c.name} (${c.percentage}%)`).join(", ");
            tips.push({
                type: "warning",
                title: "Cuidado Nestas Áreas",
                message: `Você está quase no limite em: ${names}. Monitore de perto.`,
                icon: <TrendingDown className="w-5 h-5 text-amber-500" />
            });
        }

        // 3. Saving Opportunities
        if (savingOpportunities.length > 0) {
            const names = savingOpportunities.map(c => c.categoryName).join(" e ");
            const potentialSavings = savingOpportunities.reduce((acc, curr) => acc + curr.remaining, 0) / 100;
            tips.push({
                type: "info",
                title: "Onde Economizar Mais",
                message: `Você está gastando pouco em ${names}. Potencial de economia: R$ ${potentialSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
                icon: <PiggyBank className="w-5 h-5 text-blue-500" />
            });
        }

        return tips;
    }, [summary, personName]);

    // If no budget is set at all
    if (summary.totalBudgeted === 0) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-sm mb-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

            <div className="relative flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full ring-1 ring-primary/20">
                    <Bot className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            IA Financeira
                        </h3>
                        <p className="text-sm text-muted-foreground">Análise inteligente dos seus gastos atuais</p>
                    </div>

                    <div className="grid gap-3">
                        {insights.map((tip, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border text-sm transition-all hover:shadow-md",
                                    tip.type === "danger" && "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
                                    tip.type === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
                                    tip.type === "success" && "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
                                    tip.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
                                )}
                            >
                                <div className="mt-0.5 shrink-0">{tip.icon}</div>
                                <div>
                                    <span className="font-semibold block mb-0.5">{tip.title}</span>
                                    <span className="opacity-90 leading-relaxed">{tip.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
