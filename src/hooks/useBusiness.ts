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

  // Force refresh wrapper that ensures loading state updates and logs
  const refreshBusiness = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBusiness();
      console.log('refreshBusiness: fetched', data ? '1 business' : 'no business');
      return data;
    } finally {
      setLoading(false);
    }
  }, [fetchBusiness]);

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
    
    console.log('Creating business with type:', businessType, 'for user:', user.id);
    // If a business already exists for this user, update it instead of inserting
    const { data: existing, error: fetchErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error checking existing business:', fetchErr);
      throw fetchErr;
    }

    if (existing) {
      console.log('Business already exists for user, updating type to:', businessType);
      const { data, error } = await supabase
        .from('businesses')
        .update({ business_type: businessType, business_name: businessName })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating existing business:', error);
        throw error;
      }

      console.log('Business updated successfully:', data);
      setBusiness(data);
      return data;
    }

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        business_type: businessType,
        business_name: businessName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business:', error);
      throw error;
    }

    console.log('Business created successfully:', data);
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

    // Se o produto foi cadastrado com saldo inicial (> 0), registrar uma movimentação de entrada
    try {
      if (data && data.quantity && data.quantity > 0) {
        const { data: movementData, error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: data.id,
            movement_type: 'entrada',
            quantity: data.quantity,
            observation: 'Saldo inicial ao cadastrar produto',
          })
          .select()
          .single();

        if (movementError) {
          console.error('Error creating initial stock movement:', movementError);
        } else if (movementData) {
          setMovements(prev => [movementData, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error creating initial stock movement:', err);
    }

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
    // Refetch para garantir que hasProducts seja atualizado corretamente
    const remaining = await fetchProducts();
    // Se não há mais produtos, refresh business para atualizar canChangeBusinessType
    if (remaining && remaining.length === 0) {
      console.log('Todos os produtos removidos — atualizando estado do negócio');
      await refreshBusiness();
    }
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

  const deleteBusiness = async () => {
    if (!business) throw new Error('No business found');
    
    console.log('Deleting business:', business.id, 'type:', business.business_type);
    
    // 1. First, get all products for this business to find associated movements
    const { data: businessProducts, error: productsGetError } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', business.id);
    
    console.log('Found products to delete:', businessProducts?.length || 0);
    
    if (productsGetError) {
      console.error('Error fetching products for deletion:', productsGetError);
    }
    
    // 2. Delete all stock movements for these products
    if (businessProducts && businessProducts.length > 0) {
      const productIds = businessProducts.map(p => p.id);
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .delete()
        .in('product_id', productIds);
      
      if (movementsError) {
        console.error('Error deleting stock movements:', movementsError);
      } else {
        console.log('Stock movements deleted successfully');
      }
    }
    
    // 3. Delete all products associated with this business
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .eq('business_id', business.id);
    
    if (productsError) {
      console.error('Error deleting products:', productsError);
      throw productsError;
    } else {
      console.log('Products deleted successfully');
    }
    
    // 4. Delete custom sizes
    const { error: sizesError } = await supabase
      .from('custom_sizes')
      .delete()
      .eq('business_id', business.id);
    
    if (sizesError) {
      console.error('Error deleting custom sizes:', sizesError);
    } else {
      console.log('Custom sizes deleted successfully');
    }
    
    // 5. Finally, delete the business itself
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', business.id);
    
    if (error) {
      console.error('Error deleting business:', error);
      throw error;
    } else {
      console.log('Business deleted successfully');
    }
    
    // Clear local state
    setBusiness(null);
    setProducts([]);
    setMovements([]);
    setCustomSizes([]);
  };

  // ====================================================
  // RESET ALL BUSINESSES FOR CURRENT USER (TEMPORARY, DESTRUCTIVE)
  // ====================================================
  const resetBusinessesForUser = async () => {
    if (!user) throw new Error('No user found');

    console.log('resetBusinessesForUser: iniciando para user', user.id);

    // 1. Find all businesses for this user
    const { data: userBusinesses, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id);

    if (bizError) {
      console.error('Erro ao buscar businesses do usuário:', bizError);
      throw bizError;
    }

    const businessIds: string[] = (userBusinesses || []).map(b => b.id);
    console.log('resetBusinessesForUser: found', businessIds.length, 'business(es)');

    if (businessIds.length === 0) {
      // Nothing to do
      setBusiness(null);
      setProducts([]);
      setMovements([]);
      setCustomSizes([]);
      return;
    }

    // 2. For each business, delete stock_movements -> products -> custom_sizes -> business
    // Delete stock_movements for products belonging to these businesses
    const { data: productsForBiz, error: prodFetchErr } = await supabase
      .from('products')
      .select('id,business_id')
      .in('business_id', businessIds);

    if (prodFetchErr) {
      console.error('Erro ao buscar produtos para reset:', prodFetchErr);
    }

    const productIds = (productsForBiz || []).map(p => p.id);
    if (productIds.length > 0) {
      const { error: movementsErr } = await supabase
        .from('stock_movements')
        .delete()
        .in('product_id', productIds);
      if (movementsErr) console.error('Erro deletando stock_movements durante reset:', movementsErr);
      else console.log('Stock movements deletados durante reset');
    }

    // Delete products
    const { error: productsDeleteErr } = await supabase
      .from('products')
      .delete()
      .in('business_id', businessIds);
    if (productsDeleteErr) console.error('Erro deletando produtos durante reset:', productsDeleteErr);
    else console.log('Produtos deletados durante reset');

    // Delete custom sizes
    const { error: sizesErr } = await supabase
      .from('custom_sizes')
      .delete()
      .in('business_id', businessIds);
    if (sizesErr) console.error('Erro deletando custom sizes durante reset:', sizesErr);
    else console.log('Custom sizes deletados durante reset');

    // Delete businesses
    const { error: bizDeleteErr } = await supabase
      .from('businesses')
      .delete()
      .in('id', businessIds);
    if (bizDeleteErr) {
      console.error('Erro deletando businesses durante reset:', bizDeleteErr);
      throw bizDeleteErr;
    }

    console.log('resetBusinessesForUser: concluido');

    // Clear local state
    setBusiness(null);
    setProducts([]);
    setMovements([]);
    setCustomSizes([]);
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
    deleteBusiness,
    
    // Refresh
    refreshProducts: fetchProducts,
    refreshMovements: fetchMovements,
    refreshBusiness: refreshBusiness,
    // Temporary destructive action
    resetBusinessesForUser,
  };
}
