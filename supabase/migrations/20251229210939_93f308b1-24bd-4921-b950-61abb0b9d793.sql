-- ====================================================
-- SISTEMA DE ESTOQUE - ESTRUTURA DO BANCO DE DADOS
-- ====================================================

-- Tipo enum para tipo de negócio
CREATE TYPE public.business_type AS ENUM ('moda', 'cosmeticos', 'geral');

-- Tipo enum para tipo de movimentação
CREATE TYPE public.movement_type AS ENUM ('entrada', 'saida');

-- Tipo enum para categoria de tamanho (moda)
CREATE TYPE public.size_category AS ENUM ('letras', 'numeracao', 'calcados', 'personalizado');

-- ====================================================
-- TABELA: businesses (Configuração do negócio)
-- ====================================================
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_type public.business_type NOT NULL,
  business_name TEXT,
  min_stock_alert INTEGER NOT NULL DEFAULT 5,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ====================================================
-- TABELA: products (Produtos do estoque)
-- ====================================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Campos para moda
  size TEXT,
  color TEXT,
  size_category public.size_category,
  -- Campos para cosméticos
  brand TEXT,
  expiration_date DATE,
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ====================================================
-- TABELA: product_variations (Variações de produto - moda)
-- ====================================================
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ====================================================
-- TABELA: custom_sizes (Tamanhos personalizados)
-- ====================================================
CREATE TABLE public.custom_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  size_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, size_value)
);

-- ====================================================
-- TABELA: stock_movements (Movimentações de estoque)
-- ====================================================
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ====================================================
-- ÍNDICES para performance
-- ====================================================
CREATE INDEX idx_products_business ON public.products(business_id);
CREATE INDEX idx_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_movements_created ON public.stock_movements(created_at DESC);
CREATE INDEX idx_variations_product ON public.product_variations(product_id);

-- ====================================================
-- RLS - Row Level Security
-- ====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- POLÍTICAS RLS: businesses
-- ====================================================
CREATE POLICY "Users can view own business"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- ====================================================
-- POLÍTICAS RLS: products
-- ====================================================
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- ====================================================
-- POLÍTICAS RLS: product_variations
-- ====================================================
CREATE POLICY "Users can manage own product variations"
  ON public.product_variations FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.businesses b ON p.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- ====================================================
-- POLÍTICAS RLS: custom_sizes
-- ====================================================
CREATE POLICY "Users can manage own custom sizes"
  ON public.custom_sizes FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- ====================================================
-- POLÍTICAS RLS: stock_movements
-- ====================================================
CREATE POLICY "Users can view own movements"
  ON public.stock_movements FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.businesses b ON p.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.businesses b ON p.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- ====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================
-- TRIGGER: Atualizar quantidade do produto após movimentação
-- ====================================================
CREATE OR REPLACE FUNCTION public.update_product_quantity_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'entrada' THEN
    UPDATE public.products
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'saida' THEN
    UPDATE public.products
    SET quantity = GREATEST(0, quantity - NEW.quantity)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_stock_movement_insert
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity_on_movement();