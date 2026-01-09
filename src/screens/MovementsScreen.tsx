import React, { useState, useMemo } from 'react';
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
  Loader2,
  Filter,
  Clock,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ====================================================
// MÓDULO: TELA 05 — ENTRADA / SAÍDA DE ESTOQUE
// ====================================================

export function MovementsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessType, products, movements, addMovement, loading } = useBusinessData();
  const config = getNicheConfig(businessType);
  const [activeTab, setActiveTab] = useState<string>('register');

  type MovementsLocationState = { type?: 'entrada' | 'saida' };
  const initialType = (location.state as MovementsLocationState)?.type || 'entrada';
  
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>(initialType);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters for history
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      // Filter by type
      if (filterType !== 'all' && movement.movement_type !== filterType) {
        return false;
      }
      
      // Filter by product
      if (filterProductId !== 'all' && movement.product_id !== filterProductId) {
        return false;
      }
      
      // Filter by date range
      if (filterDateFrom || filterDateTo) {
        const movementDate = new Date(movement.created_at);
        if (filterDateFrom && movementDate < startOfDay(new Date(filterDateFrom))) {
          return false;
        }
        if (filterDateTo && movementDate > endOfDay(new Date(filterDateTo))) {
          return false;
        }
      }
      
      // Filter by search query (product name)
      if (searchQuery) {
        const product = products.find(p => p.id === movement.product_id);
        if (!product?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [movements, filterType, filterProductId, filterDateFrom, filterDateTo, searchQuery, products]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterProductId('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterType !== 'all' || filterProductId !== 'all' || filterDateFrom || filterDateTo || searchQuery;

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
        <h1 className="text-2xl font-bold">Movimentações</h1>
        <p className="text-sm text-muted-foreground">
          Registre e visualize movimentações
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register" className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Register Tab */}
        <TabsContent value="register" className="mt-6">
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

              {/* Submit Button */}
              <div className="pb-24">
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
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filtros
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Type Filter */}
              <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'entrada' | 'saida')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>

              {/* Product Filter */}
              <Select value={filterProductId} onValueChange={setFilterProductId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos produtos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Data início</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Data fim</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredMovements.length} {filteredMovements.length === 1 ? 'movimentação encontrada' : 'movimentações encontradas'}
          </div>

          {/* Movements List */}
          {filteredMovements.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Nenhuma movimentação</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters 
                    ? 'Nenhum resultado com os filtros aplicados' 
                    : 'Registre entradas e saídas para ver o histórico'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 pb-24">
              {filteredMovements.map((movement) => {
                const product = products.find(p => p.id === movement.product_id);
                const isEntry = movement.movement_type === 'entrada';
                
                return (
                  <Card 
                    key={movement.id}
                    className={cn(
                      "transition-colors",
                      isEntry ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {product?.photo_url ? (
                            <img 
                              src={product.photo_url} 
                              alt={product?.name || 'Produto'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          )}
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background",
                            isEntry ? "bg-success" : "bg-destructive"
                          )}>
                            {isEntry ? (
                              <ArrowDownRight className="w-3 h-3 text-primary-foreground" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product?.name || 'Produto'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {movement.observation && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {movement.observation}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className={cn(
                          "text-lg font-bold",
                          isEntry ? "text-success" : "text-destructive"
                        )}>
                          {isEntry ? '+' : '-'}{movement.quantity}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </MobileLayout>
  );
}