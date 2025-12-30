import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { TogetherLogo } from '@/components/shared/TogetherLogo';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup' | 'forgot' | 'email-exists';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>(() => {
    if (searchParams.get('forgot') === 'true') return 'forgot';
    return 'login';
  });
  const [emailSent, setEmailSent] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get redirect path from query params
  const redirectTo = searchParams.get('redirect') 
    ? decodeURIComponent(searchParams.get('redirect')!) 
    : '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, redirectTo]);

  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      let title = 'Erro no login';
      let message = 'Email ou senha incorretos';
      
      if (error.message.includes('Invalid login credentials')) {
        if (newAttempts >= 2) {
          message = 'Senha incorreta. Você pode usar "Esqueci minha senha" para recuperar seu acesso.';
        } else {
          message = 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
        }
      } else if (error.message.includes('Email not confirmed')) {
        title = 'Email não confirmado';
        message = 'Verifique sua caixa de entrada para confirmar seu email antes de fazer login.';
      }
      
      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      setLoginAttempts(0);
      toast({
        title: 'Bem-vindo(a)! 💕',
        description: 'Acesso liberado ao together finanças',
      });
      navigate(redirectTo, { replace: true });
    }
  };

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu nome completo',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        // Show intermediate screen instead of auto-switching
        setMode('email-exists');
        setPassword('');
        return;
      } else if (error.message.includes('Signups not allowed') || error.message.includes('signup_disabled')) {
        toast({
          title: 'Cadastro desabilitado',
          description: 'O cadastro de novos usuários está temporariamente desabilitado. Contate o administrador.',
          variant: 'destructive',
        });
        return;
      } else if (error.message.includes('Password should be at least')) {
        toast({
          title: 'Senha muito curta',
          description: 'A senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta criada! 💕',
        description: 'Você já pode fazer login com sua conta',
      });
      setMode('login');
      setPassword('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu email',
        variant: 'destructive',
      });
      return;
    }

    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o email. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      setEmailSent(true);
      toast({
        title: 'Email enviado! 📧',
        description: 'Verifique sua caixa de entrada para redefinir sua senha',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      switch (mode) {
        case 'login':
          await handleLogin();
          break;
        case 'signup':
          await handleSignUp();
          break;
        case 'forgot':
          await handleForgotPassword();
          break;
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

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setPassword('');
    setEmailSent(false);
    if (newMode !== 'email-exists') {
      setLoginAttempts(0);
    }
  };

  const goToLogin = () => {
    setMode('login');
    setPassword('');
    setLoginAttempts(0);
  };

  const goToForgotPassword = () => {
    setMode('forgot');
    setPassword('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <TogetherLogo size="xl" />
        </div>
      </div>
    );
  }

  // Email already exists - intermediate screen
  if (mode === 'email-exists') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Email já cadastrado
            </h1>
            
            <p className="text-muted-foreground mb-6">
              O email <strong className="text-foreground">{email}</strong> já possui uma conta no together finanças.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={goToLogin}
                className="w-full h-12 rounded-xl text-lg font-semibold"
              >
                <Lock className="w-5 h-5 mr-2" />
                Fazer Login
              </Button>
              
              <Button 
                onClick={goToForgotPassword}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                <KeyRound className="w-5 h-5 mr-2" />
                Esqueci minha senha
              </Button>
            </div>
            
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Usar outro email
            </button>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Gerenciem juntos, cresçam juntos 💕
          </p>
        </div>
      </div>
    );
  }

  // Email sent confirmation screen
  if (mode === 'forgot' && emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Email Enviado!
          </h1>
          <p className="text-muted-foreground mb-6">
            Enviamos um link de recuperação para <strong>{email}</strong>. 
            Verifique sua caixa de entrada e spam.
          </p>
          <Button 
            onClick={() => switchMode('login')} 
            variant="outline"
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TogetherLogo size="xl" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            together finanças
          </h1>
          <p className="text-muted-foreground">
            {mode === 'login' && 'Entre na sua conta'}
            {mode === 'signup' && 'Crie sua conta'}
            {mode === 'forgot' && 'Recupere sua senha'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border/50 space-y-4">
            {mode === 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar para login
                </button>
                <p className="text-sm text-muted-foreground mb-4">
                  Digite seu email abaixo e enviaremos um link para você criar uma nova senha.
                </p>
              </>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Show hint after 2 failed login attempts */}
            {mode === 'login' && loginAttempts >= 2 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Dica:</strong> Se você esqueceu sua senha, clique em{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-primary underline hover:no-underline"
                  >
                    "Esqueci minha senha"
                  </button>
                  {' '}para recuperar seu acesso.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 mt-4 text-lg font-semibold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Aguarde...' : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'signup' && 'Criar Conta'}
                  {mode === 'forgot' && 'Enviar Email de Recuperação'}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Não tem conta? Cadastre-se
            </button>
          )}
          
          {mode === 'signup' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Já tem conta? Faça login
              </button>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
              >
                Esqueci minha senha
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Gerenciem juntos, cresçam juntos 💕
        </p>
      </div>
    </div>
  );
};

export default Login;
