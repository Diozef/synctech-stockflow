import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  Clock,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ====================================================
// MÓDULO: TELA 03 — DASHBOARD (VISÃO GERAL DO ESTOQUE)
// ====================================================

// Subtítulos dinâmicos por nicho
const SUBTITLES: Record<string, string> = {
  moda: 'Acompanhe seus produtos por tamanho e cor',
  cosmeticos: 'Controle quantidades e validade dos seus produtos',
  geral: 'Tenha controle simples do seu estoque',
};

// Labels de alerta por nicho
const ALERT_LABELS: Record<string, string> = {
  moda: 'Tamanhos em falta',
  cosmeticos: 'Próximos do vencimento',
  geral: 'Estoque baixo',
};

export function DashboardScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    business, 
    businessType, 
    products, 
    movements, 
    minStockAlert,
    loading 
  } = useBusinessData();
  const config = getNicheConfig(businessType);

  // Redirect if no business type selected
  React.useEffect(() => {
    if (!loading && !business) {
      navigate('/app/onboarding');
    }
  }, [loading, business, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config || !businessType) return null;

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    alertCount: products.filter(p => p.quantity <= minStockAlert).length,
    recentMovements: movements.length,
  };

  const Icon = config.icon;

  // Get low stock products for alerts
  const lowStockProducts = products.filter(p => p.quantity <= minStockAlert).slice(0, 3);
  
  // Get recent movements for display
  const recentMovements = movements.slice(0, 3);

  return (
    <MobileLayout>
      {/* ============================================
          SEÇÃO 1: CABEÇALHO
          ============================================ */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-3">
          <div className={cn(
            "flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg",
            config.gradient
          )}>
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Visão geral do estoque
            </h1>
            <p className="text-muted-foreground text-sm">
              {SUBTITLES[businessType]}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          SEÇÃO 2: CARDS DE RESUMO (KPIs)
          ============================================ */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {/* Card 01: Produtos cadastrados */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-1">
              {config.labels.products} cadastrados
            </p>
          </CardContent>
        </Card>

        {/* Card 02: Alertas (dinâmico por nicho) */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-4 text-center">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
              stats.alertCount > 0 ? "bg-warning/10" : "bg-muted"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                stats.alertCount > 0 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <p className="text-2xl font-bold">{stats.alertCount}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-1">
              {ALERT_LABELS[businessType]}
            </p>
          </CardContent>
        </Card>

        {/* Card 03: Movimentações recentes */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold">{stats.recentMovements}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-1">
              Movimentações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          SEÇÃO 3: ALERTAS IMPORTANTES
          ============================================ */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-warning" />
          <h2 className="text-base font-semibold">Alertas importantes</h2>
        </div>
        
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {lowStockProducts.length === 0 ? (
              <div className="flex items-start gap-3 p-4">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-success" />
                <p className="text-sm leading-relaxed">Nenhum alerta no momento</p>
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-start gap-3 p-4"
                >
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-warning" />
                  <p className="text-sm leading-relaxed">
                    {product.name} — apenas {product.quantity} unidades
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          SEÇÃO 4: ÚLTIMAS MOVIMENTAÇÕES
          ============================================ */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Últimas movimentações</h2>
        </div>
        
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {recentMovements.length === 0 ? (
              <div className="flex items-start gap-3 p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">Nenhuma movimentação ainda</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registre entradas e saídas para ver aqui
                  </p>
                </div>
              </div>
            ) : (
              recentMovements.map((movement) => {
                const product = products.find(p => p.id === movement.product_id);
                return (
                  <div 
                    key={movement.id}
                    className="flex items-start gap-3 p-4"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      movement.movement_type === 'entrada' ? "bg-success/10" : "bg-primary/10"
                    )}>
                      {movement.movement_type === 'entrada' ? (
                        <ArrowDownRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        {movement.movement_type === 'entrada' ? 'Entrada' : 'Saída'} — {product?.name || 'Produto'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(movement.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          SEÇÃO 5: AÇÕES RÁPIDAS (CTA)
          ============================================ */}
      <div className="space-y-3 pb-24 animate-slide-up" style={{ animationDelay: '350ms' }}>
        <h2 className="text-base font-semibold mb-4">Ações rápidas</h2>
        
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full justify-start"
          onClick={() => navigate('/app/products/new')}
        >
          <Plus className="w-5 h-5 mr-3" />
          Cadastrar {config.labels.product.toLowerCase()}
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start h-14"
            onClick={() => navigate('/app/movements', { state: { type: 'entrada' } })}
          >
            <ArrowDownRight className="w-5 h-5 mr-2 text-success" />
            <span className="text-sm">Registrar entrada</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start h-14"
            onClick={() => navigate('/app/movements', { state: { type: 'saida' } })}
          >
            <ShoppingBag className="w-5 h-5 mr-2 text-primary" />
            <span className="text-sm">Registrar venda</span>
          </Button>
        </div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
