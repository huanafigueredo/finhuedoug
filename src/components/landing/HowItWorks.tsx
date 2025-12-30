const steps = [
  {
    number: "01",
    emoji: "👥",
    title: "cadastrem-se juntos",
    description: "criem uma conta compartilhada em segundos. sem burocracia.",
  },
  {
    number: "02",
    emoji: "➕",
    title: "adicionem lançamentos",
    description: "registrem receitas e despesas. digam quem pagou e pra quem é.",
  },
  {
    number: "03",
    emoji: "📊",
    title: "acompanhem em tempo real",
    description: "vejam gráficos, divisões e metas atualizados instantaneamente.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4 animate-fade-up opacity-0">
            como funciona
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0 stagger-1">
            simples de usar
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-up opacity-0 stagger-2">
            em 3 passos vocês começam a organizar as finanças juntos
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line - desktop only */}
            <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center animate-fade-up opacity-0"
                style={{ animationDelay: `${(index + 1) * 0.15}s` }}
              >
                {/* Number circle */}
                <div className="relative inline-flex">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center mb-6 mx-auto">
                    <div className="w-24 h-24 rounded-full bg-card shadow-card flex items-center justify-center">
                      <span className="text-4xl">{step.emoji}</span>
                    </div>
                  </div>
                  <span className="absolute -top-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-sm shadow-pink">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
