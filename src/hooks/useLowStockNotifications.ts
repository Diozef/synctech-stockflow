import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LowStockNotification {
  id: string;
  business_id: string;
  product_id: string;
  current_quantity: number;
  min_quantity: number;
  is_read: boolean;
  created_at: string;
}

export const useLowStockNotifications = () => {
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

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['low_stock_notifications', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/low_stock_notifications?business_id=eq.${business.id}&is_read=eq.false&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return (await response.json()) as LowStockNotification[];
    },
    enabled: !!business?.id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/low_stock_notifications?id=eq.${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_read: true })
        }
      );
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low_stock_notifications'] });
    }
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!business?.id) return;
      
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/low_stock_notifications?business_id=eq.${business.id}&is_read=eq.false`,
        {
          method: 'PATCH',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_read: true })
        }
      );
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low_stock_notifications'] });
    }
  });

  return {
    notifications,
    unreadCount: notifications.length,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch
  };
};
