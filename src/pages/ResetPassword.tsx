import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL hash for recovery token (Supabase sends it in the hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        // Set the session using the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });
        
        if (!error) {
          setIsValidSession(true);
        }
      } else if (session) {
        setIsValidSession(true);
      }
      
      setIsChecking(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a senha. Tente novamente.',
          variant: 'destructive',
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Senha atualizada! 💕',
          description: 'Sua nova senha foi salva com sucesso',
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary fill-primary" />
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Link Inválido ou Expirado
          </h1>
          <p className="text-muted-foreground mb-6">
            Este link de recuperação de senha é inválido ou já expirou. 
            Solicite um novo link de recuperação.
          </p>
          <Button onClick={() => navigate('/login?forgot=true')} className="rounded-xl">
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Senha Atualizada!
          </h1>
          <p className="text-muted-foreground">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Nova Senha
          </h1>
          <p className="text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-4 text-lg font-semibold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
