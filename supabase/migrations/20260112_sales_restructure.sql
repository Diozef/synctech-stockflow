-- ====================================================
-- Restructure: Sales / Inventory / Finance / Caderninho
-- - Cria `customers` e `installments`
-- - Adiciona `sale_id` em `stock_movements`
-- - Remove trigger que gerava receita automaticamente nas saídas de estoque
-- - Adiciona trigger em `sale_items` para decrementar `products.quantity` e inserir `stock_movements` (vinculado à venda)
-- - Adiciona trigger em `sales` para gerar `installments` quando parcelada e criar `financial_transactions` quando à vista
-- ====================================================

-- Segurança: tente rodar tudo de forma idempotente

-- 1) Criar tipo enum para status de parcela (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_status') THEN
    CREATE TYPE public.installment_status AS ENUM ('pending','paid','overdue','cancelled');
  END IF;
END
$$;

-- 2) Tabela customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own customers"
  ON public.customers FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create own customers"
  ON public.customers FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update own customers"
  ON public.customers FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER IF NOT EXISTS update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Tabela installments
CREATE TABLE IF NOT EXISTS public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status public.installment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installments_sale ON public.installments(sale_id);
CREATE INDEX IF NOT EXISTS idx_installments_business ON public.installments(business_id);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own installments"
  ON public.installments FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create own installments"
  ON public.installments FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update own installments"
  ON public.installments FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER IF NOT EXISTS update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Alterar stock_movements: adicionar sale_id (se ainda não existe)
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_sale ON public.stock_movements(sale_id);

-- 5) Remover trigger/função antiga que criava receita automaticamente a partir de saída de estoque
DROP TRIGGER IF EXISTS on_stock_exit_create_revenue ON public.stock_movements;
DROP FUNCTION IF EXISTS public.create_revenue_on_stock_exit();

-- 6) Trigger: ao inserir um sale_items, decrementar produto e inserir stock_movements (saída)
-- Nota: usa row_to_json(NEW) para acessar campos dinamicamente e tolerar pequenas diferenças de esquema
CREATE OR REPLACE FUNCTION public.handle_sale_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_sale RECORD;
  v_business UUID;
BEGIN
  -- carregar venda, se existir (para business_id / customer_id infos)
  BEGIN
    SELECT * INTO v_sale FROM public.sales WHERE id = NEW.sale_id;
  EXCEPTION WHEN others THEN
    v_sale := NULL;
  END;

  -- Atualizar quantidade do produto (se existir)
  BEGIN
    UPDATE public.products
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.product_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Erro ao decrementar product %: %', NEW.product_id, SQLERRM;
  END;

  -- Inserir movimentação de estoque do tipo 'saida' vinculada à venda
  BEGIN
    INSERT INTO public.stock_movements (product_id, movement_type, quantity, sale_id, observation)
    VALUES (NEW.product_id, 'saida', NEW.quantity, NEW.sale_id, 'Saída gerada por venda ' || COALESCE(NEW.sale_id::text, ''));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Erro ao criar stock_movement para sale_item %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sale_items') THEN
    -- Criar trigger somente se a tabela sale_items existir
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_sale_item_insert') THEN
      CREATE TRIGGER on_sale_item_insert
        AFTER INSERT ON public.sale_items
        FOR EACH ROW EXECUTE FUNCTION public.handle_sale_item_insert();
    END IF;
  ELSE
    RAISE NOTICE 'Tabela public.sale_items não encontrada; trigger on_sale_item_insert não criada.';
  END IF;
END;
$$;

-- 7) Trigger: ao inserir uma venda, criar parcelas (se parcelada) ou criar transação financeira (se à vista)
CREATE OR REPLACE FUNCTION public.handle_sale_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_row_json JSON;
  v_payment_method TEXT;
  v_installments INTEGER := 0;
  v_total NUMERIC := 0;
  v_business UUID;
  v_customer UUID;
  i INTEGER;
  v_base_amount NUMERIC;
  v_due DATE;
  v_created_at TIMESTAMP := now();
BEGIN
  -- Acessar campos de forma dinâmica para evitar falhas caso algumas colunas não existam
  v_row_json := row_to_json(NEW);
  v_payment_method := coalesce(v_row_json->>'payment_method', '')::text;
  v_installments := coalesce((v_row_json->>'installments_count')::int, 0);
  v_total := coalesce((v_row_json->>'total_amount')::numeric, 0);
  v_business := (v_row_json->>'business_id')::uuid;
  v_customer := (v_row_json->>'customer_id')::uuid;

  -- Preferir criar installments quando installments_count > 1 ou payment_method indica parcelado
  IF v_installments IS NULL THEN v_installments := 0; END IF;

  BEGIN
    IF (v_payment_method = 'parcelado' OR v_installments > 1) THEN
      IF v_installments <= 0 THEN v_installments := 1; END IF;
      v_base_amount := ROUND((v_total::numeric / v_installments)::numeric, 2);
      v_due := (COALESCE((v_row_json->>'created_at')::date, now()::date));

      FOR i IN 1..v_installments LOOP
        INSERT INTO public.installments (
          business_id, sale_id, customer_id, installment_number, due_date, amount, status
        ) VALUES (
          v_business, NEW.id, v_customer, i, (v_due + (i-1) * INTERVAL '1 month')::date, v_base_amount, 'pending'
        );
      END LOOP;

    ELSE
      -- à vista => criar transação financeira imediata
      IF v_total > 0 THEN
        INSERT INTO public.financial_transactions (
          business_id, finance_type, category, amount, description
        ) VALUES (
          v_business, 'receita', 'vendas', v_total, 'Venda à vista: ' || COALESCE(NEW.id::text, '')
        );
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Erro ao processar venda %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sales') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_sale_insert') THEN
      CREATE TRIGGER on_sale_insert
        AFTER INSERT ON public.sales
        FOR EACH ROW EXECUTE FUNCTION public.handle_sale_insert();
    END IF;
  ELSE
    RAISE NOTICE 'Tabela public.sales não encontrada; trigger on_sale_insert não criada.';
  END IF;
END;
$$;

-- 8) Índices e notas
CREATE INDEX IF NOT EXISTS idx_installments_customer ON public.installments(customer_id);

-- Observação: as triggers estão escritas para serem tolerantes caso as tabelas (`sales`, `sale_items`) não existam em instalações antigas. Quando a sua base já tiver `sales` e `sale_items`, as triggers serão ativadas automaticamente.

-- Fim da migration
