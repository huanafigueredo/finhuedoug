import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    emoji: "👥",
    title: "cadastrem-se juntos",
    description: "criem uma conta compartilhada em segundos. sem burocracia.",
  },
  {
    number: "02",
    emoji: "➕",
    title: "adicionem lançamentos",
    description: "registrem receitas e despesas. digam quem pagou e pra quem é.",
  },
  {
    number: "03",
    emoji: "📊",
    title: "acompanhem em tempo real",
    description: "vejam gráficos, divisões e metas atualizados instantaneamente.",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.3 });
  
  // Alternate animation direction based on index
  const animationClass = index % 2 === 0 ? "animate-slide-left" : "animate-slide-right";

  return (
    <div
      ref={ref}
      className={cn(
        "relative text-center",
        isInView ? animationClass : "opacity-0"
      )}
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      {/* Number circle with glow effect */}
      <div className="relative inline-flex group">
        <div className={cn(
          "w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center mb-6 mx-auto",
          "group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-500"
        )}>
          <div className={cn(
            "w-24 h-24 rounded-full bg-card shadow-card flex items-center justify-center",
            "group-hover:shadow-warm group-hover:scale-105 transition-all duration-300"
          )}>
            <span className="text-4xl group-hover:scale-110 transition-transform">{step.emoji}</span>
          </div>
        </div>
        <span className={cn(
          "absolute -top-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-sm shadow-pink",
          isInView && "animate-bounce-in"
        )} style={{ animationDelay: `${0.3 + index * 0.2}s` }}>
          {step.number}
        </span>
      </div>

      <h3 className="font-display text-xl font-semibold text-foreground mb-3">
        {step.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
        {step.description}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.3 });
  const { ref: lineRef, isInView: lineInView } = useScrollAnimation({ threshold: 0.5 });

  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <span className={cn(
            "inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4",
            headerInView ? "animate-blur-in" : "opacity-0"
          )}>
            como funciona
          </span>
          <h2 className={cn(
            "font-display text-3xl md:text-4xl font-bold text-foreground mb-4",
            headerInView ? "animate-slide-up stagger-1" : "opacity-0"
          )}>
            simples de usar
          </h2>
          <p className={cn(
            "text-lg text-muted-foreground max-w-xl mx-auto",
            headerInView ? "animate-fade-up stagger-2" : "opacity-0"
          )}>
            em 3 passos vocês começam a organizar as finanças juntos
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Animated connection line - desktop only */}
            <div 
              ref={lineRef}
              className={cn(
                "hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20",
                "origin-left transition-transform duration-1000 ease-out",
                lineInView ? "scale-x-100" : "scale-x-0"
              )}
            />

            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
