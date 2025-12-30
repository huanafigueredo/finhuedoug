import { TogetherLogo } from "@/components/shared/TogetherLogo";

export function ScreenshotPreview() {
  return (
    <section className="py-20 md:py-28 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4 animate-fade-up opacity-0">
            prévia
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0 stagger-1">
            veja como é por dentro
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-up opacity-0 stagger-2">
            uma interface pensada para vocês dois
          </p>
        </div>

        {/* Browser frame mockup */}
        <div className="max-w-5xl mx-auto animate-fade-up opacity-0 stagger-3">
          <div className="bg-card rounded-2xl shadow-warm border border-border/50 overflow-hidden">
            {/* Browser header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
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
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                  <div className="w-8 h-8 rounded-full bg-accent/20" />
                </div>
              </div>

              {/* Hero balance */}
              <div className="bg-gradient-to-br from-primary/10 via-secondary to-accent/10 rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { emoji: "🏠", label: "moradia", value: "R$ 2.100" },
                  { emoji: "🍔", label: "alimentação", value: "R$ 1.800" },
                  { emoji: "🚗", label: "transporte", value: "R$ 950" },
                  { emoji: "🎯", label: "metas", value: "R$ 500" },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/50 rounded-xl p-4 text-center">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    <p className="font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts placeholder */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4 h-40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm mt-2">gráfico por categoria</p>
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 h-40 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
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
