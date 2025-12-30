import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6 animate-fade-up opacity-0">
            prontos para começar?
          </h2>

          <p className="text-muted-foreground mb-10 animate-fade-up opacity-0 stagger-1">
            grátis, sem cartão de crédito, sem complicação.
          </p>

          <div className="animate-fade-up opacity-0 stagger-2">
            <Link to="/login">
              <Button variant="hero" size="xl" className="group shadow-lg">
                criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
