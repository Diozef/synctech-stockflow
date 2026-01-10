-- ====================================================
-- MÓDULO FINANCEIRO - SCRIPT PRONTO PARA COLE (Lovable Cloud)
-- - defensivo contra falta de extensões
-- - evita erros se objetos já existirem
-- ====================================================

-- 1) Tentar criar extensões (ignora erro se não permitido)
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'pgcrypto não disponível: %', SQLERRM;
  END;
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'uuid-ossp não disponível: %', SQLERRM;
  END;
END;
$$;

-- 2) Função segura para gerar UUID (usa gen_random_uuid / uuid_generate_v4 / fallback)
CREATE OR REPLACE FUNCTION public.safe_uuid_generate()
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v uuid;
  s text;
BEGIN
  BEGIN
    v := gen_random_uuid();
    RETURN v;
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
  BEGIN
    v := uuid_generate_v4();
    RETURN v;
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
  -- Fallback: gerar pseudo-UUID a partir de md5
  s := md5(random()::text || clock_timestamp()::text);
  RETURN (substring(s,1,8) || '-' || substring(s,9,4) || '-' || substring(s,13,4) || '-' || substring(s,17,4) || '-' || substring(s,21,12))::uuid;
END;
$$ STABLE;

-- 3) Criar tipos ENUM apenas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_type') THEN
    CREATE TYPE public.finance_type AS ENUM ('receita', 'despesa');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_category') THEN
    CREATE TYPE public.finance_category AS ENUM ('vendas', 'devolucao', 'aluguel', 'energia', 'agua', 'internet', 'folha_pagamento', 'marketing', 'manutencao', 'outro');
  END IF;
END;
$$;

-- 4) Criar tabela (não falha se já existir)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  finance_type public.finance_type NOT NULL,
  category public.finance_category NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  stock_movement_id UUID REFERENCES public.stock_movements(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Índices (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_business ON public.financial_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(finance_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created ON public.financial_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_stock_movement ON public.financial_transactions(stock_movement_id);

-- 6) Habilitar RLS (idempotente)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 7) Policies
CREATE POLICY "Users can view own financial transactions"
  ON public.financial_transactions FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create own financial transactions"
  ON public.financial_transactions FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own financial transactions"
  ON public.financial_transactions FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own financial transactions"
  ON public.financial_transactions FOR DELETE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- 8) Trigger para manter updated_at (remove se já existir e cria)
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Função para criar receita automática ao inserir saída no estoque
CREATE OR REPLACE FUNCTION public.create_revenue_on_stock_exit()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
BEGIN
  IF NEW.movement_type = 'saida' THEN
    SELECT p.id, p.business_id, p.price INTO v_product
      FROM public.products p
      WHERE p.id = NEW.product_id;

    IF FOUND AND v_product.price IS NOT NULL AND v_product.price > 0 THEN
      INSERT INTO public.financial_transactions (
        business_id,
        finance_type,
        category,
        amount,
        description,
        stock_movement_id,
        product_id
      ) VALUES (
        v_product.business_id,
        'receita',
        'vendas',
        v_product.price * NEW.quantity,
        'Receita automática de venda: ' || v_product.id,
        NEW.id,
        v_product.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 10) Trigger para stock_movements (remove se existir e cria)
DROP TRIGGER IF EXISTS on_stock_exit_create_revenue ON public.stock_movements;

CREATE TRIGGER on_stock_exit_create_revenue
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.create_revenue_on_stock_exit();