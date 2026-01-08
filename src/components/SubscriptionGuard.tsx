import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionBlockedScreen from '@/screens/SubscriptionBlockedScreen';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading, hasActiveAccess } = useSubscription();

  // Ainda carregando auth ou subscription
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usuário não logado - deixa o ProtectedRoute lidar
  if (!user) {
    return <>{children}</>;
  }

  // Sem assinatura ou sem acesso ativo - bloqueia
  if (!subscription || !hasActiveAccess) {
    return <SubscriptionBlockedScreen />;
  }

  // Acesso liberado
  return <>{children}</>;
}
