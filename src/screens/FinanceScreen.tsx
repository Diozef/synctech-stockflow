import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useFinance, FinanceType, FinanceCategory } from '@/hooks/useFinance';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';
import { 
  Plus,
  X, 
  DollarSign, 
  Loader2, 
  Filter,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  Wallet,
  PiggyBank,
  Receipt
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { business, businessType, products } = useBusinessData();
  const config = getNicheConfig(businessType);
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate manual inputs (vendas não são criadas a partir daqui)
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
        title: 'Sucesso!',
        description: financeType === 'receita' ? 'Receita registrada' : 'Despesa registrada'
      });

      // Reset form
      setAmount('');
      setDescription('');
      setNotes('');
      setCategory(financeType === 'receita' ? FINANCE_CATEGORIES.receita[0] : FINANCE_CATEGORIES.despesa[0]);

    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao registrar transação',
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
        description: 'Transação deletada'
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

      if (searchQuery && !txn.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
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

  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || filterDateFrom || filterDateTo || searchQuery;

  const handleFinanceTypeChange = (type: FinanceType) => {
    setFinanceType(type);
    const defaultCategory = FINANCE_CATEGORIES[type][0];
    setCategory(defaultCategory);
    setSelectedProductId('');
    setSaleQuantity(1);
    setAmount('');
    setDescription('');
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
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Finanças</h1>
              <p className="text-sm text-muted-foreground">Controle suas receitas e despesas</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Receitas</p>
                <p className="text-lg font-bold text-emerald-600">
                  R$ {summary.totalRevenue.toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-rose-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                <p className="text-lg font-bold text-rose-600">
                  R$ {summary.totalExpense.toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-2",
            summary.balance >= 0 
              ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50" 
              : "bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/50"
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                  summary.balance >= 0 ? "bg-blue-500/20" : "bg-orange-500/20"
                )}>
                  <PiggyBank className={cn("h-5 w-5", summary.balance >= 0 ? "text-blue-600" : "text-orange-600")} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                <p className={cn("text-lg font-bold", summary.balance >= 0 ? "text-blue-600" : "text-orange-600")}>
                  R$ {summary.balance.toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="register" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plus className="w-4 h-4" />
              Registrar
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Register Tab */}
          <TabsContent value="register" className="mt-6 space-y-6">
            {/* Finance Type Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={financeType === 'receita' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "h-16 flex-col gap-1 transition-all",
                  financeType === 'receita' && "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25"
                )}
                onClick={() => handleFinanceTypeChange('receita')}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm font-medium">Receita</span>
              </Button>
              <Button
                type="button"
                variant={financeType === 'despesa' ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  "h-16 flex-col gap-1 transition-all",
                  financeType === 'despesa' && "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/25"
                )}
                onClick={() => handleFinanceTypeChange('despesa')}
              >
                <TrendingDown className="w-6 h-6" />
                <span className="text-sm font-medium">Despesa</span>
              </Button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select 
                  value={category} 
                  onValueChange={(value) => {
                    setCategory(value as FinanceCategory);
                  }}
                >
                  <SelectTrigger className="h-12">
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

              {/* Manual Amount/Description */}
                <>
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 pl-12 text-lg font-semibold"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Descrição *</Label>
                    <Input
                      placeholder="Ex: Pagamento de conta de luz"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-12"
                      disabled={isSubmitting}
                    />
                  </div>
                </>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observações (opcional)</Label>
                <Textarea
                  placeholder="Notas adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "w-full h-14 text-base font-semibold transition-all",
                  financeType === 'receita' 
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25" 
                    : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/25"
                )}
                disabled={isSubmitting || (!amount || !description)}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Registrar {financeType === 'receita' ? 'Receita' : 'Despesa'}
              </Button>
            </form>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="w-4 h-4" />
                  Filtros
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Type Filter */}
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Categoria" />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
              <span>{filteredTransactions.length} transações encontradas</span>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Nenhuma transação</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters ? 'Nenhuma transação corresponde aos filtros' : 'Comece registrando sua primeira transação'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((txn) => (
                  <Card 
                    key={txn.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      txn.finance_type === 'receita' 
                        ? "border-l-4 border-l-emerald-500" 
                        : "border-l-4 border-l-rose-500"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            txn.finance_type === 'receita' 
                              ? "bg-emerald-100 dark:bg-emerald-900/30" 
                              : "bg-rose-100 dark:bg-rose-900/30"
                          )}>
                            {txn.finance_type === 'receita' ? (
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-rose-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{txn.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {CATEGORY_LABELS[txn.category]} • {format(new Date(txn.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn(
                            "font-bold text-base",
                            txn.finance_type === 'receita' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {txn.finance_type === 'receita' ? '+' : '-'} R$ {txn.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTransaction(txn.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
