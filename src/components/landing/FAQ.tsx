import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const faqs = [
  { question: "é grátis mesmo?", answer: "Sim! O together é 100% gratuito. Todas as funcionalidades estão disponíveis sem custo." },
  { question: "preciso criar uma conta separada para meu parceiro(a)?", answer: "Não precisa! Vocês compartilham a mesma conta e cada um pode adicionar lançamentos identificando quem pagou e para quem é a despesa." },
  { question: "meus dados estão seguros?", answer: "Sim! Usamos criptografia de ponta e seus dados ficam armazenados em servidores seguros. Nunca compartilhamos suas informações financeiras." },
  { question: "funciona no celular?", answer: "Sim! O together é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores." },
  { question: "posso exportar meus dados?", answer: "Sim! Você pode exportar relatórios em PDF e ter acesso a todos os seus dados a qualquer momento." },
  { question: "como funciona a divisão de despesas?", answer: "Você pode escolher entre divisão 50/50, proporcional à renda de cada um, ou definir percentuais personalizados. A divisão pode ser configurada globalmente ou por categoria." },
];

export function FAQ() {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section id="faq" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center mb-16">
          <span className={cn("inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4", headerInView ? "animate-blur-in" : "opacity-0")}>dúvidas</span>
          <h2 className={cn("font-display text-3xl md:text-4xl font-bold text-foreground mb-4", headerInView ? "animate-slide-up stagger-1" : "opacity-0")}>perguntas frequentes</h2>
          <p className={cn("text-lg text-muted-foreground max-w-xl mx-auto", headerInView ? "animate-fade-up stagger-2" : "opacity-0")}>tudo que vocês precisam saber antes de começar</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => {
              const { ref, isInView } = useScrollAnimation({ threshold: 0.2 });
              return (
                <div ref={ref} key={index} className={cn(isInView ? "animate-slide-left" : "opacity-0")} style={{ animationDelay: `${index * 0.1}s` }}>
                  <AccordionItem value={`item-${index}`} className="bg-card rounded-xl border border-border/50 px-6 data-[state=open]:shadow-card transition-shadow hover:bg-secondary/30">
                    <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline py-5">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">{faq.answer}</AccordionContent>
                  </AccordionItem>
                </div>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
