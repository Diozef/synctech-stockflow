import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { Check, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 02 — CONFIRMAÇÃO DO NICHO
// ====================================================
// FUNÇÃO: Gerar confiança e validar se o nicho escolhido é correto

export function ConfirmNicheScreen() {
  const navigate = useNavigate();
  const { businessType, hasProducts } = useBusiness();
  const config = getNicheConfig(businessType);

  // Se não tem nicho selecionado, volta para onboarding
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  const Icon = config.icon;

  const handleConfirm = () => {
    navigate('/dashboard');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className={cn(
          "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg",
          config.gradient
        )}>
          <Icon className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {config.name}
        </h1>
        <p className="text-muted-foreground">
          Confirme se esse é o seu nicho
        </p>
      </div>

      {/* Ideal For Section */}
      <Card className="mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Esse nicho é ideal para você se...
          </h3>
          <ul className="space-y-3">
            {config.idealFor.map((item, index) => (
              <li 
                key={index}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card className="mb-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-4">
            O que o sistema vai fazer por você:
          </h3>
          <ul className="space-y-3">
            {config.features.map((feature, index) => (
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
                <span className="text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="mb-8 border-warning/30 bg-warning/5 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Importante saber</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasProducts ? (
                  <>
                    Você já tem produtos cadastrados. 
                    <span className="font-medium text-foreground"> Não é possível trocar o nicho.</span>
                  </>
                ) : (
                  <>
                    Você pode trocar o tipo de negócio agora, mas 
                    <span className="font-medium text-foreground"> após cadastrar o primeiro produto, não será mais possível alterar.</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="sticky bottom-20 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2 space-y-3">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleConfirm}
        >
          Confirmar e começar
        </Button>
        {!hasProducts && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={handleBack}
          >
            Escolher outro nicho
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
