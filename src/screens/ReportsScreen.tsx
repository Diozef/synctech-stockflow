/**
 * ============================================
 * TELA 08: RELATÓRIOS (V2)
 * ============================================
 * 
 * Este módulo exibe relatórios e insights do estoque.
 * 
 * Funcionalidades atuais:
 * - Filtro por período (mês/ano)
 * - Cards de indicadores
 * - Lista de insights simples
 * 
 * Notas para manutenção:
 * - Este módulo será conectado ao banco futuramente
 * - Gráficos avançados entram em versões pagas
 * - Dados atualmente mockados
 * 
 * ============================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Crown
} from 'lucide-react';

// ============================================
// DADOS MOCKADOS
// ============================================

const MOCK_DATA = {
  moda: {
    totalEntries: 48,
    totalExits: 32,
    topProducts: [
      { name: 'Camiseta Básica Preta', movements: 12 },
      { name: 'Calça Jeans Skinny', movements: 8 },
      { name: 'Vestido Floral', movements: 6 },
    ],
    insights: [
      { type: 'success', text: 'Camiseta Básica Preta teve alta saída este mês' },
      { type: 'warning', text: 'Vestido Midi está com baixa movimentação' },
      { type: 'info', text: 'Tamanho M é o mais vendido da coleção' },
    ]
  },
  cosmeticos: {
    totalEntries: 65,
    totalExits: 52,
    topProducts: [
      { name: 'Base Líquida Natural', movements: 15 },
      { name: 'Batom Vermelho Clássico', movements: 11 },
      { name: 'Máscara de Cílios', movements: 9 },
    ],
    insights: [
      { type: 'success', text: 'Base Líquida Natural teve alta saída este mês' },
      { type: 'warning', text: 'Pó Compacto está com baixa movimentação' },
      { type: 'danger', text: '3 produtos próximos do vencimento' },
    ]
  },
  geral: {
    totalEntries: 38,
    totalExits: 25,
    topProducts: [
      { name: 'Produto A', movements: 10 },
      { name: 'Produto B', movements: 7 },
      { name: 'Produto C', movements: 5 },
    ],
    insights: [
      { type: 'success', text: 'Produto A teve alta saída este mês' },
      { type: 'warning', text: 'Produto D está com baixa movimentação' },
      { type: 'info', text: 'Estoque geral estável no período' },
    ]
  }
};

// Gerar opções de mês/ano
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
  const { businessType } = useBusiness();
  const config = getNicheConfig(businessType);

  // States para filtros
  const [period, setPeriod] = useState('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  // Redireciona se não tiver tipo de negócio selecionado
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!businessType) return null;

  const data = MOCK_DATA[businessType] || MOCK_DATA.geral;
  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();

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
        {/* ============================================
            1. CABEÇALHO
            ============================================ */}
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
          {/* ============================================
              2. FILTRO DE PERÍODO
              ============================================ */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Período</span>
            </div>
            
            <div className="space-y-3">
              {/* Seletor de período predefinido */}
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

              {/* Seletores de mês/ano para período personalizado */}
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

          {/* ============================================
              3. CARDS DE INDICADORES
              ============================================ */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total de Entradas */}
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.totalEntries}</p>
              <p className="text-xs text-muted-foreground">Total de entradas</p>
            </Card>

            {/* Total de Saídas */}
            <Card className="p-4 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.totalExits}</p>
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
              {data.topProducts.map((product, index) => (
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
                    {product.movements} mov.
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ============================================
              4. LISTA DE INSIGHTS SIMPLES
              ============================================ */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 px-1">
              Insights do período
            </h3>
            
            <div className="space-y-2">
              {data.insights.map((insight, index) => (
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

          {/* ============================================
              5. MENSAGEM DE VALOR
              ============================================ */}
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
