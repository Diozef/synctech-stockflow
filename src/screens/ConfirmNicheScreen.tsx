import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { Check, ChevronLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 02 — CONFIRMAÇÃO DO NICHO
// ====================================================
// 
// FUNÇÃO: Validar a escolha do usuário, gerar confiança 
// e reduzir erros antes da personalização definitiva.
// 
// STATES UTILIZADOS:
// - business_type: Define o nicho selecionado (leitura)
// - has_products: Verifica se pode trocar nicho (leitura)
// 
// IMPORTANTE:
// - Este módulo VALIDA o state business_type
// - Ajustes de textos por nicho devem ser feitos em nicheConfig.ts
// - Nenhuma regra de banco deve ser aplicada aqui
// - Bloqueios definitivos de troca pertencem à lógica do sistema
//   após o cadastro de produtos (verificar em BusinessContext)
// 
// ====================================================

export function ConfirmNicheScreen() {
  const navigate = useNavigate();
  const { businessType, hasProducts } = useBusiness();
  const config = getNicheConfig(businessType);

  // Redireciona se não tem nicho selecionado
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  const Icon = config.icon;

  // Handler para confirmar e avançar
  const handleConfirm = () => {
    navigate('/dashboard');
  };

  // Handler para voltar e escolher outro
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ====================================================
          NAVEGAÇÃO: Botão Voltar
          ==================================================== */}
      <nav className="px-6 pt-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      </nav>

      {/* ====================================================
          SEÇÃO 1: CABEÇALHO DINÂMICO
          ==================================================== */}
      <header className="px-6 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-5 animate-fade-in">
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg",
            config.gradient
          )}>
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-0.5">Você escolheu:</p>
            <h1 className="text-xl font-bold text-foreground">
              {config.name}
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
          Veja se esse tipo de negócio combina com você
        </p>
      </header>

      {/* ====================================================
          CONTEÚDO PRINCIPAL
          ==================================================== */}
      <main className="flex-1 px-6 pb-6 space-y-5">
        
        {/* ====================================================
            BLOCO 1: "ESSE NICHO É IDEAL PARA VOCÊ SE..."
            ==================================================== */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-5">
            <h2 className="font-bold text-base mb-4 text-foreground">
              Esse nicho é ideal para você se...
            </h2>
            <ul className="space-y-3">
              {config.idealFor.map((item, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3"
                >
                  <div className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                    config.gradient
                  )}>
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ====================================================
            BLOCO 2: "O QUE O SISTEMA FARÁ POR VOCÊ"
            ==================================================== */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            <h2 className="font-bold text-base mb-3 text-foreground">
              O que o sistema fará por você
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.benefits}
            </p>
          </CardContent>
        </Card>

        {/* ====================================================
            BLOCO 3: SEGURANÇA E TRANQUILIDADE
            ==================================================== */}
        <Card 
          className="border-primary/20 bg-primary/[0.03] animate-slide-up" 
          style={{ animationDelay: '250ms' }}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  Você pode trocar o tipo de negócio antes de cadastrar seu primeiro produto.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Após cadastrar produtos, a troca será bloqueada para evitar inconsistência nos dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ====================================================
          SEÇÃO 2: AÇÕES PRINCIPAIS
          ==================================================== */}
      <footer className="sticky bottom-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        {/* Botão primário */}
        <Button
          variant="hero"
          size="xl"
          className="w-full mb-3"
          onClick={handleConfirm}
        >
          Confirmar este tipo de negócio
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Botão secundário */}
        {!hasProducts && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar e escolher outro
          </Button>
        )}
      </footer>
    </div>
  );
}
