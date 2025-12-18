import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  Plus, 
  Search, 
  Package,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ====================================================
// TELA DE LISTAGEM DE PRODUTOS
// ====================================================

export function ProductsListScreen() {
  const navigate = useNavigate();
  const { businessType, products, minStockAlert } = useBusiness();
  const config = getNicheConfig(businessType);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Icon = config.icon;

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{config.labels.products}</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'cadastrado' : 'cadastrados'}
          </p>
        </div>
        <Button 
          variant="hero" 
          size="icon"
          onClick={() => navigate('/products/new')}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={`Buscar ${config.labels.products.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12"
        />
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="py-12">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              config.gradient
            )}>
              <Icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">
              {searchQuery ? 'Nenhum resultado' : 'Nenhum produto'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {searchQuery 
                ? 'Tente buscar com outras palavras'
                : `Cadastre seu primeiro ${config.labels.product.toLowerCase()} para começar`
              }
            </p>
            {!searchQuery && (
              <Button 
                variant="hero" 
                onClick={() => navigate('/products/new')}
              >
                <Plus className="w-5 h-5 mr-2" />
                {config.labels.addProduct}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => (
            <Card 
              key={product.id}
              className="animate-slide-up cursor-pointer hover:shadow-card-hover transition-all"
              style={{ animationDelay: `${150 + index * 50}ms` }}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    {product.photo ? (
                      <img 
                        src={product.photo} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.brand}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium",
                    product.quantity <= minStockAlert 
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  )}>
                    {product.quantity} un
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BottomNav />
    </MobileLayout>
  );
}
