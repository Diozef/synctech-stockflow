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
  TrendingUp,
  Calendar,
  Pencil,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

// ====================================================
// MÓDULO: TELA 06 — LISTA DE PRODUTOS / ESTOQUE ATUAL
// ====================================================
// FUNÇÃO: Exibir todos os produtos cadastrados
// 
// Este módulo exibe o ESTOQUE ATUAL com:
// - Pré-condição: verifica has_products
// - Busca por nome (será conectada ao banco futuramente)
// - Indicadores visuais de status
// - Ações rápidas por produto
// - Botão flutuante para cadastrar novo produto
//
// Informações variam conforme business_type
// Alertas visuais seguem regras definidas aqui
// Filtros e busca serão conectados ao banco futuramente
// ====================================================

// Subtítulos dinâmicos por nicho
const SUBTITLES: Record<string, string> = {
  moda: 'Produtos organizados por tamanho e cor',
  cosmeticos: 'Controle por lote e validade',
  geral: 'Lista completa do seu estoque',
};

export function ProductsListScreen() {
  const navigate = useNavigate();
  const { businessType, products, minStockAlert, addMovement } = useBusiness();
  const config = getNicheConfig(businessType);
  const [searchQuery, setSearchQuery] = useState('');

  // Redireciona se não tiver tipo de negócio definido
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  // ====================================================
  // PRÉ-CONDIÇÃO DE ACESSO
  // Se has_products = false, exibir estado vazio
  // ====================================================
  const hasProducts = products.length > 0;

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

  // ====================================================
  // AÇÕES RÁPIDAS POR PRODUTO
  // ====================================================
  const handleQuickEntry = (productId: string, productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simula registro de entrada
    addMovement({
      productId,
      type: 'entrada',
      quantity: 1,
      observation: `Entrada rápida - ${productName}`
    });
    toast.success('Entrada registrada com sucesso!');
  };

  const handleQuickExit = (productId: string, productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simula registro de saída
    addMovement({
      productId,
      type: 'saida',
      quantity: 1,
      observation: `Saída rápida - ${productName}`
    });
    toast.success('Saída registrada com sucesso!');
  };

  const handleEdit = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/products/${productId}`);
  };

  // ====================================================
  // TELA VAZIA (has_products = false)
  // ====================================================
  if (!hasProducts) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className={cn(
            "inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6",
            config.gradient
          )}>
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">
            Você ainda não cadastrou produtos.
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
            Cadastre seu primeiro produto para começar a controlar seu estoque
          </p>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/products/new')}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Cadastrar produto
          </Button>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* ====================================================
          CABEÇALHO PREMIUM
          Título e subtítulo dinâmico por nicho
          ==================================================== */}
      <div className="mb-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Estoque atual
          </h1>
          <p className="text-muted-foreground text-sm">
            {businessType && SUBTITLES[businessType]}
          </p>
        </div>

        {/* Contador de produtos e alertas */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="text-sm">
            <span className="font-semibold text-foreground">{products.length}</span>
            <span className="text-muted-foreground ml-1">
              {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
            </span>
          </div>
          
          {/* Indicador: Estoque baixo */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
              <span>{lowStockCount} com estoque baixo</span>
            </div>
          )}
          
          {/* Indicador: Próximo da validade (apenas cosméticos) */}
          {businessType === 'cosmeticos' && expiringCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
              <Calendar className="w-4 h-4" />
              <span>{expiringCount} vencendo</span>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          CAMPO DE BUSCA
          Busca por nome (resposta instantânea visual)
          ==================================================== */}
      <div className="relative mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl"
        />
      </div>

      {/* ====================================================
          LISTA DE PRODUTOS
          Cards premium com informações condicionais por nicho
          ==================================================== */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center animate-fade-in border-dashed" style={{ animationDelay: '150ms' }}>
          <CardContent className="py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground">
              Tente buscar com outras palavras
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-32">
          {filteredProducts.map((product, index) => {
            const lowStock = isLowStock(product.quantity);
            const expiringSoon = isExpiringSoon(product.expirationDate);
            const expired = isExpired(product.expirationDate);
            const hasAlert = lowStock || expiringSoon || expired;

            // Determina o status do estoque
            const getStockStatus = () => {
              if (expired) return 'expired';
              if (expiringSoon) return 'expiring';
              if (lowStock) return 'low';
              return 'normal';
            };
            const stockStatus = getStockStatus();

            return (
              <Card 
                key={product.id}
                className={cn(
                  "animate-fade-in cursor-pointer transition-all",
                  "hover:shadow-lg hover:scale-[1.01]",
                  hasAlert && "border-l-4",
                  stockStatus === 'expired' && "border-l-destructive",
                  stockStatus === 'expiring' && "border-l-orange-500",
                  stockStatus === 'low' && "border-l-amber-500"
                )}
                style={{ animationDelay: `${150 + index * 50}ms` }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
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
                      
                      {/* Informações condicionais por nicho */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* MODA: Tamanho e Cor */}
                        {businessType === 'moda' && product.variations && product.variations.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {product.variations.length} variações
                          </span>
                        )}
                        
                        {/* COSMÉTICOS: Lote e Validade */}
                        {businessType === 'cosmeticos' && (
                          <>
                            {product.brand && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {product.brand}
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
                          </>
                        )}
                        
                        {/* GERAL: Apenas marca se houver */}
                        {businessType === 'geral' && product.brand && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {product.brand}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantidade em estoque com indicador visual */}
                    <div className={cn(
                      "flex flex-col items-center justify-center px-3 py-2 rounded-xl text-center min-w-[60px]",
                      stockStatus === 'normal' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      stockStatus === 'low' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      stockStatus === 'expiring' && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                      stockStatus === 'expired' && "bg-destructive/10 text-destructive"
                    )}>
                      <span className="text-lg font-bold">{product.quantity}</span>
                      <span className="text-xs opacity-80">un</span>
                    </div>

                    {/* ====================================================
                        AÇÕES RÁPIDAS POR PRODUTO
                        Dropdown com opções de entrada, saída e editar
                        ==================================================== */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => handleQuickEntry(product.id, product.name, e)}>
                          <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                          Registrar entrada
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleQuickExit(product.id, product.name, e)}>
                          <TrendingDown className="w-4 h-4 mr-2 text-amber-600" />
                          Registrar saída
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleEdit(product.id, e)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar produto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Alertas visuais de status */}
                  {hasAlert && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
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

      {/* ====================================================
          BOTÃO FLUTUANTE (FAB)
          Cadastrar novo produto
          ==================================================== */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          variant="hero"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => navigate('/products/new')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}

// ====================================================
// COMENTÁRIOS PARA MANUTENÇÃO FUTURA
// ====================================================
// - Este módulo exibe o ESTOQUE ATUAL
// - Filtros e busca serão conectados ao banco futuramente
// - Informações variam conforme business_type
// - Alertas visuais seguem regras definidas aqui:
//   - Estoque baixo: amarelo (amber)
//   - Próximo da validade: laranja (apenas cosméticos)
//   - Produto vencido: vermelho (destructive)
// - Ações rápidas: entrada, saída e editar
// - Botão flutuante para cadastrar novo produto
// ====================================================
