import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ProductPhotoUpload } from '@/components/ProductPhotoUpload';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  ChevronLeft, 
  Plus,
  Minus,
  Calendar,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ====================================================
// MÓDULO: TELA 04 — CADASTRO DE PRODUTO
// ====================================================

// Sistema de tamanhos flexível
const SIZE_CATEGORIES = {
  letras: {
    label: 'Letras (Roupas)',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'],
  },
  numeracao: {
    label: 'Numeração (Calças/Shorts)',
    sizes: ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52'],
  },
  calcados: {
    label: 'Calçados',
    sizes: ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  },
  personalizado: {
    label: 'Personalizado',
    sizes: [],
  },
};

type SizeCategoryKey = keyof typeof SIZE_CATEGORIES;

const COLORS = [
  { name: 'Preto', value: '#000000' },
  { name: 'Branco', value: '#FFFFFF' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Amarelo', value: '#EAB308' },
  { name: 'Marrom', value: '#92400E' },
  { name: 'Cinza', value: '#6B7280' },
  { name: 'Bege', value: '#D4B896' },
];

export function ProductFormScreen() {
  const navigate = useNavigate();
  const { businessType, business, addProduct, customSizes: dbCustomSizes, addCustomSize } = useBusinessData();
  const config = getNicheConfig(businessType);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Conditional fields
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Variations for fashion
  const [variations, setVariations] = useState<Array<{ size: string; color: string; quantity: number }>>([]);
  
  // Size category for fashion
  const [sizeCategory, setSizeCategory] = useState<SizeCategoryKey>('letras');
  
  // Custom sizes
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState('');

  // Redirect if no business type
  React.useEffect(() => {
    if (!businessType) {
      navigate('/app/onboarding');
    }
  }, [businessType, navigate]);

  // Load custom sizes from database
  React.useEffect(() => {
    if (dbCustomSizes.length > 0) {
      setCustomSizes(dbCustomSizes.map(s => s.size_value));
    }
  }, [dbCustomSizes]);

  if (!config) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto",
        variant: "destructive",
      });
      return;
    }

    if (!price || parseFloat(price.replace(',', '.')) <= 0) {
      toast({
        title: "Preço obrigatório",
        description: "Digite um preço válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addProduct({
        name: name.trim(),
        price: parseFloat(price.replace(',', '.')),
        quantity: config.fields.showVariations ? variations.reduce((sum, v) => sum + v.quantity, 0) : quantity,
        photo_url: photo || undefined,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        size_category: sizeCategory as any,
        brand: brand.trim() || undefined,
        expiration_date: expirationDate ? format(expirationDate, 'yyyy-MM-dd') : undefined,
      });

      toast({
        title: "Produto cadastrado! 🎉",
        description: `${name} foi adicionado ao seu estoque.`,
      });

      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomSize = async () => {
    if (newCustomSize.trim() && !customSizes.includes(newCustomSize.trim())) {
      try {
        await addCustomSize(newCustomSize.trim());
        setCustomSizes([...customSizes, newCustomSize.trim()]);
        setNewCustomSize('');
      } catch (error) {
        console.error('Error adding custom size:', error);
      }
    }
  };

  const handleAddVariation = () => {
    if (selectedSize && selectedColor) {
      const exists = variations.find(v => v.size === selectedSize && v.color === selectedColor);
      if (!exists) {
        setVariations([...variations, { size: selectedSize, color: selectedColor, quantity: 1 }]);
        setSelectedSize('');
        setSelectedColor('');
      }
    }
  };

  const updateVariationQuantity = (index: number, delta: number) => {
    setVariations(variations.map((v, i) => 
      i === index ? { ...v, quantity: Math.max(0, v.quantity + delta) } : v
    ));
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Generate years for date picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <MobileLayout>
      {/* Cabeçalho */}
      <div className="mb-8 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar produto</h1>
          <p className="text-muted-foreground">
            {businessType === 'moda' && 'Cadastre produtos com tamanhos e cores'}
            {businessType === 'cosmeticos' && 'Cadastre produtos por unidade e validade'}
            {businessType === 'geral' && 'Cadastre produtos de forma simples'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Photo */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Label className="text-sm font-medium mb-2 block">Foto (opcional)</Label>
          <ProductPhotoUpload
            value={photo}
            onChange={setPhoto}
          />
        </div>

        {/* Name */}
        <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <Label htmlFor="name" className="text-sm font-medium mb-2 block">
            Nome do {config.labels.product.toLowerCase()} *
          </Label>
          <Input
            id="name"
            placeholder={config.placeholders.productName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Price */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Label htmlFor="price" className="text-sm font-medium mb-2 block">
            Preço de venda *
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="price"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 pl-12"
            />
          </div>
        </div>

        {/* Brand (Cosmetics) */}
        {config.fields.showBrand && (
          <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
            <Label htmlFor="brand" className="text-sm font-medium mb-2 block">
              Marca
            </Label>
            <Input
              id="brand"
              placeholder="Ex: Natura, O Boticário"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-12"
            />
          </div>
        )}

        {/* Expiration Date (Cosmetics) */}
        {config.fields.showExpiration && (
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Label className="text-sm font-medium mb-2 block">
              Validade (opcional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex gap-2 p-3 border-b">
                  <Select
                    value={calendarMonth.getMonth().toString()}
                    onValueChange={(value) => {
                      const newDate = new Date(calendarMonth);
                      newDate.setMonth(parseInt(value));
                      setCalendarMonth(newDate);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={calendarMonth.getFullYear().toString()}
                    onValueChange={(value) => {
                      const newDate = new Date(calendarMonth);
                      newDate.setFullYear(parseInt(value));
                      setCalendarMonth(newDate);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Variations (Fashion) */}
        {config.fields.showVariations && (
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <Label className="text-sm font-medium block">
              Variações (tamanho + cor)
            </Label>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                {/* Size Category Selector */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Tipo de tamanho</Label>
                  <Select value={sizeCategory} onValueChange={(val) => {
                    setSizeCategory(val as SizeCategoryKey);
                    setSelectedSize('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SIZE_CATEGORIES).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Size Input */}
                {sizeCategory === 'personalizado' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Adicionar tamanho personalizado</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: 2XL, 54, etc."
                        value={newCustomSize}
                        onChange={(e) => setNewCustomSize(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomSize}
                        disabled={!newCustomSize.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {customSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customSizes.map((size) => (
                          <Badge 
                            key={size} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => setCustomSizes(customSizes.filter(s => s !== size))}
                          >
                            {size} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Tamanho</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(sizeCategory === 'personalizado' ? customSizes : SIZE_CATEGORIES[sizeCategory].sizes).map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Cor</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem key={color.name} value={color.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddVariation}
                  disabled={!selectedSize || !selectedColor}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar variação
                </Button>
              </CardContent>
            </Card>

            {/* Variations List */}
            {variations.length > 0 && (
              <div className="space-y-2">
                {variations.map((variation, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {variation.size} - {variation.color}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateVariationQuantity(index, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {variation.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateVariationQuantity(index, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeVariation(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="font-bold text-foreground">
                      {variations.reduce((sum, v) => sum + v.quantity, 0)} unidades
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simple Quantity (General/Cosmetics) */}
        {!config.fields.showVariations && (
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Label className="text-sm font-medium mb-3 block">
              Quantidade em estoque
            </Label>
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
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
        )}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-8 mt-8">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Cadastrar produto
            </>
          )}
        </Button>
      </div>
    </MobileLayout>
  );
}
