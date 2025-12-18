import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  Lock,
  Bell,
  AlertTriangle,
  ChevronRight,
  Info,
  Minus,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 06 — CONFIGURAÇÕES
// ====================================================
// FUNÇÃO: Configurações básicas do sistema

export function SettingsScreen() {
  const navigate = useNavigate();
  const { businessType, hasProducts, minStockAlert, setMinStockAlert, canChangeBusinessType } = useBusiness();
  const config = getNicheConfig(businessType);

  // Mock notification states
  const [notifyLowStock, setNotifyLowStock] = React.useState(true);
  const [notifyExpiration, setNotifyExpiration] = React.useState(true);

  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  const Icon = config.icon;
  const canChange = canChangeBusinessType();

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Personalize seu sistema
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Type Card */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Tipo de negócio
              {!canChange && <Lock className="w-4 h-4 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl",
                config.gradient
              )}>
                <Icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{config.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            
            {canChange ? (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/')}
              >
                Trocar tipo de negócio
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="mt-4 p-3 bg-secondary/50 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Alteração bloqueada</p>
                  <p className="text-xs text-muted-foreground">
                    Você já cadastrou produtos. Para manter a consistência dos dados, não é possível alterar o tipo de negócio.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Alert Settings */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alerta de estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Receba alertas quando um produto tiver menos que a quantidade mínima definida.
            </p>
            
            <Label className="text-sm font-medium mb-3 block">
              Quantidade mínima
            </Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setMinStockAlert(Math.max(1, minStockAlert - 1))}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <span className="text-3xl font-bold">{minStockAlert}</span>
                <p className="text-xs text-muted-foreground">unidades</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setMinStockAlert(minStockAlert + 1)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications (Mock) */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-info" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Estoque baixo</Label>
                <p className="text-xs text-muted-foreground">
                  Aviso quando produtos atingem o mínimo
                </p>
              </div>
              <Switch 
                checked={notifyLowStock} 
                onCheckedChange={setNotifyLowStock}
              />
            </div>
            
            {config.fields.showExpiration && (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Validade próxima</Label>
                  <p className="text-xs text-muted-foreground">
                    Aviso quando produtos estão próximos do vencimento
                  </p>
                </div>
                <Switch 
                  checked={notifyExpiration} 
                  onCheckedChange={setNotifyExpiration}
                />
              </div>
            )}

            <div className="p-3 bg-info/10 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                As notificações serão enviadas assim que você configurar sua conta completa.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Info */}
        <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Produtos cadastrados</span>
              <span className="font-semibold">{hasProducts ? 'Sim' : 'Não'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
