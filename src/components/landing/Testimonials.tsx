const testimonials = [
  {
    quote: "Paramos de brigar por dinheiro. Agora está tudo transparente.",
    couple: "Marina & Pedro",
    avatar1: "M",
    avatar2: "P",
  },
  {
    quote: "A divisão proporcional mudou nossa vida financeira.",
    couple: "Julia & André",
    avatar1: "J",
    avatar2: "A",
  },
  {
    quote: "Juntamos R$ 15.000 para nossa viagem com as metas!",
    couple: "Carla & Bruno",
    avatar1: "C",
    avatar2: "B",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0">
            casais que usam amam
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.couple}
              className="bg-card rounded-2xl p-8 border border-border animate-fade-up opacity-0"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary border-2 border-card">
                    {testimonial.avatar1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground border-2 border-card">
                    {testimonial.avatar2}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{testimonial.couple}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
