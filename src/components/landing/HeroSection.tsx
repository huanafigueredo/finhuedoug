import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TogetherLogo } from "@/components/shared/TogetherLogo";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-soft" />
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up opacity-0">
              <span className="text-lg">💕</span>
              <span className="text-sm font-medium text-primary">
                para casais que planejam o futuro juntos
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up opacity-0 stagger-1 leading-tight">
              organizem as finanças do casal{" "}
              <span className="text-gradient">em um só lugar</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up opacity-0 stagger-2 leading-relaxed">
              divisão automática de despesas, controle por pessoa e metas compartilhadas. 
              tudo o que vocês precisam para crescer juntos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up opacity-0 stagger-3">
              <Link to="/login">
                <Button variant="hero" size="xl" className="group">
                  começar agora — é grátis
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
                <Play className="w-4 h-4" />
                ver como funciona
              </a>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative animate-fade-up opacity-0 stagger-4">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main card mockup */}
              <div className="bg-card rounded-3xl shadow-warm p-6 border border-border/50 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TogetherLogo size="sm" />
                    <span className="font-display font-semibold text-foreground">together</span>
                  </div>
                  <span className="text-sm text-muted-foreground">dezembro 2024</span>
                </div>

                {/* Balance card */}
                <div className="bg-gradient-to-br from-primary/10 via-secondary to-accent/10 rounded-2xl p-6 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">saldo disponível</p>
                  <p className="font-display text-3xl font-bold text-foreground">R$ 4.850,00</p>
                  <div className="mt-4 h-2 bg-background/50 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>receitas: R$ 12.000</span>
                    <span>despesas: R$ 7.150</span>
                  </div>
                </div>

                {/* Mini metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <span className="text-2xl">🏠</span>
                    <p className="text-xs text-muted-foreground mt-1">moradia</p>
                    <p className="font-semibold text-foreground">R$ 2.100</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <span className="text-2xl">🍔</span>
                    <p className="text-xs text-muted-foreground mt-1">alimentação</p>
                    <p className="font-semibold text-foreground">R$ 1.800</p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-card p-4 border border-border/50 animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-xs text-muted-foreground">meta: viagem</p>
                    <p className="font-semibold text-foreground text-sm">75% concluído</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-card p-4 border border-border/50 animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💑</span>
                  <div>
                    <p className="text-xs text-muted-foreground">divisão</p>
                    <p className="font-semibold text-foreground text-sm">50% cada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
