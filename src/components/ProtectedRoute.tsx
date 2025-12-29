import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessData } from '@/hooks/useBusiness';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBusiness?: boolean;
}

export function ProtectedRoute({ children, requireBusiness = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusinessData();
  const location = useLocation();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show loading while checking business
  if (requireBusiness && businessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to onboarding if no business configured
  if (requireBusiness && !business) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <>{children}</>;
}
