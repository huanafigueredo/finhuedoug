import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={cn(
        "group p-8 rounded-2xl bg-card border border-border/50 shadow-card",
        "hover:shadow-warm transition-all duration-500",
        "hover-lift",
        isInView ? "animate-slide-up opacity-100" : "opacity-0"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6",
        "group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
      )}>
        <span className="text-3xl">{feature.emoji}</span>
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-3">
        {feature.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <span className={cn(
            "inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4",
            headerInView ? "animate-blur-in" : "opacity-0"
          )}>
            funcionalidades
          </span>
          <h2 className={cn(
            "font-display text-3xl md:text-4xl font-bold text-foreground mb-4",
            headerInView ? "animate-slide-up stagger-1" : "opacity-0"
          )}>
            tudo que vocês precisam
          </h2>
          <p className={cn(
            "text-lg text-muted-foreground max-w-xl mx-auto",
            headerInView ? "animate-fade-up stagger-2" : "opacity-0"
          )}>
            ferramentas pensadas para facilitar a vida financeira do casal
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
