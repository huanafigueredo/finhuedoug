const steps = [
  {
    number: "1",
    title: "cadastrem-se",
    description: "conta compartilhada em segundos.",
  },
  {
    number: "2",
    title: "registrem",
    description: "adicionem receitas e despesas.",
  },
  {
    number: "3",
    title: "acompanhem",
    description: "gráficos e divisões em tempo real.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0">
            simples de usar
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto animate-fade-up opacity-0 stagger-1">
            3 passos para organizar as finanças
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="text-center animate-fade-up opacity-0"
                style={{ animationDelay: `${(index + 1) * 0.12}s` }}
              >
                {/* Number */}
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6">
                  <span className="font-display text-2xl font-bold">{step.number}</span>
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
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
