import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FinanceType = 'receita' | 'despesa';
export type FinanceCategory = 'vendas' | 'devolucao' | 'aluguel' | 'energia' | 'agua' | 'internet' | 'folha_pagamento' | 'marketing' | 'manutencao' | 'outro';

export interface FinancialTransaction {
  id: string;
  business_id: string;
  finance_type: FinanceType;
  category: FinanceCategory;
  amount: number;
  description: string;
  notes?: string;
  stock_movement_id?: string;
  product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

const FINANCE_CATEGORIES: Record<FinanceType, FinanceCategory[]> = {
  receita: ['vendas', 'devolucao', 'outro'],
  despesa: ['aluguel', 'energia', 'agua', 'internet', 'folha_pagamento', 'marketing', 'manutencao', 'outro']
};

const CATEGORY_LABELS: Record<FinanceCategory, string> = {
  vendas: 'Vendas',
  devolucao: 'Devolução',
  aluguel: 'Aluguel',
  energia: 'Energia',
  agua: 'Água',
  internet: 'Internet',
  folha_pagamento: 'Folha de Pagamento',
  marketing: 'Marketing',
  manutencao: 'Manutenção',
  outro: 'Outro'
};

export const useFinance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch business ID
  const { data: business } = useQuery({
    queryKey: ['business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  // Fetch financial transactions
  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial_transactions', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as FinancialTransaction[];
    },
    enabled: !!business?.id
  });

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async (input: {
      finance_type: FinanceType;
      category: FinanceCategory;
      amount: number;
      description: string;
      notes?: string;
    }) => {
      if (!business?.id) throw new Error('Business not found');
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([
          {
            business_id: business.id,
            ...input
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
    }
  });

  // Update transaction mutation
  const updateTransaction = useMutation({
    mutationFn: async (input: {
      id: string;
      finance_type: FinanceType;
      category: FinanceCategory;
      amount: number;
      description: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update({
          finance_type: input.finance_type,
          category: input.category,
          amount: input.amount,
          description: input.description,
          notes: input.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
    }
  });

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
    }
  });

  // Calculate financial summary
  const calculateSummary = (txns: FinancialTransaction[]): FinancialSummary => {
    const totalRevenue = txns
      .filter(t => t.finance_type === 'receita')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = txns
      .filter(t => t.finance_type === 'despesa')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense,
      transactionCount: txns.length
    };
  };

  return {
    transactions,
    isLoading,
    error,
    businessId: business?.id,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    calculateSummary,
    refetch,
    FINANCE_CATEGORIES,
    CATEGORY_LABELS
  };
};
