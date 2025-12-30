import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

export function FinalCTA() {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-soft" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div ref={ref} className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className={cn("inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8", isInView ? "animate-bounce-in" : "opacity-0")}>
            <Heart className="w-10 h-10 text-primary" />
          </div>

          <h2 className={cn("font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6", isInView ? "animate-slide-up stagger-1" : "opacity-0")}>
            prontos para organizar a vida financeira <span className="text-gradient">juntos</span>?
          </h2>

          <p className={cn("text-lg md:text-xl text-muted-foreground mb-10", isInView ? "animate-fade-up stagger-2" : "opacity-0")}>
            comecem hoje e transformem a forma como vocês lidam com dinheiro. é grátis e leva menos de 1 minuto.
          </p>

          <div className={cn(isInView ? "animate-scale-in stagger-3" : "opacity-0")}>
            <Link to="/login">
              <Button variant="hero" size="xl" className="group text-lg px-10 py-6 h-auto animate-glow-pulse">
                criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <p className={cn("mt-6 text-sm text-muted-foreground", isInView ? "animate-fade-up stagger-4" : "opacity-0")}>
            ✓ Sem cartão de crédito &nbsp; ✓ Dados criptografados &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
