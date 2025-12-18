import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  Clock,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 03 — DASHBOARD (VISÃO GERAL DO ESTOQUE)
// ====================================================
// FUNÇÃO: Dar visão rápida e clara da situação do estoque
// 
// MANUTENÇÃO:
// - Este módulo é o DASHBOARD PRINCIPAL do sistema
// - Textos e rótulos dependem do state business_type
// - Cards e alertas devem ser ajustados aqui
// - NÃO aplicar lógica de banco neste módulo
// - Dados são MOCKADOS para demonstração
// ====================================================

// Dados mockados para demonstração
const MOCK_DATA = {
  moda: {
    totalProducts: 24,
    alertCount: 3,
    recentMovements: 12,
    alertLabel: 'Tamanhos em falta',
    alerts: [
      { id: 1, message: 'Camiseta preta — tamanho M em falta', type: 'warning' },
      { id: 2, message: 'Vestido floral — tamanho P esgotado', type: 'warning' },
      { id: 3, message: 'Calça jeans — tamanho G com apenas 2 unidades', type: 'info' },
    ],
    movements: [
      { id: 1, type: 'saida', message: 'Venda registrada — Camiseta azul (P)', time: 'Há 2 horas' },
      { id: 2, type: 'entrada', message: 'Entrada de estoque — Vestido vermelho', time: 'Há 5 horas' },
      { id: 3, type: 'saida', message: 'Venda registrada — Bolsa preta', time: 'Ontem' },
    ],
  },
  cosmeticos: {
    totalProducts: 36,
    alertCount: 5,
    recentMovements: 18,
    alertLabel: 'Próximos do vencimento',
    alerts: [
      { id: 1, message: 'Perfume Importado X vence em 10 dias', type: 'warning' },
      { id: 2, message: 'Base líquida vence em 15 dias', type: 'warning' },
      { id: 3, message: 'Batom matte com estoque baixo', type: 'info' },
    ],
    movements: [
      { id: 1, type: 'saida', message: 'Venda registrada — Perfume floral', time: 'Há 1 hora' },
      { id: 2, type: 'entrada', message: 'Entrada de estoque — Kit maquiagem', time: 'Há 3 horas' },
      { id: 3, type: 'saida', message: 'Venda registrada — Hidratante facial', time: 'Hoje cedo' },
    ],
  },
  geral: {
    totalProducts: 42,
    alertCount: 4,
    recentMovements: 15,
    alertLabel: 'Estoque baixo',
    alerts: [
      { id: 1, message: 'Produto A com estoque baixo (2 unidades)', type: 'warning' },
      { id: 2, message: 'Produto B precisa de reposição', type: 'warning' },
      { id: 3, message: 'Produto C esgotado', type: 'info' },
    ],
    movements: [
      { id: 1, type: 'saida', message: 'Venda registrada — Produto X', time: 'Há 30 min' },
      { id: 2, type: 'entrada', message: 'Entrada de estoque — Produto Y', time: 'Há 2 horas' },
      { id: 3, type: 'saida', message: 'Venda registrada — Produto Z', time: 'Ontem' },
    ],
  },
};

// Subtítulos dinâmicos por nicho
const SUBTITLES = {
  moda: 'Acompanhe seus produtos por tamanho e cor',
  cosmeticos: 'Controle quantidades e validade dos seus produtos',
  geral: 'Tenha controle simples do seu estoque',
};

export function DashboardScreen() {
  const navigate = useNavigate();
  const { businessType, products, minStockAlert } = useBusiness();
  const config = getNicheConfig(businessType);

  // Redirect if no business type selected
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config || !businessType) return null;

  // Use mock data or real data if available
  const mockData = MOCK_DATA[businessType];
  const hasRealProducts = products.length > 0;
  
  // Calculate real stats if products exist
  const realStats = {
    totalProducts: products.length,
    alertCount: products.filter(p => p.quantity <= minStockAlert).length,
    recentMovements: 0,
  };

  const stats = hasRealProducts ? realStats : mockData;
  const Icon = config.icon;

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
              {mockData.alertLabel}
            </p>
          </CardContent>
        </Card>

        {/* Card 03: Movimentações recentes */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold">{hasRealProducts ? stats.recentMovements : mockData.recentMovements}</p>
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
            {mockData.alerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-start gap-3 p-4"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  alert.type === 'warning' ? "bg-warning" : "bg-info"
                )} />
                <p className="text-sm leading-relaxed">{alert.message}</p>
              </div>
            ))}
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
            {mockData.movements.map((movement) => (
              <div 
                key={movement.id}
                className="flex items-start gap-3 p-4"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  movement.type === 'entrada' ? "bg-success/10" : "bg-primary/10"
                )}>
                  {movement.type === 'entrada' ? (
                    <ArrowDownRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{movement.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{movement.time}</p>
                </div>
              </div>
            ))}
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
          onClick={() => navigate('/products/new')}
        >
          <Plus className="w-5 h-5 mr-3" />
          Cadastrar {config.labels.product.toLowerCase()}
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start h-14"
            onClick={() => navigate('/movements', { state: { type: 'entrada' } })}
          >
            <ArrowDownRight className="w-5 h-5 mr-2 text-success" />
            <span className="text-sm">Registrar entrada</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="justify-start h-14"
            onClick={() => navigate('/movements', { state: { type: 'saida' } })}
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
