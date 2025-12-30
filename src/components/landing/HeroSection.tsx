import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useParallax } from "@/hooks/useScrollAnimation";
import heroIllustration from "@/assets/hero-illustration.png";

export function HeroSection() {
  const { ref: parallaxRef, offset } = useParallax(0.3);

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
      {/* Animated background decorations with parallax */}
      <div className="absolute inset-0 gradient-soft" />
      <div 
        ref={parallaxRef}
        className="absolute top-10 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${offset * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${-offset * 0.3}px)` }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Copy with staggered blur-in animations */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-blur-in opacity-0">
              <span className="text-lg">💕</span>
              <span className="text-sm font-medium text-primary">
                para casais que planejam o futuro juntos
              </span>
            </div>

            {/* Headline with slide animation */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-left opacity-0 stagger-1 leading-tight">
              organizem as finanças do casal{" "}
              <span className="text-gradient">em um só lugar</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up opacity-0 stagger-2 leading-relaxed">
              divisão automática de despesas, controle por pessoa e metas compartilhadas. 
              tudo o que vocês precisam para crescer juntos.
            </p>

            {/* CTAs with scale animation */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-scale-in opacity-0 stagger-3">
              <Link to="/login">
                <Button variant="hero" size="xl" className="group animate-glow-pulse">
                  começar agora — é grátis
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium group">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                ver como funciona
              </a>
            </div>
          </div>

          {/* Right - Hero Illustration */}
          <div className="relative animate-rotate-in opacity-0 stagger-2">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Main illustration with hover effect */}
              <div className="relative hover-lift rounded-3xl overflow-hidden shadow-warm">
                <img 
                  src={heroIllustration} 
                  alt="Casal feliz organizando finanças juntos" 
                  className="w-full h-auto rounded-3xl"
                />
                
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-card p-4 border border-border/50 animate-float hover:scale-105 transition-transform">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-xs text-muted-foreground">meta: viagem</p>
                    <p className="font-semibold text-foreground text-sm">75% concluído</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-card p-4 border border-border/50 animate-float hover:scale-105 transition-transform" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="text-xs text-muted-foreground">economizado</p>
                    <p className="font-semibold text-foreground text-sm">R$ 2.500</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-8 bg-card rounded-2xl shadow-card p-3 border border-border/50 animate-float hidden lg:block hover:scale-105 transition-transform" style={{ animationDelay: "0.8s" }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <p className="font-semibold text-foreground text-xs">50/50</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
