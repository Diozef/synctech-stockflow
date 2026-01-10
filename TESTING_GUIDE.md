#!/bin/bash
# ====================================================
# GUIA DE TESTES - MÓDULO FINANCEIRO
# ====================================================

## 🧪 CHECKLIST DE VALIDAÇÃO

### ✅ Fase 1: Setup Inicial
- [ ] Migration foi aplicada com sucesso
- [ ] Tabela `financial_transactions` existe no Supabase
- [ ] RLS está habilitado
- [ ] Políticas de segurança estão criadas

### ✅ Fase 2: Frontend - Estrutura
- [ ] FinanceScreen.tsx está em `src/screens/`
- [ ] useFinance.ts está em `src/hooks/`
- [ ] App.tsx tem rota `/app/finance`
- [ ] BottomNav.tsx tem ícone de Finanças
- [ ] Projeto compila sem erros

### ✅ Fase 3: Navegação
- [ ] Consegue clicar em "Finanças" na barra inferior
- [ ] Página carrega sem erros
- [ ] Cards de resumo aparecem
- [ ] Abas "Registrar" e "Histórico" funcionam

### ✅ Fase 4: Formulário de Receita
- [ ] Consegue preencher formulário
- [ ] Validação funciona (campo obrigatório)
- [ ] Consegue registrar uma receita
- [ ] Receita aparece no histórico
- [ ] Valores aparecem corretos nos cards

### ✅ Fase 5: Formulário de Despesa
- [ ] Consegue mudar para tipo "Despesa"
- [ ] Categorias mudam dinamicamente
- [ ] Consegue registrar uma despesa
- [ ] Despesa aparece no histórico
- [ ] Cards de resumo atualizam corretamente

### ✅ Fase 6: Filtros
- [ ] Filtro por tipo (Receita/Despesa) funciona
- [ ] Filtro por categoria funciona
- [ ] Filtro por data funciona
- [ ] Busca por descrição funciona
- [ ] Botão "Limpar Filtros" reseta tudo

### ✅ Fase 7: Histórico
- [ ] Listagem mostra todas as transações
- [ ] Cores corretas (verde = receita, vermelho = despesa)
- [ ] Valores formatados corretamente (R$)
- [ ] Datas formatadas em português
- [ ] Botão de deletar funciona

### ✅ Fase 8: Dashboard
- [ ] Resumo financeiro aparece no dashboard
- [ ] Card de receitas mostra valor correto
- [ ] Card de despesas mostra valor correto
- [ ] Cards são clicáveis e levam para `/app/finance`

### ✅ Fase 9: Sincronização Estoque → Financeiro
**Teste Crítico:**
1. Vá para Estoque → Cadastre um novo produto
   - Nome: "Produto Teste"
   - Preço: R$ 50.00
   - Quantidade: 10 unidades

2. Vá para Movimentações → Registre uma Saída
   - Produto: "Produto Teste"
   - Quantidade: 2 unidades
   - Tipo: Saída

3. Vá para Finanças → Abra o Histórico
   - [ ] Deve ter uma receita automática
   - [ ] Descrição: "Receita automática de venda: [product_id]"
   - [ ] Valor: R$ 100.00 (50 × 2)
   - [ ] Categoria: "Vendas"
   - [ ] Vinculada ao movimento de estoque

### ✅ Fase 10: Permissões (RLS)
1. Crie 2 contas de usuário diferentes (A e B)
2. Usuário A registra uma transação
3. Faça login como Usuário B
   - [ ] Não consegue ver transações de A
   - [ ] Só vê suas próprias transações

### ✅ Fase 11: Performance
- [ ] Página carrega em < 2 segundos
- [ ] Filtros respondem imediatamente
- [ ] Deletar transação é instantâneo
- [ ] Registrar transação é rápido (< 1s)

### ✅ Fase 12: Responsividade
- [ ] Layout correto em mobile (375px)
- [ ] Layout correto em tablet (768px)
- [ ] Layout correto em desktop (1024px)
- [ ] Barra inferior não sobrepõe conteúdo
- [ ] Formulários acessíveis

---

## 🐛 TESTES DE ERRO

