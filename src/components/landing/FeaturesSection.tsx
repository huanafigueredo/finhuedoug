import { cn } from "@/lib/utils";

const features = [
  {
    emoji: "⚖️",
    title: "divisão inteligente",
    description: "50/50, proporcional à renda ou personalizada. vocês decidem como dividir cada despesa.",
  },
  {
    emoji: "👥",
    title: "controle por pessoa",
    description: "saiba exatamente quanto cada um gastou e recebeu no mês. transparência total.",
  },
  {
    emoji: "🎯",
    title: "metas compartilhadas",
    description: "guardem juntos para a viagem, casa nova ou reserva de emergência.",
  },
  {
    emoji: "📅",
    title: "contas e recorrências",
    description: "nunca esqueçam uma conta. alertas automáticos de vencimento.",
  },
  {
    emoji: "🤖",
    title: "chat com ia",
    description: "perguntem qualquer coisa sobre as finanças. a ia analisa tudo para vocês.",
  },
  {
    emoji: "✨",
    title: "visual moderno",
    description: "interface bonita e fácil de usar. sem planilhas complicadas.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4 animate-fade-up opacity-0">
            funcionalidades
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0 stagger-1">
            tudo que vocês precisam
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-up opacity-0 stagger-2">
            ferramentas pensadas para facilitar a vida financeira do casal
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group p-8 rounded-2xl bg-card border border-border/50 shadow-card",
                "hover:shadow-warm hover:-translate-y-1 transition-all duration-300",
                "animate-fade-up opacity-0"
              )}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <span className="text-3xl">{feature.emoji}</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
