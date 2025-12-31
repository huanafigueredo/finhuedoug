import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { Heart } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isComplete, isLoading: onboardingLoading } = useOnboardingStatus();
  const location = useLocation();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary fill-primary" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  // Show loading while onboarding status is being checked
  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary fill-primary" />
        </div>
      </div>
    );
  }

  // Redirect to onboarding if not complete (except if already on onboarding page)
  if (!isComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If on onboarding and already complete, redirect to dashboard
  if (isComplete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
