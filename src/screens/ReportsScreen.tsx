/**
 * ============================================
 * TELA 08: RELATÓRIOS (v2 - Placeholder)
 * ============================================
 * 
 * Este módulo será expandido na v2 do sistema.
 * Por enquanto, exibe mensagem informativa.
 * 
 * Funcionalidades futuras:
 * - Relatórios de vendas
 * - Relatórios de estoque
 * - Gráficos de movimentação
 * - Exportação de dados
 * 
 * ============================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Download,
  Clock,
  Sparkles
} from 'lucide-react';

export function ReportsScreen() {
  const navigate = useNavigate();
  const { businessType } = useBusiness();
  const config = getNicheConfig(businessType);

  // Redireciona se não tiver tipo de negócio selecionado
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!businessType) return null;

  const upcomingFeatures = [
    {
      icon: TrendingUp,
      title: 'Análise de vendas',
      description: 'Visualize suas vendas por período'
    },
    {
      icon: BarChart3,
      title: 'Gráficos de estoque',
      description: 'Acompanhe a evolução do inventário'
    },
    {
      icon: FileText,
      title: 'Relatórios detalhados',
      description: 'Exporte dados para análise'
    },
    {
      icon: Download,
      title: 'Exportação',
      description: 'Baixe relatórios em PDF ou Excel'
    }
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">
                Análises e insights do seu negócio
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 py-6">
          {/* Coming Soon Card */}
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Em breve!
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Estamos preparando relatórios incríveis para você acompanhar 
                a saúde do seu negócio de forma visual e intuitiva.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Previsão: próxima atualização</span>
              </div>
            </div>
          </Card>

          {/* Upcoming Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              O que você poderá fazer:
            </h3>
            
            {upcomingFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="p-4 bg-card/50 border-border/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
