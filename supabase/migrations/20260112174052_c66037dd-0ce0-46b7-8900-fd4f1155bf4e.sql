-- =============================================
-- MÓDULO CADERNINHO DIGITAL - Tabelas e Triggers
-- =============================================

-- 1. ENUM para status de parcela
CREATE TYPE public.installment_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- 2. ENUM para tipo de venda
CREATE TYPE public.sale_payment_type AS ENUM ('avista', 'parcelado');

-- 3. Tabela de Clientes
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para clientes
CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_customers_name ON public.customers(name);

-- RLS para clientes
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customers" ON public.customers
FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create own customers" ON public.customers
FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own customers" ON public.customers
FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own customers" ON public.customers
FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- 4. Tabela de Vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  payment_type public.sale_payment_type NOT NULL DEFAULT 'avista',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  installments_count INTEGER NOT NULL DEFAULT 1,
  first_due_date DATE,
  has_down_payment BOOLEAN NOT NULL DEFAULT false,
  down_payment_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para vendas
CREATE INDEX idx_sales_business_id ON public.sales(business_id);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);

-- RLS para vendas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales" ON public.sales
FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create own sales" ON public.sales
FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own sales" ON public.sales
FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own sales" ON public.sales
FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- 5. Tabela de Itens de Venda
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para itens de venda
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

-- RLS para itens de venda
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sale items" ON public.sale_items
FOR SELECT USING (
  sale_id IN (SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can create own sale items" ON public.sale_items
FOR INSERT WITH CHECK (
  sale_id IN (SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can delete own sale items" ON public.sale_items
FOR DELETE USING (
  sale_id IN (SELECT id FROM sales WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
);

-- 6. Tabela de Parcelas (Contas a Receber)
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status public.installment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para parcelas
CREATE INDEX idx_installments_business_id ON public.installments(business_id);
CREATE INDEX idx_installments_customer_id ON public.installments(customer_id);
CREATE INDEX idx_installments_sale_id ON public.installments(sale_id);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_installments_status ON public.installments(status);

-- RLS para parcelas
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installments" ON public.installments
FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create own installments" ON public.installments
FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own installments" ON public.installments
FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own installments" ON public.installments
FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- 7. TRIGGER: Baixa automática de estoque ao inserir item de venda (CRÍTICO)
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_stock INTEGER;
  v_product_name TEXT;
BEGIN
  -- Buscar estoque atual e nome do produto
  SELECT quantity, name INTO v_current_stock, v_product_name
  FROM public.products
  WHERE id = NEW.product_id;

  -- Validar se há estoque suficiente (QA: impedir venda negativa)
  IF v_current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto "%". Disponível: %, Solicitado: %', 
      v_product_name, v_current_stock, NEW.quantity;
  END IF;

  -- Deduzir do estoque
  UPDATE public.products
  SET quantity = quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Registrar movimento de saída
  INSERT INTO public.stock_movements (product_id, movement_type, quantity, observation)
  VALUES (NEW.product_id, 'saida', NEW.quantity, 'Venda automática - Caderninho Digital');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deduct_stock_on_sale_item
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_sale_item();

-- 8. TRIGGER: Atualizar status de parcelas atrasadas
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar parcelas pendentes que passaram da data de vencimento
  UPDATE public.installments
  SET status = 'atrasado',
      updated_at = now()
  WHERE status = 'pendente'
    AND due_date < CURRENT_DATE;
  
  RETURN NULL;
END;
$$;

-- 9. TRIGGER: Atualizar updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installments_updated_at
BEFORE UPDATE ON public.installments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Tabela de Notificações de Estoque Baixo
CREATE TABLE public.low_stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_quantity INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para notificações
CREATE INDEX idx_low_stock_notifications_business ON public.low_stock_notifications(business_id);
CREATE INDEX idx_low_stock_notifications_read ON public.low_stock_notifications(is_read);

-- RLS para notificações
ALTER TABLE public.low_stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.low_stock_notifications
FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own notifications" ON public.low_stock_notifications
FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own notifications" ON public.low_stock_notifications
FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "System can create notifications" ON public.low_stock_notifications
FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- 11. TRIGGER: Criar notificação quando estoque ficar baixo
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_min_stock INTEGER;
  v_business_id UUID;
  v_existing_notification UUID;
BEGIN
  -- Buscar configuração de estoque mínimo do negócio
  SELECT b.min_stock_alert, p.business_id INTO v_min_stock, v_business_id
  FROM public.products p
  JOIN public.businesses b ON p.business_id = b.id
  WHERE p.id = NEW.id;

  -- Se estoque atual <= mínimo configurado
  IF NEW.quantity <= v_min_stock THEN
    -- Verificar se já existe notificação não lida para este produto
    SELECT id INTO v_existing_notification
    FROM public.low_stock_notifications
    WHERE product_id = NEW.id AND is_read = false;

    -- Se não existe, criar nova notificação
    IF v_existing_notification IS NULL THEN
      INSERT INTO public.low_stock_notifications (business_id, product_id, current_quantity, min_quantity)
      VALUES (v_business_id, NEW.id, NEW.quantity, v_min_stock);
    ELSE
      -- Atualizar quantidade atual na notificação existente
      UPDATE public.low_stock_notifications
      SET current_quantity = NEW.quantity
      WHERE id = v_existing_notification;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF quantity ON public.products
FOR EACH ROW
WHEN (NEW.quantity <= OLD.quantity)
EXECUTE FUNCTION public.check_low_stock_notification();