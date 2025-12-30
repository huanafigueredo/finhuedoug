import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "é grátis?",
    answer: "Sim, 100% gratuito. Todas as funcionalidades disponíveis.",
  },
  {
    question: "meu parceiro precisa de conta separada?",
    answer: "Não. Vocês compartilham a mesma conta e identificam quem pagou cada despesa.",
  },
  {
    question: "meus dados estão seguros?",
    answer: "Sim. Usamos criptografia e servidores seguros.",
  },
  {
    question: "funciona no celular?",
    answer: "Sim. Interface responsiva para qualquer dispositivo.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-up opacity-0">
            dúvidas frequentes
          </h2>
        </div>

        <div className="max-w-xl mx-auto animate-fade-up opacity-0 stagger-1">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-5"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
