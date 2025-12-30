import { TogetherLogo } from "@/components/shared/TogetherLogo";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

export function ScreenshotPreview() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.3 });
  const { ref: mockupRef, isInView: mockupInView } = useScrollAnimation({ threshold: 0.15 });
  const { ref: parallaxRef, offset } = useParallax(0.2);

  return (
    <section ref={parallaxRef} className="py-20 md:py-28 bg-secondary/30 overflow-hidden relative">
      {/* Parallax background elements */}
      <div 
        className="absolute top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${offset * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-20 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${-offset * 0.3}px)` }}
      />

      <div className="container mx-auto px-4 relative">
        <div ref={headerRef} className="text-center mb-12">
          <span className={cn(
            "inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4",
            headerInView ? "animate-blur-in" : "opacity-0"
          )}>
            prévia
          </span>
          <h2 className={cn(
            "font-display text-3xl md:text-4xl font-bold text-foreground mb-4",
            headerInView ? "animate-slide-up stagger-1" : "opacity-0"
          )}>
            veja como é por dentro
          </h2>
          <p className={cn(
            "text-lg text-muted-foreground max-w-xl mx-auto",
            headerInView ? "animate-fade-up stagger-2" : "opacity-0"
          )}>
            uma interface pensada para vocês dois
          </p>
        </div>

        {/* Browser frame mockup with perspective effect */}
        <div 
          ref={mockupRef}
          className={cn(
            "max-w-5xl mx-auto perspective-1000",
            mockupInView ? "animate-rotate-in" : "opacity-0"
          )}
          style={{ 
            transform: mockupInView ? `rotateX(${Math.max(0, 5 - offset * 0.1)}deg)` : 'rotateX(10deg)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          <div className="bg-card rounded-2xl shadow-warm border border-border/50 overflow-hidden hover-lift">
            {/* Browser header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60 hover:bg-destructive transition-colors" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60 hover:bg-yellow-400 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-green-400/60 hover:bg-green-400 transition-colors" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1 bg-background rounded-lg text-sm text-muted-foreground">
                  <TogetherLogo size="xs" />
                  <span>together.app/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 bg-background">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TogetherLogo size="sm" />
                  <span className="font-display font-semibold text-foreground">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse-soft" />
                  <div className="w-8 h-8 rounded-full bg-accent/20 animate-pulse-soft" style={{ animationDelay: "0.5s" }} />
                </div>
              </div>

              {/* Hero balance with shimmer */}
              <div className="bg-gradient-to-br from-primary/10 via-secondary to-accent/10 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">saldo disponível em dezembro</p>
                    <p className="font-display text-4xl font-bold text-foreground">R$ 4.850,00</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">receitas</p>
                      <p className="font-semibold text-green-600">R$ 12.000</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">despesas</p>
                      <p className="font-semibold text-destructive">R$ 7.150</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics grid with staggered animations */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { emoji: "🏠", label: "moradia", value: "R$ 2.100" },
                  { emoji: "🍔", label: "alimentação", value: "R$ 1.800" },
                  { emoji: "🚗", label: "transporte", value: "R$ 950" },
                  { emoji: "🎯", label: "metas", value: "R$ 500" },
                ].map((item, index) => (
                  <div 
                    key={item.label} 
                    className={cn(
                      "bg-secondary/50 rounded-xl p-4 text-center hover:bg-secondary/70 transition-colors",
                      mockupInView ? "animate-bounce-in" : "opacity-0"
                    )}
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    <p className="font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts placeholder */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4 h-40 flex items-center justify-center group hover:bg-secondary/50 transition-colors">
                  <div className="text-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm mt-2">gráfico por categoria</p>
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 h-40 flex items-center justify-center group hover:bg-secondary/50 transition-colors">
                  <div className="text-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📈</span>
                    <p className="text-sm mt-2">evolução mensal</p>
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