### Teste 1: Campo Obrigatório Vazio
```
1. Clique em "Registrar"
2. Tente enviar formulário vazio
3. Esperado: Toast de erro "Preencha os campos obrigatórios"
```

### Teste 2: Valor Inválido
```
1. Preencha "Valor" com "abc"
2. Tente enviar
3. Esperado: Input rejeita ou erro ao enviar
```

### Teste 3: Deletar Transação
```
1. Registre uma transação
2. Clique no ícone de lixo
3. Confirme deleção
4. Esperado: Transação desaparece do histórico
```

### Teste 4: Sincronização Falha
```
1. Registre saída com produto SEM PREÇO
2. Vá para Finanças
3. Esperado: Nenhuma receita automática criada
```

---

## 📊 DADOS DE TESTE

### Cenário 1: Empresa com Equilíbrio
```
Receitas:
- Venda Produto A: R$ 200.00
- Venda Produto B: R$ 150.00
- Total: R$ 350.00

Despesas:
- Aluguel: R$ 200.00
- Energia: R$ 50.00
- Total: R$ 250.00

Saldo Esperado: R$ 100.00 ✅
```

### Cenário 2: Empresa em Prejuízo
```
Receitas:
- Vendas: R$ 500.00

Despesas:
- Aluguel: R$ 300.00
- Energia: R$ 100.00
- Marketing: R$ 150.00
- Total: R$ 550.00

Saldo Esperado: -R$ 50.00 ⚠️
(Card deve aparecer em laranja)
```

### Cenário 3: Sem Transações
```
- Empresa nova
- Nenhuma transação registrada
- Esperado: Cards zerados, histórico vazio
```

---

## 🔧 COMO EXECUTAR TESTES

### Terminal 1: Rodando a app
```bash
cd c:\Projetos\stockflow\synctech-stockflow
npm run dev
```

### Terminal 2: Verificando tipos TypeScript
```bash
npx tsc --noEmit
```

### Validação Manual
1. Abrir http://localhost:5173
2. Fazer login
3. Executar cada item do checklist acima

---

## 📝 REPORT DE TESTES

Crie um arquivo `TEST_REPORT.md` com:

```markdown
# Teste - Módulo Financeiro
Data: DD/MM/YYYY
Tester: [Seu Nome]

## Resultados

### Fase 1: Setup ✅
- [x] Migration aplicada
- [x] Tabela criada
- [x] RLS ativado

### Fase 2: Frontend ✅
- [x] Arquivos criados
- [x] Tipos corretos
- [x] Sem erros de compilação

### ... (continue com cada fase)

## Problemas Encontrados
[Lista de issues, se houver]

## Observações
[Notas adicionais]
```

---

## 🚀 Comandos Úteis

### Ver logs do Supabase
```bash
supabase status
```

### Testar função de trigger
```sql
-- No console do Supabase:
INSERT INTO stock_movements (product_id, movement_type, quantity)
VALUES ('PRODUCT_ID', 'saida', 2);

-- Depois verificar:
SELECT * FROM financial_transactions 
WHERE stock_movement_id IS NOT NULL
ORDER BY created_at DESC LIMIT 1;
```

### Limpar dados de teste
```sql
DELETE FROM financial_transactions 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND business_id = 'SEU_BUSINESS_ID';
```

---

## ✨ Exemplo de Sucesso

Se tudo está funcionando corretamente:

✅ Você cadastra um produto com preço
✅ Registra uma venda no estoque
✅ Vê a receita automática no financeiro
✅ Dashboard mostra o resumo correto
✅ Filtros funcionam perfeitamente
✅ Sem erros de segurança (RLS)

**Parabéns! Seu módulo financeiro está pronto para produção! 🎉**

---

## 📞 Troubleshooting

### Problema: "Receita automática não foi criada"
**Solução:**
1. Verificar se produto tem preço > 0
2. Verificar trigger em `create_revenue_on_stock_exit`
3. Ver logs do Supabase

### Problema: "Não consigo deletar transações"
**Solução:**
1. Verificar RLS policies
2. Garantir que business_id é o seu
3. Verificar permissões do usuário

### Problema: "Filtros não funcionam"
**Solução:**
1. Verificar se há transações registradas
2. Limpar cache (F5)
3. Verificar tipos de dados

---

**Boa sorte com os testes! 🧪**
