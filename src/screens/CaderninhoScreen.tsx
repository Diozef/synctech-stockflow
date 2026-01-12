import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSales, Installment } from '@/hooks/useSales';
import { useCustomers } from '@/hooks/useCustomers';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isFuture, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen,
  Plus,
  Search,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CaderninhoScreen() {
  const navigate = useNavigate();
  const { installments, loadingInstallments, markInstallmentPaid, calculateInstallmentsSummary } = useSales();
  const { customers } = useCustomers();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('all');
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);

  // Get customer name by ID
  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'Cliente não informado';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Cliente removido';
  };

  // Filter installments
  const filteredInstallments = useMemo(() => {
    let filtered = installments;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(i => i.status === 'pendente' || i.status === 'atrasado');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(i => i.status === 'pago');
    }

    // Filter by customer
    if (filterCustomerId !== 'all') {
      filtered = filtered.filter(i => i.customer_id === filterCustomerId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const customerName = getCustomerName(i.customer_id).toLowerCase();
        return customerName.includes(query);
      });
    }

    return filtered;
  }, [installments, activeTab, filterCustomerId, searchQuery, customers]);

  // Summary
  const summary = useMemo(() => calculateInstallmentsSummary(), [installments]);

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!confirmPayId) return;
    
    try {
      await markInstallmentPaid.mutateAsync(confirmPayId);
      toast({ title: 'Pagamento confirmado!' });
    } catch (error) {
      toast({ title: 'Erro ao confirmar pagamento', variant: 'destructive' });
    }
    setConfirmPayId(null);
  };

  // Get status badge
  const getStatusBadge = (installment: Installment) => {
    const dueDate = new Date(installment.due_date);
    
    if (installment.status === 'pago') {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    }

    if (installment.status === 'atrasado' || isPast(dueDate)) {
      const daysOverdue = differenceInDays(new Date(), dueDate);
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysOverdue}d atrasado
        </Badge>
      );
    }

    if (isToday(dueDate)) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          <Clock className="w-3 h-3 mr-1" />
          Vence hoje
        </Badge>
      );
    }

    const daysUntilDue = differenceInDays(dueDate, new Date());
    if (daysUntilDue <= 7) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntilDue}d restantes
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Calendar className="w-3 h-3 mr-1" />
        {format(dueDate, "dd/MM", { locale: ptBR })}
      </Badge>
    );
  };

  if (loadingInstallments) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Caderninho</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas contas a receber
            </p>
          </div>
          <Button 
            variant="hero" 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={() => navigate('/app/caderninho/nova-venda')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atrasados</p>
                <p className="text-lg font-bold text-destructive">
                  R$ {summary.overdueAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.overdueCount} parcela(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-warning">
                  R$ {summary.pendingAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.pendingCount} parcela(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total a Receber</p>
                  <p className="text-xl font-bold text-success">
                    R$ {(summary.pendingAmount + summary.overdueAmount).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-lg font-bold text-success">
                  R$ {summary.paidAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendentes
            {(summary.pendingCount + summary.overdueCount) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {summary.pendingCount + summary.overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Pagas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
          <SelectTrigger className="h-10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Installments List */}
      <div className="space-y-3 pb-24">
        {filteredInstallments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">
                {activeTab === 'pending' 
                  ? 'Nenhuma parcela pendente'
                  : 'Nenhuma parcela paga'
                }
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {activeTab === 'pending'
                  ? 'Registre vendas parceladas para acompanhar aqui'
                  : 'As parcelas pagas aparecerão aqui'
                }
              </p>
              {activeTab === 'pending' && (
                <Button onClick={() => navigate('/app/caderninho/nova-venda')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Venda
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInstallments.map((installment) => (
            <Card 
              key={installment.id} 
              className={cn(
                "transition-all",
                installment.status === 'atrasado' && "border-destructive/50 bg-destructive/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {getCustomerName(installment.customer_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {installment.installment_number}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(installment)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold">
                      R$ {Number(installment.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {installment.status === 'pago' ? 'Pago em' : 'Vencimento'}
                    </p>
                    <p className="text-sm font-medium">
                      {installment.status === 'pago' && installment.paid_at
                        ? format(new Date(installment.paid_at), "dd/MM/yyyy", { locale: ptBR })
                        : format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })
                      }
                    </p>
                  </div>
                </div>

                {installment.status !== 'pago' && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setConfirmPayId(installment.id)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Dar Baixa
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Shortcuts */}
      <div className="fixed bottom-20 left-4 right-4 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate('/app/customers')}
        >
          <User className="w-4 h-4 mr-2" />
          Clientes
        </Button>
      </div>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={!!confirmPayId} onOpenChange={() => setConfirmPayId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja dar baixa nesta parcela? Esta ação registrará o pagamento com a data de hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </MobileLayout>
  );
}
