import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { Heart, PieChart, Users, Sparkles, ArrowRight } from "lucide-react";

const features = [
  {
    icon: PieChart,
    title: "Controle Inteligente",
    description:
      "Acompanhe todas as despesas e receitas do casal com gráficos intuitivos e relatórios detalhados.",
  },
  {
    icon: Users,
    title: "Divisão Justa",
    description:
      "Divisão automática das despesas compartilhadas. Saiba exatamente quanto cada um deve.",
  },
  {
    icon: Sparkles,
    title: "Visual Moderno",
    description:
      "Interface elegante inspirada nas melhores fintechs. Organização nunca foi tão bonita.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 gradient-soft" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up opacity-0">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Para casais que sonham juntos
              </span>
            </div>

            {/* Main heading */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-up opacity-0 stagger-1">
              Gerenciem juntos,{" "}
              <span className="text-gradient">cresçam juntos</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up opacity-0 stagger-2">
              Uma planilha financeira elegante para casais, com divisão
              automática, controle por banco, categorias e visual moderno
              inspirado nas melhores fintechs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up opacity-0 stagger-3">
              <Link to="/dashboard">
                <Button variant="hero" size="xl">
                  Entrar na Planilha
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/novo">
                <Button variant="hero-outline" size="xl">
                  Adicionar Lançamento
                </Button>
              </Link>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div className="mt-16 md:mt-24 flex justify-center animate-fade-up opacity-0 stagger-4">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center animate-float">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-card shadow-warm flex items-center justify-center">
                  <div className="text-center">
                    <Heart className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-2" />
                    <span className="font-display text-lg md:text-xl font-semibold text-foreground">
                      H + D
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que vocês precisam
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ferramentas pensadas para facilitar a vida financeira do casal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${(index + 1) * 0.15}s` }}
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Prontos para começar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a casais que já estão organizando suas finanças com amor
            </p>
            <Link to="/dashboard">
              <Button variant="hero" size="xl">
                Acessar o Dashboard
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
