import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusinessData } from '@/hooks/useBusiness';
import { useAuth } from '@/contexts/AuthContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Lock,
  Bell,
  AlertTriangle,
  ChevronRight,
  Info,
  Minus,
  Plus,
  Store,
  Settings2,
  Trash2,
  ExternalLink,
  Shield,
  LogOut,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ====================================================
// MÓDULO: TELA 07 — CONFIGURAÇÕES / PERFIL DO NEGÓCIO
// ====================================================

export function SettingsScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { 
    business,
    businessType, 
    hasProducts, 
    minStockAlert, 
    updateBusiness,
    canChangeBusinessType,
    loading
  } = useBusinessData();
  const config = getNicheConfig(businessType);

  // Estados locais
  const [businessName, setBusinessName] = useState(business?.business_name || 'Meu Negócio');
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyExpiration, setNotifyExpiration] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [localMinAlert, setLocalMinAlert] = useState(minStockAlert);
  const [isUpdating, setIsUpdating] = useState(false);

  
  //React.useEffect(() => {
    //if (!loading && !businessType) {
      //navigate('/app/onboarding');
    //}
  //}, [loading, businessType, navigate]);

  React.useEffect(() => {
    if (business) {
      setBusinessName(business.business_name || 'Meu Negócio');
      setLocalMinAlert(business.min_stock_alert);
    }
  }, [business]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) return null;

  const Icon = config.icon;
  const canChange = canChangeBusinessType;

  // Handlers
  const handleUpdateMinAlert = async (value: number) => {
    setLocalMinAlert(value);
    try {
      await updateBusiness({ min_stock_alert: value });
    } catch (error) {
      console.error('Error updating min alert:', error);
    }
  };

  const handleUpdateBusinessName = async () => {
    if (!businessName.trim()) return;
    setIsUpdating(true);
    try {
      await updateBusiness({ business_name: businessName.trim() });
      toast.success('Nome atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar nome');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações do seu negócio
        </p>
      </div>

      <div className="space-y-4 pb-4">
        {/* Perfil do negócio */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Perfil do negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome do negócio */}
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium">
                Nome do negócio
              </Label>
              <div className="flex gap-2">
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Digite o nome do seu negócio"
                  className="h-12 flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleUpdateBusinessName}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>

            {/* Tipo de negócio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                Tipo de negócio
                {!canChange && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              </Label>
              <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  config.gradient
                )}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{config.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
              
              {canChange ? (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate('/app/onboarding')}
                >
                  Trocar tipo de negócio
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
                  <Lock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Exclua seus produtos para alterar o nicho do negócio.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferências do sistema */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-info" />
              Preferências do sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alerta de estoque baixo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Alertas de estoque baixo</Label>
                  <p className="text-xs text-muted-foreground">
                    Aviso quando produtos atingem o mínimo
                  </p>
                </div>
                <Switch 
                  checked={notifyLowStock} 
                  onCheckedChange={setNotifyLowStock}
                />
              </div>

              {notifyLowStock && (
                <div className="pl-4 border-l-2 border-primary/20">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Quantidade mínima para alerta
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleUpdateMinAlert(Math.max(1, localMinAlert - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center min-w-[60px]">
                      <span className="text-2xl font-bold">{localMinAlert}</span>
                      <p className="text-[10px] text-muted-foreground">unidades</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleUpdateMinAlert(localMinAlert + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Alerta de validade (apenas cosméticos) */}
            {config.fields.showExpiration && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Alertas de validade</Label>
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

            {/* Indicadores visuais */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex-1">
                <Label className="text-sm font-medium">Indicadores visuais</Label>
                <p className="text-xs text-muted-foreground">
                  Exibir badges de status nos produtos
                </p>
              </div>
              <Switch 
                checked={showIndicators} 
                onCheckedChange={setShowIndicators}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sobre o sistema */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              Sobre o sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Nome do sistema</span>
              <span className="text-sm font-medium">StockFlow</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Versão</span>
              <span className="text-sm font-medium">2.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Plano atual</span>
              <span className="text-sm font-medium text-primary">Gratuito</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Produtos cadastrados</span>
              <span className="text-sm font-medium">{hasProducts ? 'Sim' : 'Não'}</span>
            </div>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => toast.info('Suporte ainda não disponível')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Falar com suporte
            </Button>
          </CardContent>
        </Card>

        {/* Ações da conta */}
        <Card className="animate-slide-up border-destructive/20" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
