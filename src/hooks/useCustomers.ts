import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
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

  // Fetch customers
  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['customers', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers?business_id=eq.${business.id}&order=name.asc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      return (await response.json()) as Customer[];
    },
    enabled: !!business?.id
  });

  // Add customer
  const addCustomer = useMutation({
    mutationFn: async (input: { name: string; phone?: string; cpf?: string; notes?: string }) => {
      if (!business?.id) throw new Error('Business not found');
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers`,
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
      
      if (!response.ok) throw new Error('Failed to add customer');
      return (await response.json())[0] as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  // Update customer
  const updateCustomer = useMutation({
    mutationFn: async (input: { id: string; name: string; phone?: string; cpf?: string; notes?: string }) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers?id=eq.${input.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            name: input.name,
            phone: input.phone,
            cpf: input.cpf,
            notes: input.notes,
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to update customer');
      return (await response.json())[0] as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete customer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  return {
    customers,
    isLoading,
    businessId: business?.id,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch
  };
};
