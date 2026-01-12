import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBusinessData } from '@/hooks/useBusiness';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales, SaleItem } from '@/hooks/useSales';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  User,
  Calendar as CalendarIcon,
  CreditCard,
  Banknote,
  Check,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface CartItem extends SaleItem {
  name: string;
  available_stock: number;
}

export function NewSaleScreen() {
  const navigate = useNavigate();
  const { products } = useBusinessData();
  const { customers } = useCustomers();
  const { createSale } = useSales();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer & Payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'avista' | 'parcelado'>('avista');
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [firstDueDate, setFirstDueDate] = useState<Date | undefined>(addMonths(new Date(), 1));
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Calculate totals
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.total_price, 0),
    [cart]
  );

  const remainingAmount = cartTotal - (hasDownPayment ? downPaymentAmount : 0);
  const installmentValue = installmentsCount > 0 ? remainingAmount / installmentsCount : 0;

  // Validation
  const stockErrors = useMemo(() => {
    return cart.filter(item => item.quantity > item.available_stock);
  }, [cart]);

  const canProceed = cart.length > 0 && stockErrors.length === 0;
  const needsCustomer = paymentType === 'parcelado';
  const canSubmit = canProceed && (!needsCustomer || selectedCustomerId);

  // Add product to cart
  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.product_id === productId);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + 1;
      
      if (newQty > product.quantity) {
        toast({
          title: 'Estoque insuficiente',
          description: `Apenas ${product.quantity} unidades disponíveis`,
          variant: 'destructive'
        });
        return;
      }
      
      newCart[existingIndex].quantity = newQty;
      newCart[existingIndex].total_price = newQty * newCart[existingIndex].unit_price;
      setCart(newCart);
    } else {
      if (product.quantity < 1) {
        toast({
          title: 'Produto sem estoque',
          description: 'Este produto não possui estoque disponível',
          variant: 'destructive'
        });
        return;
      }
      
      setCart([...cart, {
        product_id: productId,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        available_stock: product.quantity
      }]);
    }
  };

  // Update cart quantity
  const updateCartQuantity = (productId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.product_id !== productId) return item;
      
      const newQty = item.quantity + delta;
      if (newQty < 1) return item;
      
      return {
        ...item,
        quantity: newQty,
        total_price: newQty * item.unit_price
      };
    });
    
    setCart(newCart);
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Handle sale submission
  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Final stock validation
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (!product || product.quantity < item.quantity) {
        toast({
          title: 'Erro de estoque',
          description: `O produto "${item.name}" não possui estoque suficiente`,
          variant: 'destructive'
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createSale.mutateAsync({
        customer_id: selectedCustomerId || undefined,
        payment_type: paymentType,
        items: cart.map(({ product_id, quantity, unit_price, total_price }) => ({
          product_id,
          quantity,
          unit_price,
          total_price
        })),
        installments_count: paymentType === 'avista' ? 1 : installmentsCount,
        first_due_date: paymentType === 'parcelado' ? firstDueDate : undefined,
        has_down_payment: paymentType === 'parcelado' && hasDownPayment,
        down_payment_amount: hasDownPayment ? downPaymentAmount : 0
      });

      toast({ 
        title: 'Venda realizada com sucesso!',
        description: paymentType === 'parcelado' 
          ? `${installmentsCount} parcelas criadas` 
          : 'Pagamento à vista registrado'
      });
      
      navigate('/app/caderninho');
    } catch (error: any) {
      console.error('Sale error:', error);
      toast({
        title: 'Erro ao registrar venda',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Nova Venda</h1>
        <p className="text-sm text-muted-foreground">
          Adicione produtos e configure o pagamento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2" disabled={cart.length === 0}>
            <CreditCard className="w-4 h-4" />
            Pagamento
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6 space-y-4">
          {/* Cart Summary */}
          {cart.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Carrinho</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    R$ {cartTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {cart.map((item) => {
                    const hasStockError = item.quantity > item.available_stock;
                    return (
                      <div 
                        key={item.product_id} 
                        className={cn(
                          "flex items-center justify-between p-2 bg-background rounded-lg",
                          hasStockError && "border border-destructive"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.unit_price.toFixed(2)} × {item.quantity}
                            {hasStockError && (
                              <span className="text-destructive ml-2">
                                (máx: {item.available_stock})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.product_id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.product_id, 1)}
                              disabled={item.quantity >= item.available_stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {stockErrors.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-lg text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Alguns produtos excedem o estoque disponível</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => {
              const inCart = cart.find(item => item.product_id === product.id);
              const isOutOfStock = product.quantity < 1;
              
              return (
                <Card 
                  key={product.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    inCart && "ring-2 ring-primary",
                    isOutOfStock && "opacity-50"
                  )}
                  onClick={() => !isOutOfStock && addToCart(product.id)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
                      {product.photo_url ? (
                        <img 
                          src={product.photo_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-primary font-bold text-sm">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isOutOfStock ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {product.quantity} un
                      </span>
                    </div>
                    {inCart && (
                      <div className="mt-2 flex items-center justify-center gap-1 bg-primary/10 rounded-full py-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          {inCart.quantity} no carrinho
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {products.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhum produto cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre produtos para iniciar vendas
                </p>
                <Button onClick={() => navigate('/app/products/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Produto
                </Button>
              </CardContent>
            </Card>
          )}

          {cart.length > 0 && (
            <div className="pb-24">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => setActiveTab('payment')}
                disabled={!canProceed}
              >
                Continuar para Pagamento
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="mt-6 space-y-4">
          {/* Payment Type */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentType === 'avista' ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "h-16 flex-col gap-1",
                paymentType === 'avista' && "bg-success hover:bg-success/90"
              )}
              onClick={() => setPaymentType('avista')}
            >
              <Banknote className="w-6 h-6" />
              <span className="text-sm">À Vista</span>
            </Button>
            <Button
              variant={paymentType === 'parcelado' ? 'default' : 'outline'}
              size="lg"
              className="h-16 flex-col gap-1"
              onClick={() => setPaymentType('parcelado')}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-sm">Parcelado</span>
            </Button>
          </div>

          {/* Installment Options */}
          {paymentType === 'parcelado' && (
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Customer Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Cliente * (obrigatório para parcelamento)
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className={cn(!selectedCustomerId && "border-destructive")}>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {customer.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customers.length === 0 && (
                    <Button 
                      variant="link" 
                      className="px-0 h-auto text-sm"
                      onClick={() => navigate('/app/customers')}
                    >
                      + Cadastrar novo cliente
                    </Button>
                  )}
                </div>

                {/* Number of Installments */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Número de Parcelas
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInstallmentsCount(Math.max(2, installmentsCount - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">
                      {installmentsCount}×
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInstallmentsCount(Math.min(12, installmentsCount + 1))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Down Payment */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Entrada à vista</Label>
                    <p className="text-xs text-muted-foreground">
                      Primeira parcela paga hoje
                    </p>
                  </div>
                  <Switch
                    checked={hasDownPayment}
                    onCheckedChange={setHasDownPayment}
                  />
                </div>

                {hasDownPayment && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Valor da Entrada
                    </Label>
                    <Input
                      type="number"
                      value={downPaymentAmount}
                      onChange={(e) => setDownPaymentAmount(Math.min(cartTotal, Number(e.target.value)))}
                      placeholder="0.00"
                      max={cartTotal}
                    />
                  </div>
                )}

                {/* First Due Date */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Data do 1º Vencimento
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {firstDueDate 
                          ? format(firstDueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : "Selecione uma data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={firstDueDate}
                        onSelect={(date) => {
                          setFirstDueDate(date);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total da venda:</span>
                    <span className="font-medium">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  {hasDownPayment && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Entrada (pago hoje):</span>
                      <span className="font-medium">- R$ {downPaymentAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Restante:</span>
                    <span className="font-medium">R$ {remainingAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>{installmentsCount}× de:</span>
                      <span className="text-primary">R$ {installmentValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="pb-24">
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Finalizar Venda
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </MobileLayout>
  );
}
