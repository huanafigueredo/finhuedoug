import { cn } from "@/lib/utils";

const features = [
  {
    emoji: "⚖️",
    title: "divisão inteligente",
    description: "50/50, proporcional ou personalizada.",
  },
  {
    emoji: "👥",
    title: "controle individual",
    description: "saiba quanto cada um gastou.",
  },
  {
    emoji: "🎯",
    title: "metas compartilhadas",
    description: "guardem juntos para o futuro.",
  },
  {
    emoji: "📅",
    title: "contas automáticas",
    description: "alertas de vencimento.",
  },
  {
    emoji: "🤖",
    title: "chat com ia",
    description: "pergunte sobre suas finanças.",
  },
  {
    emoji: "✨",
    title: "visual moderno",
    description: "interface limpa e intuitiva.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0">
            tudo que vocês precisam
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto animate-fade-up opacity-0 stagger-1">
            ferramentas para facilitar a vida financeira do casal
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "p-6 rounded-2xl bg-card border border-border",
                "hover:border-primary/30 hover:shadow-md transition-all duration-300",
                "animate-fade-up opacity-0"
              )}
              style={{ animationDelay: `${(index + 1) * 0.08}s` }}
            >
              <span className="text-3xl mb-4 block">{feature.emoji}</span>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
