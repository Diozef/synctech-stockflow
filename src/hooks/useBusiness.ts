import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Business = Tables<'businesses'>;
export type Product = Tables<'products'>;
export type StockMovement = Tables<'stock_movements'>;
export type ProductVariation = Tables<'product_variations'>;
export type CustomSize = Tables<'custom_sizes'>;

export function useBusinessData() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customSizes, setCustomSizes] = useState<CustomSize[]>([]);
  const [loading, setLoading] = useState(true);

  // ====================================================
  // FETCH DATA
  // ====================================================

  const fetchBusiness = useCallback(async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching business:', error);
      return null;
    }
    
    setBusiness(data);
    return data;
  }, [user]);

  const fetchProducts = useCallback(async () => {
    if (!business) return [];
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    setProducts(data || []);
    return data || [];
  }, [business]);

  const fetchMovements = useCallback(async () => {
    if (!business) return [];
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, products!inner(business_id)')
      .eq('products.business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
    
    setMovements(data || []);
    return data || [];
  }, [business]);

  const fetchCustomSizes = useCallback(async () => {
    if (!business) return [];
    
    const { data, error } = await supabase
      .from('custom_sizes')
      .select('*')
      .eq('business_id', business.id);
    
    if (error) {
      console.error('Error fetching custom sizes:', error);
      return [];
    }
    
    setCustomSizes(data || []);
    return data || [];
  }, [business]);

  // ====================================================
  // BUSINESS ACTIONS
  // ====================================================

  const createBusiness = async (businessType: 'moda' | 'cosmeticos' | 'geral', businessName?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        business_type: businessType,
        business_name: businessName,
      })
      .select()
      .single();
    
    if (error) throw error;
    setBusiness(data);
    return data;
  };

  const updateBusiness = async (updates: TablesUpdate<'businesses'>) => {
    if (!business) throw new Error('No business found');
    
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', business.id)
      .select()
      .single();
    
    if (error) throw error;
    setBusiness(data);
    return data;
  };

  // ====================================================
  // PRODUCT ACTIONS
  // ====================================================

  const addProduct = async (product: Omit<TablesInsert<'products'>, 'business_id'>) => {
    if (!business) throw new Error('No business found');
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        business_id: business.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    setProducts(prev => [data, ...prev]);
    return data;
  };

  const updateProduct = async (id: string, updates: TablesUpdate<'products'>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setProducts(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ====================================================
  // MOVEMENT ACTIONS
  // ====================================================

  const addMovement = async (movement: Omit<TablesInsert<'stock_movements'>, 'id'>) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single();
    
    if (error) throw error;
    
    // Refresh products to get updated quantity
    await fetchProducts();
    setMovements(prev => [data, ...prev]);
    return data;
  };

  // ====================================================
  // CUSTOM SIZES ACTIONS
  // ====================================================

  const addCustomSize = async (sizeValue: string) => {
    if (!business) throw new Error('No business found');
    
    const { data, error } = await supabase
      .from('custom_sizes')
      .insert({
        business_id: business.id,
        size_value: sizeValue,
      })
      .select()
      .single();
    
    if (error) throw error;
    setCustomSizes(prev => [...prev, data]);
    return data;
  };

  const deleteCustomSize = async (id: string) => {
    const { error } = await supabase
      .from('custom_sizes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    setCustomSizes(prev => prev.filter(s => s.id !== id));
  };

  // ====================================================
  // EFFECTS
  // ====================================================

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchBusiness().finally(() => setLoading(false));
    } else {
      setBusiness(null);
      setProducts([]);
      setMovements([]);
      setCustomSizes([]);
      setLoading(false);
    }
  }, [user, fetchBusiness]);

  useEffect(() => {
    if (business) {
      fetchProducts();
      fetchMovements();
      fetchCustomSizes();
    }
  }, [business, fetchProducts, fetchMovements, fetchCustomSizes]);

  // ====================================================
  // COMPUTED VALUES
  // ====================================================

  const hasProducts = products.length > 0;
  const canChangeBusinessType = !hasProducts;

  return {
    // Data
    business,
    products,
    movements,
    customSizes,
    loading,
    
    // Computed
    hasProducts,
    canChangeBusinessType,
    businessType: business?.business_type || null,
    minStockAlert: business?.min_stock_alert || 5,
    
    // Actions
    createBusiness,
    updateBusiness,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    addCustomSize,
    deleteCustomSize,
    
    // Refresh
    refreshProducts: fetchProducts,
    refreshMovements: fetchMovements,
  };
}
