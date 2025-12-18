import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBusiness } from '@/contexts/BusinessContext';
import { nicheConfigs } from '@/utils/nicheConfig';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 01 — ONBOARDING / ESCOLHA DO NICHO
// ====================================================
// FUNÇÃO: Permitir que o usuário escolha o tipo de negócio

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { businessType, setBusinessType } = useBusiness();

  const handleSelectNiche = (niche: 'moda' | 'cosmeticos' | 'geral') => {
    setBusinessType(niche);
  };

  const handleContinue = () => {
    if (businessType) {
      navigate('/confirm-niche');
    }
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-glow">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo ao seu estoque!
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Para personalizar sua experiência, me conta: <br />
          <span className="font-semibold text-foreground">o que você vende?</span>
        </p>
      </div>

      {/* Niche Cards */}
      <div className="flex-1 space-y-4 mb-8">
        {Object.values(nicheConfigs).map((config, index) => {
          const isSelected = businessType === config.id;
          const Icon = config.icon;
          
          return (
            <Card
              key={config.id}
              onClick={() => handleSelectNiche(config.id!)}
              className={cn(
                "cursor-pointer transition-all duration-300 animate-slide-up",
                isSelected 
                  ? "ring-2 ring-primary shadow-lg scale-[1.02]" 
                  : "hover:shadow-card-hover hover:scale-[1.01]"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                    config.gradient,
                    isSelected ? "scale-110" : ""
                  )}>
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{config.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground/30"
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="sticky bottom-20 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          disabled={!businessType}
          onClick={handleContinue}
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </MobileLayout>
  );
}
