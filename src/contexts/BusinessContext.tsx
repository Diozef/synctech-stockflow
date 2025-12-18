import React, { createContext, useContext, useState, ReactNode } from 'react';

// ====================================================
// TYPES - Definição de tipos para o sistema
// ====================================================

export type BusinessType = 'moda' | 'cosmeticos' | 'geral' | null;

export interface Product {
  id: string;
  name: string;
  photo?: string;
  quantity: number;
  price: number;
  // Campos condicionais por nicho
  size?: string;
  color?: string;
  brand?: string;
  expirationDate?: Date;
  variations?: Array<{ size: string; color: string; quantity: number }>;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  observation?: string;
  date: Date;
}

interface BusinessContextType {
  // States globais obrigatórios
  businessType: BusinessType;
  hasProducts: boolean;
  
  // Dados mockados
  products: Product[];
  movements: StockMovement[];
  
  // Configurações
  minStockAlert: number;
  
  // Actions
  setBusinessType: (type: BusinessType) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => void;
  setMinStockAlert: (value: number) => void;
  canChangeBusinessType: () => boolean;
}

// ====================================================
// CONTEXT
// ====================================================

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// ====================================================
// PROVIDER
// ====================================================

export function BusinessProvider({ children }: { children: ReactNode }) {
  // States globais obrigatórios conforme especificação
  const [businessType, setBusinessTypeState] = useState<BusinessType>(null);
  const [hasProducts, setHasProducts] = useState(false);
  
  // Dados mockados
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  // Configurações
  const [minStockAlert, setMinStockAlert] = useState(5);

  // ====================================================
  // REGRA CRÍTICA: Troca de nicho
  // ====================================================
  const canChangeBusinessType = () => {
    return !hasProducts;
  };

  const setBusinessType = (type: BusinessType) => {
    if (canChangeBusinessType()) {
      setBusinessTypeState(type);
    }
  };

  // ====================================================
  // CRUD de produtos (mockado)
  // ====================================================
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
    };
    setProducts(prev => [...prev, newProduct]);
    setHasProducts(true); // Bloqueia troca de nicho após primeiro cadastro
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    // Nota: has_products permanece true mesmo após deletar todos
    // Isso é intencional para manter consistência
  };

  // ====================================================
  // Movimentações de estoque
  // ====================================================
  const addMovement = (movement: Omit<StockMovement, 'id' | 'date'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `movement-${Date.now()}`,
      date: new Date(),
    };
    setMovements(prev => [...prev, newMovement]);
    
    // Atualiza quantidade do produto
    const product = products.find(p => p.id === movement.productId);
    if (product) {
      const newQuantity = movement.type === 'entrada' 
        ? product.quantity + movement.quantity
        : product.quantity - movement.quantity;
      updateProduct(movement.productId, { quantity: Math.max(0, newQuantity) });
    }
  };

  return (
    <BusinessContext.Provider value={{
      businessType,
      hasProducts,
      products,
      movements,
      minStockAlert,
      setBusinessType,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      setMinStockAlert,
      canChangeBusinessType,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

// ====================================================
// HOOK
// ====================================================

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
