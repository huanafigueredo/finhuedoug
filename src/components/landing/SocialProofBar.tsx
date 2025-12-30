import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

export function SocialProofBar() {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.5 });

  const stats = [
    { emoji: "💑", value: "1.000+", label: "casais organizados" },
    { emoji: "💰", value: "R$ 2M+", label: "em transações" },
    { emoji: "⭐", value: "4.9/5", label: "avaliação" },
    { emoji: "📱", value: "100%", label: "grátis" },
  ];

  return (
    <section ref={ref} className="py-8 bg-secondary/40 border-y border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className={cn(
                "flex items-center gap-3",
                isInView ? "animate-bounce-in" : "opacity-0"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className={cn(
                "text-2xl",
                isInView && "animate-float"
              )} style={{ animationDelay: `${index * 0.2}s` }}>
                {stat.emoji}
              </span>
              <div>
                <p className="font-display font-bold text-foreground text-lg">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
