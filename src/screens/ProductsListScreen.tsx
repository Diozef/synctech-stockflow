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
  AlertTriangle,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ====================================================
// MÓDULO: TELA 05 — LISTA DE PRODUTOS
// ====================================================
// FUNÇÃO: Exibir todos os produtos cadastrados
// 
// Este módulo exibe a lista de produtos com:
// - Busca por nome
// - Indicadores de estoque baixo
// - Indicadores de validade (para cosméticos)
// - Cards clicáveis para edição
//
// Ajustes visuais e de comportamento devem ser feitos aqui.
// ====================================================

// Subtítulos dinâmicos por nicho
const SUBTITLES: Record<string, string> = {
  moda: 'Gerencie suas peças por tamanho e cor',
  cosmeticos: 'Acompanhe quantidades e validade',
  geral: 'Controle simples do seu estoque',
};

export function ProductsListScreen() {
  const navigate = useNavigate();
  const { businessType, products, minStockAlert } = useBusiness();
  const config = getNicheConfig(businessType);
  const [searchQuery, setSearchQuery] = useState('');

  // Redireciona se não tiver tipo de negócio definido
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  // Filtro de busca
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Contadores para KPIs
  const lowStockCount = products.filter(p => p.quantity <= minStockAlert).length;
  const expiringCount = products.filter(p => {
    if (!p.expirationDate) return false;
    const days = differenceInDays(new Date(p.expirationDate), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const Icon = config.icon;

  // Verifica se produto está com estoque baixo
  const isLowStock = (quantity: number) => quantity <= minStockAlert;

  // Verifica se produto está próximo do vencimento
  const isExpiringSoon = (date?: Date) => {
    if (!date) return false;
    const days = differenceInDays(new Date(date), new Date());
    return days >= 0 && days <= 30;
  };

  // Verifica se produto já venceu
  const isExpired = (date?: Date) => {
    if (!date) return false;
    return differenceInDays(new Date(date), new Date()) < 0;
  };

  return (
    <MobileLayout>
      {/* ====================================================
          CABEÇALHO PREMIUM
          Título dinâmico e botão de adicionar
          ==================================================== */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {config.labels.products}
            </h1>
            <p className="text-muted-foreground text-sm">
              {businessType && SUBTITLES[businessType]}
            </p>
          </div>
          <Button 
            variant="hero" 
            size="icon"
            className="rounded-xl"
            onClick={() => navigate('/products/new')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Contador de produtos */}
        <div className="flex items-center gap-4 mt-4">
          <div className="text-sm">
            <span className="font-semibold text-foreground">{products.length}</span>
            <span className="text-muted-foreground ml-1">
              {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
            </span>
          </div>
          
          {/* Alerta de estoque baixo */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
              <span>{lowStockCount} com estoque baixo</span>
            </div>
          )}
          
          {/* Alerta de validade (apenas cosméticos) */}
          {businessType === 'cosmeticos' && expiringCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
              <Calendar className="w-4 h-4" />
              <span>{expiringCount} vencendo</span>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          BUSCA
          Campo de pesquisa por nome ou marca
          ==================================================== */}
      <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={`Buscar ${config.labels.products.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl"
        />
      </div>

      {/* ====================================================
          LISTA DE PRODUTOS
          Cards clicáveis com informações do produto
          ==================================================== */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center animate-slide-up border-dashed" style={{ animationDelay: '150ms' }}>
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
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {searchQuery 
                ? 'Tente buscar com outras palavras'
                : `Cadastre seu primeiro ${config.labels.product.toLowerCase()} para começar a controlar seu estoque`
              }
            </p>
            {!searchQuery && (
              <Button 
                variant="hero" 
                onClick={() => navigate('/products/new')}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                {config.labels.addProduct}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-24">
          {filteredProducts.map((product, index) => {
            const lowStock = isLowStock(product.quantity);
            const expiringSoon = isExpiringSoon(product.expirationDate);
            const expired = isExpired(product.expirationDate);
            const hasAlert = lowStock || expiringSoon || expired;

            return (
              <Card 
                key={product.id}
                className={cn(
                  "animate-slide-up cursor-pointer transition-all",
                  "hover:shadow-card-hover hover:scale-[1.01]",
                  hasAlert && "border-l-4",
                  expired && "border-l-destructive",
                  expiringSoon && !expired && "border-l-orange-500",
                  lowStock && !expired && !expiringSoon && "border-l-amber-500"
                )}
                style={{ animationDelay: `${150 + index * 50}ms` }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Foto do produto */}
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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

                    {/* Informações do produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      
                      {/* Info adicional por nicho */}
                      <div className="flex items-center gap-2 mt-1">
                        {product.brand && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {product.brand}
                          </span>
                        )}
                        {product.variations && product.variations.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {product.variations.length} variações
                          </span>
                        )}
                        {product.expirationDate && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            expired && "bg-destructive/10 text-destructive",
                            expiringSoon && !expired && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                            !expired && !expiringSoon && "bg-muted text-muted-foreground"
                          )}>
                            {expired ? 'Vencido' : format(new Date(product.expirationDate), "MMM/yy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantidade em estoque */}
                    <div className={cn(
                      "flex flex-col items-center justify-center px-3 py-2 rounded-xl text-center min-w-[60px]",
                      lowStock 
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}>
                      <span className="text-lg font-bold">{product.quantity}</span>
                      <span className="text-xs opacity-80">un</span>
                    </div>
                  </div>

                  {/* Alertas */}
                  {hasAlert && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {lowStock && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Estoque baixo</span>
                        </div>
                      )}
                      {expired && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Produto vencido</span>
                        </div>
                      )}
                      {expiringSoon && !expired && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <Calendar className="w-3 h-3" />
                          <span>Vence em breve</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BottomNav />
    </MobileLayout>
  );
}

// ====================================================
// COMENTÁRIOS PARA MANUTENÇÃO FUTURA
// ====================================================
// - Este módulo exibe a lista de produtos cadastrados
// - Ajustes de layout e cards devem ser feitos aqui
// - Lógica de alertas (estoque baixo, validade) está aqui
// - Não aplicar lógica de banco neste módulo
// ====================================================
