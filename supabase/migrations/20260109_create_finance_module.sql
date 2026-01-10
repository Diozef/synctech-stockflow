-- ====================================================
-- MÓDULO FINANCEIRO - ESTRUTURA DO BANCO DE DADOS
-- (versão defensiva: tenta criar extensões se possível e usa checks IF NOT EXISTS)
-- ====================================================

-- Garantir funções de UUID (pgcrypto ou uuid-ossp) quando possível
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN others THEN
    -- se não for permitido, ignorar (provider como Lovable pode restringir)
    NULL;
  END;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  EXCEPTION WHEN others THEN
    NULL;
  END;
END;
$$;

-- Tipo enum para tipo de transação financeira (cria somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_type') THEN
    CREATE TYPE public.finance_type AS ENUM ('receita', 'despesa');
  END IF;
END;
$$;

-- Tipo enum para categoria de transação (cria somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_category') THEN
    CREATE TYPE public.finance_category AS ENUM ('vendas', 'devolucao', 'aluguel', 'energia', 'agua', 'internet', 'folha_pagamento', 'marketing', 'manutencao', 'outro');
  END IF;
END;
$$;

-- ====================================================
-- TABELA: financial_transactions (Transações financeiras)
-- ====================================================
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  finance_type public.finance_type NOT NULL,
  category public.finance_category NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  -- Link para estoque (opcional - para rastrear origem)
  stock_movement_id UUID REFERENCES public.stock_movements(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ====================================================
-- ÍNDICES para performance
-- ====================================================
CREATE INDEX idx_financial_transactions_business ON public.financial_transactions(business_id);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(finance_type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX idx_financial_transactions_created ON public.financial_transactions(created_at DESC);
CREATE INDEX idx_financial_transactions_stock_movement ON public.financial_transactions(stock_movement_id);

-- ====================================================
-- RLS - Row Level Security
-- ====================================================
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias transações financeiras
CREATE POLICY "Users can view own financial transactions"
  ON public.financial_transactions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Usuários podem criar transações financeiras para seu negócio
CREATE POLICY "Users can create own financial transactions"
  ON public.financial_transactions FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar suas próprias transações financeiras
CREATE POLICY "Users can update own financial transactions"
  ON public.financial_transactions FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- Usuários podem deletar suas próprias transações financeiras
CREATE POLICY "Users can delete own financial transactions"
  ON public.financial_transactions FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- ====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ====================================================
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================
-- FUNÇÃO: Auto-gerar receita quando há saída de estoque
-- ====================================================
CREATE OR REPLACE FUNCTION public.create_revenue_on_stock_exit()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_business_id UUID;
BEGIN
  -- Se for uma saída (venda), criar uma receita automática
  IF NEW.movement_type = 'saida' THEN
    -- Obter informações do produto
    SELECT p.id, p.business_id, p.price INTO v_product
    FROM public.products p
    WHERE p.id = NEW.product_id;
    
    -- Se o produto tiver um preço, criar a receita automaticamente
    IF v_product.price > 0 THEN
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

-- Trigger para criar receita automaticamente ao sair estoque
CREATE TRIGGER on_stock_exit_create_revenue
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.create_revenue_on_stock_exit();
