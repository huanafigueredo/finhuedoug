import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TogetherLogo } from "@/components/shared/TogetherLogo";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-28 pb-20 md:pt-40 md:pb-32 relative overflow-hidden bg-background">
      {/* Minimal background decoration */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left - Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-10 animate-fade-up opacity-0">
              <span className="text-base">💕</span>
              <span className="text-sm font-medium text-primary">
                para casais que planejam juntos
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 animate-fade-up opacity-0 stagger-1 leading-[1.1] tracking-tight">
              organizem as finanças{" "}
              <span className="text-primary">em um só lugar</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-12 animate-fade-up opacity-0 stagger-2 leading-relaxed">
              divisão automática, controle individual e metas compartilhadas. 
              simples, moderno e gratuito.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 animate-fade-up opacity-0 stagger-3">
              <Link to="/login">
                <Button variant="hero" size="xl" className="group shadow-lg">
                  começar grátis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-medium">
                <Play className="w-4 h-4" />
                como funciona
              </a>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative animate-fade-up opacity-0 stagger-4">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main card mockup */}
              <div className="bg-card rounded-3xl shadow-lg p-8 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <TogetherLogo size="sm" />
                    <span className="font-display font-semibold text-foreground">together</span>
                  </div>
                  <span className="text-sm text-muted-foreground">dez 2024</span>
                </div>

                {/* Balance card */}
                <div className="bg-muted/50 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">saldo disponível</p>
                  <p className="font-display text-4xl font-bold text-foreground mb-4">R$ 4.850</p>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                    <span>receitas: R$ 12.000</span>
                    <span>despesas: R$ 7.150</span>
                  </div>
                </div>

                {/* Mini metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <span className="text-2xl">🏠</span>
                    <p className="text-xs text-muted-foreground mt-2">moradia</p>
                    <p className="font-semibold text-foreground mt-1">R$ 2.100</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <span className="text-2xl">🍔</span>
                    <p className="text-xs text-muted-foreground mt-2">alimentação</p>
                    <p className="font-semibold text-foreground mt-1">R$ 1.800</p>
                  </div>
                </div>
              </div>

              {/* Floating element - simplified */}
              <div className="absolute -top-3 -right-3 bg-card rounded-xl shadow-md p-3 border border-border animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <p className="font-semibold text-foreground text-sm">75%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
