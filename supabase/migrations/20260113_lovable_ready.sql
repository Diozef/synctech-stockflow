-- ====================================================
-- Lovable-ready: Sales / Installments → Finance adjustments
-- Uso: cole este script no Lovable (em uma única execução) — ele é idempotente e garante a ordem correta:
--  1) Remove triggers/funções duplicadas em sale_items (evita dupla baixa de estoque)
--  2) Adiciona coluna `installment_id` em `financial_transactions` (se necessário)
--  3) Cria função/trigger que gera `financial_transactions` quando parcela é marcada como paga
-- ====================================================

-- 1) REMOVER trigger/função duplicadas em sale_items (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sale_items') THEN
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_sale_item_insert') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS on_sale_item_insert ON public.sale_items';
        RAISE NOTICE 'Removed trigger on_sale_item_insert';
      END IF;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Erro ao tentar remover trigger on_sale_item_insert: %', SQLERRM;
    END;

    BEGIN
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_sale_item_insert') THEN
        EXECUTE 'DROP FUNCTION IF EXISTS public.handle_sale_item_insert()';
        RAISE NOTICE 'Removed function public.handle_sale_item_insert()';
      END IF;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Erro ao tentar remover função handle_sale_item_insert: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Tabela public.sale_items não encontrada; nada para remover.';
  END IF;
END;
$$;

-- 2) ADICIONAR coluna installment_id em financial_transactions (se tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'financial_transactions') THEN
    BEGIN
      ALTER TABLE public.financial_transactions
        ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Erro ao adicionar coluna installment_id: %', SQLERRM;
    END;

    BEGIN
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_installment ON public.financial_transactions(installment_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Erro ao criar índice idx_financial_transactions_installment: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Tabela public.financial_transactions não encontrada; pulando adição de coluna.';
  END IF;
END;
$$;

-- 3) CRIAR função/trigger que gera financial_transaction quando parcela é marcada como paga
CREATE OR REPLACE FUNCTION public.handle_installment_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_status_new TEXT;
  v_status_old TEXT;
  v_amount NUMERIC;
  v_sale_id UUID;
  v_description TEXT;
BEGIN
  v_status_new := lower(coalesce(NEW.status::text, ''));
  v_status_old := lower(coalesce(OLD.status::text, ''));

  -- Detecta transição para pago (aceita 'pago' ou 'paid')
  IF (v_status_new = 'pago' OR v_status_new = 'paid') AND (v_status_old IS NULL OR (v_status_old != 'pago' AND v_status_old != 'paid')) THEN

    v_amount := NEW.amount;
    v_sale_id := NEW.sale_id;
    v_description := 'Parcela paga: ' || coalesce(NEW.installment_number::text, '') || ' (Venda: ' || coalesce(v_sale_id::text, '') || ')';

    -- Proteção contra duplicação: insere somente se não houver uma transação vinculada a esta parcela
    IF NOT EXISTS (SELECT 1 FROM public.financial_transactions WHERE installment_id = NEW.id) THEN
      INSERT INTO public.financial_transactions (
        business_id, finance_type, category, amount, description, installment_id, created_at
      ) VALUES (
        NEW.business_id,
        'receita',
        'vendas',
        v_amount,
        v_description,
        NEW.id,
        COALESCE(NEW.paid_at, now())
      );
    ELSE
      RAISE NOTICE 'Transação para installment_id % já existe — pulando inserção.', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger somente se a tabela installments existir e o trigger não existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'installments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_installment_paid') THEN
      CREATE TRIGGER on_installment_paid
        AFTER INSERT OR UPDATE ON public.installments
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_installment_paid();
      RAISE NOTICE 'Trigger on_installment_paid criada.';
    ELSE
      RAISE NOTICE 'Trigger on_installment_paid já existe.';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela public.installments não encontrada; trigger on_installment_paid não criada.';
  END IF;
END;
$$;

-- Nota final: este script é seguro para execução repetida; execute-o no Lovable ou via psql/supabase CLI.
-- Fim do arquivo
