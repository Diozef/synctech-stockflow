import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useFinance, FinanceType, FinanceCategory } from '@/hooks/useFinance';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessData } from '@/hooks/useBusiness';
import { 
  Plus, 
  X, 
  DollarSign, 
  Loader2, 
  Filter,
  Search,
  Trash2,
  ChevronLeft,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ====================================================
// MÓDULO: TELA 06 — FINANÇAS (RECEITAS E DESPESAS)
// ====================================================

export function FinanceScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { business } = useBusinessData();
  const {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    calculateSummary,
    FINANCE_CATEGORIES,
    CATEGORY_LABELS
  } = useFinance();

  // Form state
  const [activeTab, setActiveTab] = useState<string>('register');
  const [financeType, setFinanceType] = useState<FinanceType>('receita');
  const [category, setCategory] = useState<FinanceCategory>('vendas');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | FinanceCategory>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction.mutateAsync({
        finance_type: financeType,
        category,
        amount: parseFloat(amount),
        description,
        notes: notes || undefined
      });

      toast({
        title: 'Sucesso',
        description: 'Transação registrada com sucesso'
      });

      // Reset form
      setAmount('');
      setDescription('');
      setNotes('');
      setCategory(financeType === 'receita' ? 'vendas' : 'aluguel');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao registrar transação',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) return;

    try {
      await deleteTransaction.mutateAsync(id);
      toast({
        title: 'Sucesso',
        description: 'Transação deletada com sucesso'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar transação',
        variant: 'destructive'
      });
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (filterType !== 'all' && txn.finance_type !== filterType) return false;
      if (filterCategory !== 'all' && txn.category !== filterCategory) return false;

      if (filterDateFrom || filterDateTo) {
        const txnDate = new Date(txn.created_at);
        if (filterDateFrom && txnDate < startOfDay(new Date(filterDateFrom))) return false;
        if (filterDateTo && txnDate > endOfDay(new Date(filterDateTo))) return false;
      }

      if (searchQuery && !txn.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, filterDateFrom, filterDateTo, searchQuery]);

  const summary = calculateSummary(filteredTransactions);

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const handleFinanceTypeChange = (type: FinanceType) => {
    setFinanceType(type);
    const defaultCategory = FINANCE_CATEGORIES[type][0];
    setCategory(defaultCategory);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app/dashboard')} className="p-2">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Finanças
            </h1>
          </div>
          <p className="text-muted-foreground">Gerencie receitas e despesas</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {summary.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {summary.totalExpense.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-2", summary.balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                  <p className={cn("text-2xl font-bold", summary.balance >= 0 ? "text-blue-600" : "text-orange-600")}>
                    R$ {summary.balance.toFixed(2)}
                  </p>
                </div>
                <DollarSign className={cn("h-8 w-8 opacity-50", summary.balance >= 0 ? "text-blue-600" : "text-orange-600")} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register">Registrar</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nova Transação</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  {/* Finance Type Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={financeType === 'receita' ? 'default' : 'outline'}
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleFinanceTypeChange('receita')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Receita
                    </Button>
                    <Button
                      type="button"
                      variant={financeType === 'despesa' ? 'default' : 'outline'}
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleFinanceTypeChange('despesa')}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Despesa
                    </Button>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as FinanceCategory)}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FINANCE_CATEGORIES[financeType].map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Venda do produto X"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionais..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !amount || !description}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Registrar Transação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar descrição</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-type">Tipo</Label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger id="filter-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-category">Categoria</Label>
                  <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                    <SelectTrigger id="filter-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">De</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">Até</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Histórico de Transações ({filteredTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{txn.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {CATEGORY_LABELS[txn.category]} • {format(new Date(txn.created_at), 'dd MMM yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-bold text-lg",
                            txn.finance_type === 'receita' ? "text-green-600" : "text-red-600"
                          )}>
                            {txn.finance_type === 'receita' ? '+' : '-'} R$ {Number(txn.amount).toFixed(2)}
                          </div>
                          <button
                            onClick={() => handleDeleteTransaction(txn.id)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
