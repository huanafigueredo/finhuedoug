import { Link, useLocation } from "react-router-dom";
import { Heart, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Lançamentos", path: "/lancamentos" },
  { label: "Pessoas", path: "/pessoas" },
  { label: "Configurações", path: "/config" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CasalFin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/novo">
                  <Button size="sm">Novo Lançamento</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/novo" onClick={() => setIsOpen(false)}>
                    <Button className="w-full mt-2">Novo Lançamento</Button>
                  </Link>
                  <Button variant="outline" className="w-full mt-2" onClick={() => { logout(); setIsOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full mt-2">Entrar</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
