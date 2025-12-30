export function SocialProofBar() {
  const stats = [
    { value: "1.000+", label: "casais" },
    { value: "R$ 2M+", label: "transações" },
    { value: "4.9★", label: "avaliação" },
  ];

  return (
    <section className="py-6 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-12 md:gap-20">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center animate-fade-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="font-display font-bold text-foreground text-xl">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
