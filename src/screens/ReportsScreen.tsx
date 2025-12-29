/**
 * ============================================
 * TELA 08: RELATÓRIOS (V2)
 * ============================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  Crown,
  Loader2
} from 'lucide-react';

// ============================================
// DADOS E HELPERS
// ============================================

const generateMonthOptions = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months.map((month, index) => ({
    value: String(index),
    label: month
  }));
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push({ value: String(i), label: String(i) });
  }
  return years;
};

const PERIOD_OPTIONS = [
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'last90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export function ReportsScreen() {
  const navigate = useNavigate();
  const { businessType, products, movements, minStockAlert, loading } = useBusinessData();
  const config = getNicheConfig(businessType);

  // States para filtros
  const [period, setPeriod] = useState('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  // Redireciona se não tiver tipo de negócio selecionado
  React.useEffect(() => {
    if (!loading && !businessType) {
      navigate('/app/onboarding');
    }
  }, [loading, businessType, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!businessType) return null;

  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();

  // Calculate real stats from data
  const totalEntries = movements.filter(m => m.movement_type === 'entrada').reduce((sum, m) => sum + m.quantity, 0);
  const totalExits = movements.filter(m => m.movement_type === 'saida').reduce((sum, m) => sum + m.quantity, 0);

  // Get top products by movement count
  const productMovementCounts: Record<string, { name: string; count: number }> = {};
  movements.forEach(m => {
    const product = products.find(p => p.id === m.product_id);
    if (product) {
      if (!productMovementCounts[product.id]) {
        productMovementCounts[product.id] = { name: product.name, count: 0 };
      }
      productMovementCounts[product.id].count += m.quantity;
    }
  });
  const topProducts = Object.values(productMovementCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Generate insights based on real data
  const lowStockProducts = products.filter(p => p.quantity <= minStockAlert);
  const insights: Array<{ type: string; text: string }> = [];

  if (topProducts.length > 0) {
    insights.push({
      type: 'success',
      text: `${topProducts[0].name} teve alta movimentação este mês`
    });
  }

  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'warning',
      text: `${lowStockProducts.length} produto(s) com estoque baixo`
    });
  }

  if (products.length > 0 && movements.length === 0) {
    insights.push({
      type: 'info',
      text: 'Nenhuma movimentação registrada ainda'
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      text: 'Cadastre produtos e registre movimentações para ver insights'
    });
  }

  // Helper para ícone de insight
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'danger':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen pb-24">
        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">
                Visão geral do desempenho do estoque
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 py-4 space-y-5">
          {/* Filtro de período */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Período</span>
            </div>
            
            <div className="space-y-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {period === 'custom' && (
                <div className="flex gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Cards de indicadores */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
              <p className="text-xs text-muted-foreground">Total de entradas</p>
            </Card>

            <Card className="p-4 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalExits}</p>
              <p className="text-xs text-muted-foreground">Total de saídas</p>
            </Card>
          </div>

          {/* Produtos mais movimentados */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Produtos mais movimentados
              </span>
            </div>
            
            <div className="space-y-2">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma movimentação registrada ainda
                </p>
              ) : (
                topProducts.map((product, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-foreground">{product.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {product.count} un
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Lista de insights */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 px-1">
              Insights do período
            </h3>
            
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <Card 
                  key={index}
                  className={`p-3 border ${getInsightBg(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <p className="text-sm text-foreground flex-1">
                      {insight.text}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mensagem de valor */}
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Relatórios avançados
                </p>
                <p className="text-xs text-muted-foreground">
                  Gráficos detalhados, comparativos e exportação de dados 
                  estarão disponíveis nos planos superiores.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
