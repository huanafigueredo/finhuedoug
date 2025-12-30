import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote: "Finalmente paramos de brigar por dinheiro. Agora está tudo transparente e organizado!",
    couple: "Marina & Pedro",
    time: "usando há 8 meses",
    avatar1: "M",
    avatar2: "P",
  },
  {
    quote: "A divisão proporcional mudou nossa vida. Cada um paga o que pode, sem culpa.",
    couple: "Julia & André",
    time: "usando há 5 meses",
    avatar1: "J",
    avatar2: "A",
  },
  {
    quote: "As metas compartilhadas nos ajudaram a juntar R$ 15.000 para nossa viagem!",
    couple: "Carla & Bruno",
    time: "usando há 1 ano",
    avatar1: "C",
    avatar2: "B",
  },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={cn(
        "bg-card rounded-2xl p-8 border border-border/50 shadow-card hover-lift",
        isInView ? "animate-slide-up" : "opacity-0"
      )}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Quote icon with animation */}
      <div className={cn(
        "text-4xl text-primary/20 mb-4",
        isInView && "animate-scale-in"
      )} style={{ animationDelay: `${0.2 + index * 0.15}s` }}>
        "
      </div>

      {/* Quote text */}
      <p className="text-foreground leading-relaxed mb-6 text-lg">
        {testimonial.quote}
      </p>

      {/* Author with animated avatars */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary border-2 border-card",
            "hover:scale-110 hover:z-10 transition-transform"
          )}>
            {testimonial.avatar1}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent border-2 border-card",
            "hover:scale-110 hover:z-10 transition-transform"
          )}>
            {testimonial.avatar2}
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">{testimonial.couple}</p>
          <p className="text-sm text-muted-foreground">{testimonial.time}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <span className={cn(
            "inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4",
            headerInView ? "animate-blur-in" : "opacity-0"
          )}>
            depoimentos
          </span>
          <h2 className={cn(
            "font-display text-3xl md:text-4xl font-bold text-foreground mb-4",
            headerInView ? "animate-slide-up stagger-1" : "opacity-0"
          )}>
            casais que usam amam 💕
          </h2>
          <p className={cn(
            "text-lg text-muted-foreground max-w-xl mx-auto",
            headerInView ? "animate-fade-up stagger-2" : "opacity-0"
          )}>
            veja o que outros casais estão dizendo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.couple} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
