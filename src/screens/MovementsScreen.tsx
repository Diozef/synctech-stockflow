import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  ArrowDownRight, 
  ArrowUpRight,
  Package,
  Plus,
  Minus,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ====================================================
// MÓDULO: TELA 05 — ENTRADA / SAÍDA DE ESTOQUE
// ====================================================

export function MovementsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessType, products, addMovement, loading } = useBusinessData();
  const config = getNicheConfig(businessType);

  type MovementsLocationState = { type?: 'entrada' | 'saida' };
  const initialType = (location.state as MovementsLocationState)?.type || 'entrada';
  
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!config) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = async () => {
    if (!selectedProductId) {
      toast({
        title: "Selecione um produto",
        description: "Escolha o produto para movimentar",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'saida' && selectedProduct && quantity > selectedProduct.quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Você tem apenas ${selectedProduct.quantity} unidades disponíveis`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addMovement({
        product_id: selectedProductId,
        movement_type: movementType,
        quantity,
        observation: observation.trim() || undefined,
      });

      const actionLabel = movementType === 'entrada' ? 'adicionadas' : 'removidas';
      toast({
        title: `${quantity} unidades ${actionLabel}! ✓`,
        description: `Estoque de "${selectedProduct?.name}" atualizado`,
      });

      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setObservation('');
    } catch (error) {
      console.error('Error adding movement:', error);
      toast({
        title: "Erro ao registrar",
        description: "Ocorreu um erro ao registrar a movimentação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Movimentar estoque</h1>
        <p className="text-sm text-muted-foreground">
          Registre entradas e saídas
        </p>
      </div>

      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Button
          variant={movementType === 'entrada' ? 'default' : 'outline'}
          size="lg"
          className={cn(
            "h-16 flex-col gap-1",
            movementType === 'entrada' && "bg-success hover:bg-success/90"
          )}
          onClick={() => setMovementType('entrada')}
        >
          <ArrowDownRight className="w-6 h-6" />
          <span className="text-sm">{config.labels.entry}</span>
        </Button>
        <Button
          variant={movementType === 'saida' ? 'default' : 'outline'}
          size="lg"
          className={cn(
            "h-16 flex-col gap-1",
            movementType === 'saida' && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={() => setMovementType('saida')}
        >
          <ArrowUpRight className="w-6 h-6" />
          <span className="text-sm">{config.labels.exit}</span>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="text-center animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="py-12">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              config.gradient
            )}>
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Nenhum produto cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Para movimentar estoque, primeiro cadastre seus produtos
            </p>
            <Button 
              variant="hero" 
              onClick={() => navigate('/app/products/new')}
            >
              <Plus className="w-5 h-5 mr-2" />
              {config.labels.addProduct}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Product Selection */}
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <Label className="text-sm font-medium mb-2 block">
              Selecione o {config.labels.product.toLowerCase()}
            </Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-14">
                <SelectValue placeholder={`Escolha um ${config.labels.product.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {product.photo_url ? (
                          <img 
                            src={product.photo_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({product.quantity} un)
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Product Info */}
          {selectedProduct && (
            <Card className="animate-scale-in">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {selectedProduct.photo_url ? (
                    <img 
                      src={selectedProduct.photo_url} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: <span className="font-medium text-foreground">{selectedProduct.quantity} unidades</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantity */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Label className="text-sm font-medium mb-3 block">
              Quantidade a {movementType === 'entrada' ? 'adicionar' : 'remover'}
            </Label>
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 h-14 text-center text-2xl font-bold"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          {selectedProduct && (
            <div className="text-center p-4 bg-secondary/50 rounded-2xl animate-fade-in">
              <p className="text-sm text-muted-foreground">
                Novo estoque:
              </p>
              <p className="text-2xl font-bold">
                {movementType === 'entrada' 
                  ? selectedProduct.quantity + quantity
                  : Math.max(0, selectedProduct.quantity - quantity)
                } unidades
              </p>
            </div>
          )}

          {/* Observation */}
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <Label className="text-sm font-medium mb-2 block">
              Observação (opcional)
            </Label>
            <Textarea
              placeholder={movementType === 'entrada' 
                ? "Ex: Reposição do fornecedor X" 
                : "Ex: Venda para cliente Y"
              }
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      {products.length > 0 && (
        <div className="sticky bottom-20 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 mt-6">
          <Button
            variant={movementType === 'entrada' ? 'success' : 'destructive'}
            size="xl"
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedProductId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirmar {movementType}
              </>
            )}
          </Button>
        </div>
      )}

      <BottomNav />
    </MobileLayout>
  );
}
