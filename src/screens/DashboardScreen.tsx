import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 03 — DASHBOARD
// ====================================================
// FUNÇÃO: Dar visão rápida do estoque com dados mockados

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

  if (!config) return null;

  // Cálculos mockados
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockProducts = products.filter(p => p.quantity <= minStockAlert).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  // Dados mockados para demonstração
  const mockStats = totalProducts === 0 ? {
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    totalValue: 0,
  } : {
    totalProducts,
    totalStock,
    lowStock: lowStockProducts,
    totalValue,
  };

  const Icon = config.icon;

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Olá! 👋</h1>
          <p className="text-muted-foreground text-sm">
            Seu estoque de {config.labels.products.toLowerCase()}
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl",
          config.gradient
        )}>
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{mockStats.totalProducts}</p>
            <p className="text-xs text-muted-foreground">{config.labels.products} cadastrados</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{mockStats.totalStock}</p>
            <p className="text-xs text-muted-foreground">Unidades em estoque</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                mockStats.lowStock > 0 ? "bg-destructive/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  mockStats.lowStock > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
            </div>
            <p className="text-2xl font-bold">{mockStats.lowStock}</p>
            <p className="text-xs text-muted-foreground">Estoque baixo</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Valor em estoque</p>
            <p className="text-xl font-bold">
              R$ {mockStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full justify-start"
            onClick={() => navigate('/products/new')}
          >
            <Plus className="w-5 h-5 mr-2" />
            {config.labels.addProduct}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="justify-start"
              onClick={() => navigate('/movements', { state: { type: 'entrada' } })}
            >
              <ArrowDownRight className="w-5 h-5 mr-2 text-success" />
              Entrada
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="justify-start"
              onClick={() => navigate('/movements', { state: { type: 'saida' } })}
            >
              <ArrowUpRight className="w-5 h-5 mr-2 text-destructive" />
              Saída
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {mockStats.totalProducts === 0 && (
        <Card className="text-center animate-slide-up" style={{ animationDelay: '350ms' }}>
          <CardContent className="py-8">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              config.gradient
            )}>
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Comece agora!</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Cadastre seu primeiro produto e comece a controlar seu estoque de forma simples.
            </p>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => navigate('/products/new')}
            >
              <Plus className="w-5 h-5 mr-2" />
              {config.labels.addProduct}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Products (if any) */}
      {products.length > 0 && (
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos {config.labels.products.toLowerCase()}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.slice(0, 3).map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      {product.photo ? (
                        <img src={product.photo} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    product.quantity <= minStockAlert 
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  )}>
                    {product.quantity} un
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BottomNav />
    </MobileLayout>
  );
}
