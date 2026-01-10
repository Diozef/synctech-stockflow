-- ====================================================
-- QUERIES ÚTEIS PARA O MÓDULO FINANCEIRO
-- ====================================================

-- 1. Ver todas as transações de um negócio com detalhes
SELECT 
  ft.id,
  ft.finance_type,
  ft.category,
  ft.amount,
  ft.description,
  ft.created_at,
  p.name as product_name
FROM financial_transactions ft
LEFT JOIN products p ON ft.product_id = p.id
WHERE ft.business_id = 'SEU_BUSINESS_ID'
ORDER BY ft.created_at DESC;

-- 2. Resumo financeiro (total receitas vs despesas)
SELECT 
  finance_type,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MAX(amount) as max_transaction,
  MIN(amount) as min_transaction
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID'
GROUP BY finance_type;

-- 3. Saldo atual
SELECT 
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'receita') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'despesa') as total_expense,
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'receita') -
  (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'despesa') as balance;

-- 4. Receitas por categoria
SELECT 
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'receita'
GROUP BY category
ORDER BY total DESC;

-- 5. Despesas por categoria
SELECT 
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'despesa'
GROUP BY category
ORDER BY total DESC;

-- 6. Análise de vendas por produto (receitas automáticas)
SELECT 
  p.id,
  p.name,
  COUNT(ft.id) as sale_count,
  SUM(ft.amount) as total_revenue,
  AVG(ft.amount) as average_sale_value
FROM financial_transactions ft
JOIN products p ON ft.product_id = p.id
WHERE ft.business_id = 'SEU_BUSINESS_ID' 
  AND ft.finance_type = 'receita' 
  AND ft.category = 'vendas'
  AND ft.stock_movement_id IS NOT NULL
GROUP BY p.id, p.name
ORDER BY total_revenue DESC;

-- 7. Receitas vs Despesas por mês (últimos 6 meses)
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  finance_type,
  SUM(amount) as total
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID'
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at), finance_type
ORDER BY mes DESC, finance_type;

-- 8. Transações sem descrição (possível controle de qualidade)
SELECT *
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID'
  AND (description IS NULL OR description = '')
ORDER BY created_at DESC;

-- 9. Maiores transações (receitas)
SELECT *
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'receita'
ORDER BY amount DESC
LIMIT 10;

-- 10. Maiores despesas
SELECT *
FROM financial_transactions
WHERE business_id = 'SEU_BUSINESS_ID' AND finance_type = 'despesa'
ORDER BY amount DESC
LIMIT 10;

-- 11. Receitas automáticas geradas por movimentação de estoque
SELECT 
  ft.id,
  ft.amount,
  ft.description,
  ft.created_at,
  sm.quantity,
  p.name as product_name,
  p.price
FROM financial_transactions ft
JOIN stock_movements sm ON ft.stock_movement_id = sm.id
JOIN products p ON ft.product_id = p.id
WHERE ft.business_id = 'SEU_BUSINESS_ID'
  AND ft.finance_type = 'receita'
  AND ft.category = 'vendas'
ORDER BY ft.created_at DESC;

-- 12. Comparação: receitas de vendas vs quantidade de itens vendidos
SELECT 
  COUNT(DISTINCT sm.id) as total_sales,
  SUM(sm.quantity) as total_items_sold,
  (SELECT SUM(amount) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' 
   AND finance_type = 'receita' 
   AND category = 'vendas') as total_revenue,
  ROUND((SELECT SUM(amount) FROM financial_transactions 
   WHERE business_id = 'SEU_BUSINESS_ID' 
   AND finance_type = 'receita' 
   AND category = 'vendas') / SUM(sm.quantity), 2) as average_price_per_item
FROM stock_movements sm
JOIN financial_transactions ft ON sm.id = ft.stock_movement_id
WHERE sm.movement_type = 'saida'
  AND ft.business_id = 'SEU_BUSINESS_ID';

-- ====================================================
-- DICAS DE USO
-- ====================================================

/*
1. Substituir 'SEU_BUSINESS_ID' pelo ID real:
   - Você pode encontrar em: businesses.id
   - Associado ao seu user_id

2. Para usar como relatório:
   - Execute no console do Supabase
   - Ou integre a query no seu frontend

3. Para análises mais profundas:
   - Combinar financial_transactions com stock_movements
   - Combinar financial_transactions com products

4. Performance:
   - Todas as queries têm índices criados
   - Use filtros de data para grandes períodos

5. Segurança:
   - As queries abaixo mostram como o RLS funciona
   - Nunca execute queries sem WHERE business_id se precisar de dados públicos
*/
