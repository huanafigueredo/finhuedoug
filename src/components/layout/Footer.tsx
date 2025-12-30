import { Link } from "react-router-dom";
import { TogetherLogo } from "@/components/shared/TogetherLogo";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TogetherLogo size="sm" />
              <span className="font-display font-semibold text-foreground">together finanças</span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              gerenciando o amor e as finanças juntos. uma forma simples e moderna de organizar a vida financeira do casal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">navegação</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  dashboard
                </Link>
              </li>
              <li>
                <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                  como funciona
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  perguntas frequentes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">contato</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contato@together.app" className="text-muted-foreground hover:text-primary transition-colors">
                  contato@together.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 together finanças. todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            feito com <Heart className="w-3 h-3 text-primary" /> para casais organizados
          </p>
        </div>
      </div>
    </footer>
  );
}
