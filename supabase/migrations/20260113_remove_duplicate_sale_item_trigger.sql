-- ====================================================
-- Remover trigger duplicado que pode causar dupla baixa de estoque
-- - Remove `on_sale_item_insert` e sua função `handle_sale_item_insert` se existirem
-- ====================================================

DROP TRIGGER IF EXISTS on_sale_item_insert ON public.sale_items;
DROP FUNCTION IF EXISTS public.handle_sale_item_insert();

-- Fim da migration
