import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(password);
      
      if (success) {
        toast({
          title: "Bem-vindos! 💕",
          description: "Acesso liberado ao CasalFin",
        });
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: "Senha incorreta",
          description: "Tente novamente",
          variant: "destructive",
        });
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            CasalFin
          </h1>
          <p className="text-muted-foreground">
            Digite a senha para acessar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Senha do casal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 text-lg rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 mt-6 text-lg font-semibold rounded-xl"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Entrando...' : 'Entrar na Planilha'}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Gerenciem juntos, cresçam juntos 💕
        </p>
      </div>
    </div>
  );
};

export default Login;
