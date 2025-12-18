import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  ChevronLeft, 
  Camera, 
  Plus,
  Minus,
  Calendar,
  Check
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
// FUNÇÃO: Cadastrar produtos conforme o tipo de negócio

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];
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
  const { businessType, addProduct } = useBusiness();
  const config = getNicheConfig(businessType);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  
  // Conditional fields
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Variations for fashion
  const [variations, setVariations] = useState<Array<{ size: string; color: string; quantity: number }>>([]);

  // Redirect if no business type
  React.useEffect(() => {
    if (!businessType) {
      navigate('/');
    }
  }, [businessType, navigate]);

  if (!config) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto",
        variant: "destructive",
      });
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Preço obrigatório",
        description: "Digite um preço válido",
        variant: "destructive",
      });
      return;
    }

    const product = {
      name: name.trim(),
      price: parseFloat(price.replace(',', '.')),
      quantity: config.fields.showVariations ? variations.reduce((sum, v) => sum + v.quantity, 0) : quantity,
      photo: photo || undefined,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      brand: brand.trim() || undefined,
      expirationDate: expirationDate,
      variations: config.fields.showVariations ? variations : undefined,
    };

    addProduct(product);

    toast({
      title: "Produto cadastrado! 🎉",
      description: `${name} foi adicionado ao seu estoque.`,
    });

    navigate('/dashboard');
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

  // Generate years for date picker (current year to +5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{config.labels.addProduct}</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Photo */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Label className="text-sm font-medium mb-2 block">Foto (opcional)</Label>
          <button
            className="w-full h-32 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
            onClick={() => {
              // Mock photo upload
              setPhoto('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop');
            }}
          >
            {photo ? (
              <img src={photo} alt="Product" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Adicionar foto</span>
              </>
            )}
          </button>
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
                {/* Year/Month Selectors */}
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
            
            {/* Add Variation */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Tamanho</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map((size) => (
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
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!selectedSize || !selectedColor}
                  onClick={handleAddVariation}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar variação
                </Button>
              </CardContent>
            </Card>

            {/* Variations List */}
            {variations.length > 0 && (
              <div className="space-y-2">
                {variations.map((variation, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ 
                            backgroundColor: COLORS.find(c => c.name === variation.color)?.value 
                          }}
                        />
                        <span className="text-sm font-medium">
                          {variation.size} - {variation.color}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateVariationQuantity(index, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{variation.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateVariationQuantity(index, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeVariation(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Simple Quantity (for non-fashion) */}
        {!config.fields.showVariations && (
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Label className="text-sm font-medium mb-2 block">
              Quantidade em estoque
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 mt-8">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleSubmit}
        >
          <Check className="w-5 h-5 mr-2" />
          Cadastrar {config.labels.product.toLowerCase()}
        </Button>
      </div>
    </MobileLayout>
  );
}
