import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary animate-heartbeat" />
            <span className="text-sm text-muted-foreground">
              CasalFin — Gerenciando o amor e as finanças juntos
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Feito com <Heart className="w-3 h-3 inline text-primary fill-primary" /> para casais organizados
          </p>
        </div>
      </div>
    </footer>
  );
}
