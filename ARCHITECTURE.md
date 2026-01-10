# 🏗️ Arquitetura do Módulo Financeiro

## 📐 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                        STOCKFLOW FINANCE                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Dashboard      │
                    │  Resumo Fin.     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Finance Screen  │
                    │   FinanceScreen  │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌─────▼─────┐    ┌────▼──────┐
      │ Form Tab  │    │ History   │    │  Filters  │
      │ Registro  │    │   Tab     │    │  Busca    │
      └─────┬─────┘    └─────┬─────┘    └────┬──────┘
            │                │               │
      ┌─────▼─────────────────▼───────────────▼─────┐
      │         useFinance Hook (React Query)       │
      │  ┌──────────────┐        ┌────────────────┐ │
      │  │  Mutations   │        │    Queries     │ │
      │  │  - add       │        │  - fetch list  │ │
      │  │  - update    │        │  - calculate   │ │
      │  │  - delete    │        │  - summary     │ │
      │  └──────────────┘        └────────────────┘ │
      └─────┬──────────────────────────────────────┘
            │
      ┌─────▼─────────────────────────┐
      │   Supabase Client (Rest API)  │
      │  financial_transactions table │
      └─────┬───────────────────────┬─┘
            │                       │
      ┌─────▼──────────┐    ┌──────▼───────┐
      │  INSERTS/UPS   │    │  SELECT/GET  │
      └─────┬──────────┘    └──────┬───────┘
            │                      │
      ┌─────▼──────────────────────▼──────┐
      │   Banco de Dados (PostgreSQL)     │
      │                                   │
      │  ┌─────────────────────────────┐  │
      │  │ financial_transactions      │  │
      │  │  id (UUID)                  │  │
      │  │  business_id (UUID FK)      │  │
      │  │  finance_type (enum)        │  │
      │  │  category (enum)            │  │
      │  │  amount (decimal)           │  │
      │  │  description (text)         │  │
      │  │  stock_movement_id (FK)  ◄─┼──┼─┐
      │  │  product_id (FK)         ◄─┼──┼─┤
      │  │  created_at               │  │  │
      │  │  updated_at               │  │  │
      │  └─────────────────────────────┘  │
      │                                   │
      │  ┌─────────────────────────────┐  │
      │  │ stock_movements (EXISTING)  │  │
      │  │  id (UUID)                  │  │
      │  │  product_id (UUID FK)    ───┼──┘
      │  │  movement_type             │
      │  │  quantity                  │
      │  └─────────────────────────────┘  │
      │                                   │
      │  ┌─────────────────────────────┐  │
      │  │ products (EXISTING)         │  │
      │  │  id (UUID)                  │  │
      │  │  price (decimal)            │  │
      │  └─────────────────────────────┘  │
      │                                   │
      │  ┌─────────────────────────────┐  │
      │  │ Triggers & Functions        │  │
      │  │ - on_stock_exit_create_     │  │
      │  │   revenue()                 │  │
      │  └─────────────────────────────┘  │
      └───────────────────────────────────┘
```

---

## 🔄 Fluxo de Sincronização Automática (Estoque → Financeiro)

```
┌─────────────────────────────────────┐
│   MovementsScreen - Registra Saída  │
│   (Venda de Produto)                │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  addMovement() │
        │   (Hook)       │
        └────────┬───────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ INSERT stock_movements     │
    │ - product_id              │
    │ - movement_type: 'saida'  │
    │ - quantity: X             │
    │ - Timestamp               │
    └────────┬───────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────┐
    │ TRIGGER: on_stock_exit_create_revenue() │
    │ (Executa automaticamente após INSERT)    │
    └────────┬────────────────────────────────┘
             │
             ├─ Se movimento_type = 'saida'? SIM
             │
             ├─ Buscar info do produto
             │  (product_id, price, business_id)
             │
             ├─ Se price > 0? SIM
             │
             └─▶ ┌─────────────────────────────┐
                 │ INSERT financial_            │
                 │ transactions                │
                 │ - business_id: [do produto] │
                 │ - finance_type: 'receita'   │
                 │ - category: 'vendas'        │
                 │ - amount: price × quantity  │
                 │ - stock_movement_id: [link]│
                 │ - product_id: [link]        │
                 │ - Timestamp                 │
                 └──────────┬──────────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Receita Criada          │
                 │ (Visível no Frontend)   │
                 └─────────────────────────┘
```

---

## 📦 Estrutura de Componentes

### Frontend (React)

```
FinanceScreen
├── Header (Finanças + chevron voltar)
├── Seção de Resumo
│   ├── Card Receitas (R$ + ícone trending up)
│   ├── Card Despesas (R$ + ícone trending down)
│   └── Card Saldo (R$ + condição positivo/negativo)
├── Tabs
│   ├── Tab "Registrar"
│   │   └── Formulário
│   │       ├── Radio Receita/Despesa
│   │       ├── Select Categoria (dinâmico)
│   │       ├── Input Valor
│   │       ├── Input Descrição
│   │       ├── Textarea Observações
│   │       └── Button Enviar
│   │
│   └── Tab "Histórico"
│       ├── Filtros
│       │   ├── Search Descrição
│       │   ├── Select Tipo
│       │   ├── Select Categoria
│       │   ├── Date Range
│       │   └── Button Limpar
│       │
│       └── Transações List
│           ├── Item Transação
│           │   ├── Descrição + Categoria + Data
│           │   ├── Valor (cor dinâmica)
│           │   └── Button Deletar
│           └── Empty State
└── BottomNav (com icon Finanças)
```

### Backend (Supabase)

```
Database (PostgreSQL)
├── Tables
│   ├── financial_transactions (NEW)
│   │   ├── Columns (11 total)
│   │   ├── Indexes (5)
│   │   ├── RLS Policies (4)
│   │   └── Trigger
│   │
│   ├── stock_movements (EXISTING - modificado)
│   │   └── Novo Trigger (create_revenue_on_stock_exit)
│   │
│   ├── products (EXISTING)
│   │   └── Usado em joins
│   │
│   └── businesses (EXISTING)
│       └── Usado em RLS
│
├── Enums (Types)
│   ├── finance_type (receita | despesa)
│   ├── finance_category (9 valores)
│   └── Reutiliza movement_type, business_type
│
├── Functions
│   ├── update_updated_at_column() (EXISTING)
│   └── create_revenue_on_stock_exit() (NEW)
│
├── Triggers
│   ├── update_financial_transactions_updated_at (NEW)
│   └── on_stock_exit_create_revenue (NEW)
│
└── RLS Policies
    ├── SELECT - Users can view own (NEW)
    ├── INSERT - Users can create own (NEW)
    ├── UPDATE - Users can update own (NEW)
    └── DELETE - Users can delete own (NEW)
