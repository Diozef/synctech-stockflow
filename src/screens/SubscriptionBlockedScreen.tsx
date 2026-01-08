import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, ExternalLink, LogOut, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionBlockedScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { subscription, daysRemaining, refetch } = useSubscription();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleRefresh = () => {
    refetch();
  };

  // URL do checkout da Hotmart - substitua pelo seu link real
  const hotmartCheckoutUrl = 'https://pay.hotmart.com/SEU_PRODUTO';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Acesso Bloqueado</CardTitle>
          <CardDescription>
            {subscription?.status === 'trial' 
              ? 'Seu período de teste expirou'
              : 'Sua assinatura está inativa'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status atual */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="destructive">
                {subscription?.status === 'trial' ? 'Trial Expirado' : 
                 subscription?.status === 'cancelled' ? 'Cancelada' : 'Expirada'}
              </Badge>
            </div>
            {subscription?.status === 'trial' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Expirou há {Math.abs(daysRemaining)} dia(s)</span>
              </div>
            )}
          </div>

          {/* Plano */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Plano Básico</h3>
              <span className="text-lg font-bold text-primary">R$ 9,90/mês</span>
            </div>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cadastro ilimitado de produtos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Controle de estoque completo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Relatórios e análises</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Alertas de estoque baixo</span>
              </li>
            </ul>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.open(hotmartCheckoutUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Assinar agora
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRefresh}
            >
              Já assinei, verificar novamente
            </Button>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Após realizar a assinatura, aguarde alguns segundos e clique em "Já assinei" para liberar seu acesso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
