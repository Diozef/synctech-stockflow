import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusinessData } from '@/hooks/useBusiness';
import { useAuth } from '@/contexts/AuthContext';
import { nicheConfigs } from '@/utils/nicheConfig';
import { ChevronRight, Check, Boxes, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { business, createBusiness, loading } = useBusinessData();
  const [selectedNiche, setSelectedNiche] = React.useState<'moda' | 'cosmeticos' | 'geral' | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // Redirect to dashboard if business already exists
  React.useEffect(() => {
    if (!loading && business) {
      navigate('/app/dashboard');
    }
  }, [loading, business, navigate]);

  const handleContinue = async () => {
    if (!selectedNiche) return;
    
    setIsCreating(true);
    try {
      await createBusiness(selectedNiche);
      navigate('/app/confirm-niche');
    } catch (error) {
      console.error('Error creating business:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 pt-12 pb-8">
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Boxes className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1 className="text-2xl font-bold tracking-tight mb-3 text-foreground">
            Vamos configurar o sistema para o seu tipo de negócio
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
            Escolha a opção que mais se parece com a forma como você vende hoje.
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 pb-6">
        <div className="space-y-4">
          {Object.values(nicheConfigs).map((config, index) => {
            const isSelected = selectedNiche === config.id;
            const Icon = config.icon;
            
            return (
              <Card
                key={config.id}
                onClick={() => setSelectedNiche(config.id!)}
                className={cn(
                  "cursor-pointer transition-all duration-300 animate-slide-up overflow-hidden border-2",
                  isSelected 
                    ? "border-primary shadow-lg bg-primary/[0.03]" 
                    : "border-transparent hover:border-border hover:shadow-card-hover"
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className={cn(
                      "flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 flex-shrink-0",
                      config.gradient,
                      isSelected ? "scale-105 shadow-lg" : ""
                    )}>
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-lg mb-1.5 text-foreground">
                        {config.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {config.description}
                      </p>
                    </div>

                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1",
                      isSelected 
                        ? "bg-primary shadow-md" 
                        : "border-2 border-muted-foreground/20"
                    )}>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary-foreground animate-scale-in" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <footer className="sticky bottom-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          variant="hero"
          size="xl"
          className={cn(
            "w-full mb-4 transition-all duration-300",
            !selectedNiche && "opacity-50 cursor-not-allowed"
          )}
          disabled={!selectedNiche || isCreating}
          onClick={handleContinue}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          Você poderá ajustar essa escolha antes de cadastrar seus produtos.
        </p>
      </footer>
    </div>
  );
}
