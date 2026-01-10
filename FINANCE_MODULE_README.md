# 📊 Módulo Financeiro - Guia de Implementação

## ✅ O que foi implementado

Você agora tem um **módulo financeiro completo** integrado ao seu sistema de estoque com as seguintes funcionalidades:

### 1️⃣ **Novas Tabelas no Banco de Dados**
- **`financial_transactions`** - Armazena todas as transações financeiras (receitas e despesas)
- **Tipos de transação**: Receita, Despesa
- **Categorias disponíveis**:
  - **Receitas**: Vendas, Devolução, Outro
  - **Despesas**: Aluguel, Energia, Água, Internet, Folha de Pagamento, Marketing, Manutenção, Outro

### 2️⃣ **Nova Página `/app/finance`**
Tela completa com:
- ✅ **Formulário para Registrar Receitas** - Selecionar tipo, categoria, valor, descrição
- ✅ **Formulário para Registrar Despesas** - Mesmos campos
- ✅ **Tabela de Histórico Financeiro** com:
  - Filtros por tipo (Receitas/Despesas)
  - Filtros por categoria
  - Filtros por período (data inicial e final)
  - Busca por descrição
  - Botão para limpar filtros
  - Opção de deletar transações
- ✅ **Cards de Resumo**:
  - Total de Receitas (em verde)
  - Total de Despesas (em vermelho)
  - Saldo final (em azul ou laranja conforme positivo/negativo)

### 3️⃣ **Sincronização Automática Estoque → Financeiro**
Quando você registra uma **"Saída" (venda)** no estoque:
1. A quantidade é reduzida no estoque
2. Uma **receita é criada automaticamente** no módulo financeiro
3. O valor da receita é calculado como: `preço do produto × quantidade vendida`
4. A transação é vinculada ao movimento de estoque

**Nota**: Para isso funcionar, o produto **deve ter um preço configurado** no cadastro.

### 4️⃣ **Dashboard Atualizado**
O dashboard agora mostra:
- Cards com resumo de **receitas totais** e **despesas totais**
- Um **saldo comparativo** entre entradas e saídas financeiras
- Clique nos cards para ir direto para a página de finanças

### 5️⃣ **Navegação Integrada**
- Nova aba **"Finanças"** na barra de navegação inferior
- Link direto no dashboard para a página de finanças
- Navegação intuitiva e mobile-friendly

---

## 🚀 Próximos Passos para Colocar em Produção

### 1. **Deploy da Migration**
```bash
# Execute a migration no seu banco de dados Supabase
supabase migration up
```

### 2. **Verificar RLS (Row Level Security)**
As políticas de segurança já estão configuradas:
- Usuários só veem suas próprias transações
- Usuários só podem criar/editar/deletar suas próprias transações

### 3. **Testar a Sincronização**
1. Crie um produto com preço (ex: R$ 50.00)
2. Registre uma saída (venda) de 2 unidades
3. Vá para a página de finanças
4. Você deve ver uma receita automática de R$ 100.00 criada

---

## 📝 Estrutura de Arquivos Criados

```
src/
├── hooks/
│   └── useFinance.ts                 # Hook para operações financeiras
├── screens/
│   └── FinanceScreen.tsx             # Página principal de finanças
└── App.tsx                           # Atualizado com rota /app/finance

components/
└── layout/
    └── BottomNav.tsx                 # Atualizado com ícone de finanças

supabase/
└── migrations/
    └── 20260109_create_finance_module.sql  # Migration do banco de dados
```

---

## 🔧 Funcionalidades do Hook `useFinance`

```typescript
const {
  transactions,          // Array de todas as transações
  isLoading,            // Estado de carregamento
  businessId,           // ID do negócio
  addTransaction,       // Função para adicionar (mutate)
  updateTransaction,    // Função para atualizar
  deleteTransaction,    // Função para deletar
  calculateSummary,     // Calcula totais (receita, despesa, saldo)
  FINANCE_CATEGORIES,   // Categorias por tipo
  CATEGORY_LABELS       // Labels traduzidos
} = useFinance();
```

---

## 💡 Exemplo de Uso

### Registrar uma Receita Manual:
```typescript
await addTransaction.mutateAsync({
  finance_type: 'receita',
  category: 'vendas',
  amount: 150.50,
  description: 'Venda do Produto X',
  notes: 'Venda realizada em loja'
});
```

### Calcular Resumo:
```typescript
const summary = calculateSummary(transactions);
console.log(summary);
// {
//   totalRevenue: 1000,
//   totalExpense: 300,
//   balance: 700,
//   transactionCount: 15
// }
```

---

## 🎨 Visual e UX

- **Cores consistentes**: Verde para receitas, vermelho para despesas, azul para saldo
- **Icons intuitivos**: DollarSign, TrendingUp, TrendingDown
- **Mobile-first**: Totalmente responsivo
- **Filtros poderosos**: Combine múltiplos filtros simultaneamente
- **Animações suaves**: Transições consistentes com o design da app

---

## ⚠️ Considerações Importantes

### Quando uma receita é criada automaticamente:
1. ✅ Apenas quando há uma **saída de estoque** (venda)
2. ✅ Apenas se o produto **tiver preço > 0**
3. ✅ A receita fica **vinculada à movimentação** de estoque (pode ser rastreada)

### O que NÃO gera receita automática:
- ❌ Entradas de estoque (abastecimento)
- ❌ Devoluções ou ajustes manuais
- ✅ (Mas você pode registrar essas manualmente como "Devolução" ou outro tipo)

### Histórico de Transações:
- Todas as transações são **imutáveis** (não podem ser editadas)
- Você pode **deletar** se cometer um erro
- Cada transação tem **timestamp automático**

---

## 🔐 Segurança

- **RLS habilitado**: Seu banco está protegido
- **Validação no frontend**: Campos obrigatórios
- **Validação no backend**: Supabase valida tudo
- **Isolamento de dados**: Cada usuário vê apenas seus dados

---

## 📞 Suporte

Se encontrar problemas:

1. **Erro na sincronização**: Verifique se o produto tem preço configurado
2. **Transações não aparecem**: Verifique RLS e permissões no Supabase
3. **Erro ao salvar**: Verifique valores e campos obrigatórios

---

## 🎯 Melhorias Futuras (v2)

- [ ] Gráficos de receitas vs despesas (mensal/anual)
- [ ] Relatórios em PDF
- [ ] Integração com dados de estoque (análise de margem)
- [ ] Exportar histórico para CSV/Excel
- [ ] Previsões financeiras
- [ ] Categorização automática de despesas

---

**Módulo Financeiro v1.0 - Pronto para produção! 🚀**
