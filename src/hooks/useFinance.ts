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
  description: string | null;
  notes?: string | null;
  stock_movement_id?: string | null;
  product_id?: string | null;
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

  // Fetch financial transactions - using direct REST API since table is new and types not yet generated
  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial_transactions', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      
      const session = await supabase.auth.getSession();
      
      // Direct fetch from the table using explicit typing
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/financial_transactions?business_id=eq.${business.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial transactions');
      }
      
      const result = await response.json();
      return (result || []) as FinancialTransaction[];
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
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/financial_transactions`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            business_id: business.id,
            ...input
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }
      
      const result = await response.json();
      return result[0] as FinancialTransaction;
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
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/financial_transactions?id=eq.${input.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            finance_type: input.finance_type,
            category: input.category,
            amount: input.amount,
            description: input.description,
            notes: input.notes,
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }
      
      const result = await response.json();
      return result[0] as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
    }
  });

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/financial_transactions?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
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
