import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, addMonths } from 'date-fns';

export type PaymentType = 'avista' | 'parcelado';
export type InstallmentStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: string;
  business_id: string;
  customer_id: string | null;
  payment_type: PaymentType;
  total_amount: number;
  installments_count: number;
  first_due_date: string | null;
  has_down_payment: boolean;
  down_payment_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  sale_id: string;
  customer_id: string | null;
  business_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: InstallmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useSales = () => {
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

  // Fetch sales
  const { data: sales = [], isLoading: loadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['sales', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sales?business_id=eq.${business.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch sales');
      return (await response.json()) as Sale[];
    },
    enabled: !!business?.id
  });

  // Fetch installments (contas a receber)
  const { data: installments = [], isLoading: loadingInstallments, refetch: refetchInstallments } = useQuery({
    queryKey: ['installments', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/installments?business_id=eq.${business.id}&order=due_date.asc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch installments');
      return (await response.json()) as Installment[];
    },
    enabled: !!business?.id
  });

  // Create sale with items and installments
  const createSale = useMutation({
    mutationFn: async (input: {
      customer_id?: string;
      payment_type: PaymentType;
      items: SaleItem[];
      installments_count: number;
      first_due_date?: Date;
      has_down_payment: boolean;
      down_payment_amount?: number;
      notes?: string;
    }) => {
      if (!business?.id) throw new Error('Business not found');
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const headers = {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const totalAmount = input.items.reduce((sum, item) => sum + item.total_price, 0);

      // 1. Create sale
      const saleResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sales`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            business_id: business.id,
            customer_id: input.customer_id || null,
            payment_type: input.payment_type,
            total_amount: totalAmount,
            installments_count: input.installments_count,
            first_due_date: input.first_due_date?.toISOString().split('T')[0] || null,
            has_down_payment: input.has_down_payment,
            down_payment_amount: input.down_payment_amount || 0,
            notes: input.notes || null
          })
        }
      );

      if (!saleResponse.ok) {
        const errorText = await saleResponse.text();
        throw new Error(`Failed to create sale: ${errorText}`);
      }

      const [sale] = await saleResponse.json() as Sale[];

      // 2. Create sale items (trigger will deduct stock automatically)
      for (const item of input.items) {
        const itemResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sale_items`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sale_id: sale.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            })
          }
        );

        if (!itemResponse.ok) {
          const errorText = await itemResponse.text();
          throw new Error(`Failed to create sale item: ${errorText}`);
        }
      }

      // 3. Create installments
      const downPayment = input.has_down_payment ? (input.down_payment_amount || 0) : 0;
      const remainingAmount = totalAmount - downPayment;
      const installmentAmount = remainingAmount / input.installments_count;

      for (let i = 0; i < input.installments_count; i++) {
        const isFirstInstallment = i === 0;
        const isPaidDownPayment = isFirstInstallment && input.has_down_payment;
        
        // Calculate due date
        let dueDate: Date;
        if (isFirstInstallment && input.has_down_payment) {
          dueDate = new Date(); // Today for down payment
        } else if (input.first_due_date) {
          dueDate = addMonths(input.first_due_date, input.has_down_payment ? i - 1 : i);
        } else {
          dueDate = addMonths(new Date(), i + 1);
        }

        const amount = isFirstInstallment && input.has_down_payment 
          ? downPayment 
          : installmentAmount;

        const installmentResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/installments`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sale_id: sale.id,
              customer_id: input.customer_id || null,
              business_id: business.id,
              installment_number: i + 1,
              amount,
              due_date: dueDate.toISOString().split('T')[0],
              status: isPaidDownPayment ? 'pago' : 'pendente',
              paid_at: isPaidDownPayment ? new Date().toISOString() : null
            })
          }
        );

        if (!installmentResponse.ok) {
          const errorText = await installmentResponse.text();
          throw new Error(`Failed to create installment: ${errorText}`);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Mark installment as paid
  const markInstallmentPaid = useMutation({
    mutationFn: async (installmentId: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/installments?id=eq.${installmentId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: 'pago',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to update installment');
      return (await response.json())[0] as Installment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
    }
  });

  // Calculate summary
  const calculateInstallmentsSummary = () => {
    const pending = installments.filter(i => i.status === 'pendente');
    const overdue = installments.filter(i => i.status === 'atrasado');
    const paid = installments.filter(i => i.status === 'pago');

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, i) => sum + Number(i.amount), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, i) => sum + Number(i.amount), 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, i) => sum + Number(i.amount), 0),
      totalCount: installments.length,
      totalAmount: installments.reduce((sum, i) => sum + Number(i.amount), 0)
    };
  };

  return {
    sales,
    installments,
    loadingSales,
    loadingInstallments,
    businessId: business?.id,
    createSale,
    markInstallmentPaid,
    calculateInstallmentsSummary,
    refetchSales,
    refetchInstallments
  };
};