```

---

## 🔐 Segurança (RLS - Row Level Security)

```
┌─────────────────────────────────────────────┐
│   User A (auth.uid() = ABC123)              │
│   Business (business_id = BIZ_A)            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ Tenta acessar financial_transactions │
    └──────────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │ RLS Policy: SELECT               │
        │                                  │
        │ business_id IN (               │
        │   SELECT id FROM businesses    │
        │   WHERE user_id = auth.uid()   │
        │ )                               │
        │                                  │
        │ Resultado: Retorna apenas dados │
        │ da BIZ_A                         │
        └──────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ User B NÃO consegue ver:            │
    │ ✅ Dados de User A                  │
    │ ✅ Transações de BIZ_A              │
    │                                      │
    │ User B SÓ consegue ver:             │
    │ ✅ Seus próprios dados              │
    │ ✅ Suas próprias transações         │
    └──────────────────────────────────────┘
```

---

## 📊 Modelo de Dados

### Tabela: financial_transactions

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `business_id` | UUID | FK → businesses, NOT NULL | Qual negócio |
| `finance_type` | finance_type | ENUM, NOT NULL | receita \| despesa |
| `category` | finance_category | ENUM, NOT NULL | Tipo específico |
| `amount` | DECIMAL(12,2) | NOT NULL | Valor em reais |
| `description` | TEXT | NOT NULL | Descrição curta |
| `notes` | TEXT | NULLABLE | Notas extras |
| `stock_movement_id` | UUID | FK → stock_movements | Vinculação (opcional) |
| `product_id` | UUID | FK → products | Qual produto (opcional) |
| `created_at` | TIMESTAMP | DEFAULT now() | Quando foi criado |
| `updated_at` | TIMESTAMP | DEFAULT now() | Última atualização |

### Indexes
- `idx_financial_transactions_business` - Por negócio
- `idx_financial_transactions_type` - Por tipo (receita/despesa)
- `idx_financial_transactions_category` - Por categoria
- `idx_financial_transactions_created` - Por data (DESC)
- `idx_financial_transactions_stock_movement` - Por movimento de estoque

---

## 🔗 Relacionamentos

```
financial_transactions
├── business_id (1:N) → businesses.id
├── product_id (M:1) → products.id
└── stock_movement_id (1:1) → stock_movements.id

stock_movements
├── product_id (M:1) → products.id
└── [Novo] Trigger para criar financial_transaction

products
├── business_id (M:1) → businesses.id
└── [Usado em] financial_transactions (price)

businesses
└── user_id (1:1) → auth.users.id
```

---

## 🚀 Performance

### Otimizações Implementadas

1. **Índices**: 5 índices cobrindo principais queries
2. **RLS Otimizado**: Policy simples (subquery em IN)
3. **React Query**: Caching automático
4. **Lazy Loading**: Histórico carrega conforme scroll
5. **Memoization**: useMemo para filtros

### Complexidade Esperada

- **List All Transactions**: O(log N) - Index
- **Filter by Type**: O(log N) - Index
- **Calculate Summary**: O(N) - Sum agregation
- **Create Transaction**: O(1) - Insert + Trigger
- **Delete Transaction**: O(1) - Delete by ID

---

## 🛠️ Stack Tecnológico

```
Frontend
├── React 18.3.1
├── TypeScript
├── React Router v6
├── React Query (TanStack)
├── Tailwind CSS
├── Shadcn UI
└── Lucide Icons

Backend
├── Supabase (PostgreSQL)
├── Row Level Security (RLS)
├── PostgreSQL Triggers
├── PostgreSQL Functions
└── RESTful API

Infraestrutura
├── Vite
├── ESLint
├── Bun
└── Docker (Supabase)
```

---

## 📈 Escalabilidade Futura

Para escalar o módulo:

1. **Particionamento**: `financial_transactions` por `created_at`
2. **Agregação**: Tabela materializada de resumos diários
3. **Cache**: Redis para resumos frequentes
4. **Relatórios**: Views pré-computadas
5. **Analytics**: Integração com ferramentas BI
6. **Webhooks**: Notificações em tempo real
7. **Exports**: CSV, PDF, Excel

---

## 📝 Documentação Complementar

- [FINANCE_MODULE_README.md](./FINANCE_MODULE_README.md) - Guia de uso
- [FINANCE_SQL_QUERIES.md](./FINANCE_SQL_QUERIES.md) - Queries úteis
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testes

---

**Arquitetura v1.0 - Pronta para Escalar! 🚀**
