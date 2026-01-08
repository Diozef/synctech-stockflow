import React from 'react';
import { Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { subscription, daysRemaining } = useSubscription();

  // Só mostra se está em trial
  if (subscription?.status !== 'trial') return null;

  const isUrgent = daysRemaining <= 2;

  return (
    <div className={`px-4 py-2 text-center text-sm ${
      isUrgent 
        ? 'bg-destructive/10 text-destructive' 
        : 'bg-primary/10 text-primary'
    }`}>
      <Clock className="inline-block h-4 w-4 mr-1 -mt-0.5" />
      {daysRemaining === 0 
        ? 'Seu período de teste termina hoje!' 
        : daysRemaining === 1 
          ? 'Seu período de teste termina amanhã!' 
          : `${daysRemaining} dias restantes no período de teste`}
    </div>
  );
}
