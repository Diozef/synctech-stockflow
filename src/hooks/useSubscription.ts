import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  plan_name: string;
  price_cents: number;
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  hotmart_transaction_id: string | null;
  hotmart_subscription_code: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const isTrialExpired = subscription?.status === 'trial' && 
    subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) < new Date();

  const isSubscriptionExpired = subscription?.status === 'expired' || 
    subscription?.status === 'cancelled';

  const hasActiveAccess = subscription?.status === 'active' || 
    (subscription?.status === 'trial' && !isTrialExpired);

  const daysRemaining = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    isLoading,
    error,
    refetch,
    isTrialExpired,
    isSubscriptionExpired,
    hasActiveAccess,
    daysRemaining,
  };
}
