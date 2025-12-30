import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-soft" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 animate-fade-up opacity-0">
            <Heart className="w-10 h-10 text-primary" />
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 animate-fade-up opacity-0 stagger-1">
            prontos para organizar a vida financeira{" "}
            <span className="text-gradient">juntos</span>?
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-up opacity-0 stagger-2">
            comecem hoje e transformem a forma como vocês lidam com dinheiro.
            é grátis e leva menos de 1 minuto.
          </p>

          {/* CTA */}
          <div className="animate-fade-up opacity-0 stagger-3">
            <Link to="/login">
              <Button variant="hero" size="xl" className="group text-lg px-10 py-6 h-auto">
                criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-6 text-sm text-muted-foreground animate-fade-up opacity-0 stagger-4">
            ✓ Sem cartão de crédito &nbsp; ✓ Dados criptografados &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
