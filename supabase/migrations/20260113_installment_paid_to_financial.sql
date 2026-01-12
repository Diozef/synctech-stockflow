-- ====================================================
-- Criar receita automática quando uma parcela for marcada como paga
-- - Adiciona coluna `installment_id` em financial_transactions
-- - Cria função e trigger que insere uma financial_transaction quando uma parcela passa a 'pago' (ou 'paid')
-- - Idempotente e tolerante a valores em PT/EN
-- ====================================================

-- 1) Expandir financial_transactions com coluna installment_id
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_installment ON public.financial_transactions(installment_id);

-- 2) Função para inserir transação financeira quando parcela é paga
CREATE OR REPLACE FUNCTION public.handle_installment_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_status_new TEXT;
  v_status_old TEXT;
  v_sale_id UUID;
  v_description TEXT;
  v_amount NUMERIC;
BEGIN
  v_status_new := lower(coalesce(NEW.status::text, ''));
  v_status_old := lower(coalesce(OLD.status::text, ''));

  -- Normalizar ambas formas possível ('pago' / 'paid')
  IF (v_status_new = 'pago' OR v_status_new = 'paid') AND (v_status_old IS NULL OR (v_status_old != 'pago' AND v_status_old != 'paid')) THEN
    v_sale_id := NEW.sale_id;
    v_amount := NEW.amount;
    v_description := 'Parcela paga: ' || coalesce(NEW.installment_number::text, '') || ' (Venda: ' || coalesce(v_sale_id::text, '') || ')';

    -- Evitar duplicatas: insere apenas se não existir uma transação vinculada a esta parcela
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger para INSERT/UPDATE em installments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'installments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_installment_paid') THEN
      CREATE TRIGGER on_installment_paid
        AFTER INSERT OR UPDATE ON public.installments
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_installment_paid();
    END IF;
  ELSE
    RAISE NOTICE 'Tabela public.installments não encontrada; trigger on_installment_paid não criada.';
  END IF;
END;
$$;

-- Fim da migration
