import { BusinessType } from '@/contexts/BusinessContext';
import { Shirt, Sparkles, Package } from 'lucide-react';

// ====================================================
// CONFIGURAÇÕES POR NICHO
// ====================================================

export interface NicheConfig {
  id: BusinessType;
  name: string;
  icon: typeof Shirt;
  description: string;
  gradient: string;
  color: string;
  idealFor: string[];
  features: string[];
  labels: {
    product: string;
    products: string;
    addProduct: string;
    stock: string;
    entry: string;
    exit: string;
  };
  fields: {
    showSize: boolean;
    showColor: boolean;
    showBrand: boolean;
    showExpiration: boolean;
    showVariations: boolean;
  };
  placeholders: {
    productName: string;
    productExamples: string[];
  };
}

export const nicheConfigs: Record<NonNullable<BusinessType>, NicheConfig> = {
  moda: {
    id: 'moda',
    name: 'Moda & Acessórios',
    icon: Shirt,
    description: 'Roupas, calçados, bolsas, bijuterias e acessórios em geral',
    gradient: 'gradient-moda',
    color: 'niche-moda',
    idealFor: [
      'Vende roupas ou acessórios',
      'Trabalha com variações de tamanho e cor',
      'Precisa controlar estoque por variação',
      'Faz vendas pelo Instagram ou WhatsApp',
    ],
    features: [
      'Controle de tamanhos (P, M, G, GG...)',
      'Variações de cor por produto',
      'Estoque por combinação tamanho + cor',
      'Alertas de reposição por variação',
    ],
    labels: {
      product: 'Peça',
      products: 'Peças',
      addProduct: 'Cadastrar peça',
      stock: 'Estoque de peças',
      entry: 'Entrada de peças',
      exit: 'Venda de peça',
    },
    fields: {
      showSize: true,
      showColor: true,
      showBrand: false,
      showExpiration: false,
      showVariations: true,
    },
    placeholders: {
      productName: 'Ex: Vestido Floral, Tênis Casual',
      productExamples: ['Vestido', 'Calça Jeans', 'Bolsa', 'Brinco'],
    },
  },
  cosmeticos: {
    id: 'cosmeticos',
    name: 'Cosméticos & Perfumaria',
    icon: Sparkles,
    description: 'Maquiagens, perfumes, cremes, produtos de beleza e cuidados pessoais',
    gradient: 'gradient-cosmeticos',
    color: 'niche-cosmeticos',
    idealFor: [
      'Revende cosméticos ou perfumes',
      'Trabalha com produtos que têm validade',
      'Precisa controlar marcas e fornecedores',
      'Faz vendas pelo WhatsApp ou Instagram',
    ],
    features: [
      'Controle de validade dos produtos',
      'Organização por marca',
      'Alertas de produtos próximos ao vencimento',
      'Histórico de vendas por produto',
    ],
    labels: {
      product: 'Produto',
      products: 'Produtos',
      addProduct: 'Cadastrar produto',
      stock: 'Estoque de produtos',
      entry: 'Entrada de produtos',
      exit: 'Venda de produto',
    },
    fields: {
      showSize: false,
      showColor: false,
      showBrand: true,
      showExpiration: true,
      showVariations: false,
    },
    placeholders: {
      productName: 'Ex: Batom Matte, Perfume Importado',
      productExamples: ['Batom', 'Perfume', 'Base', 'Hidratante'],
    },
  },
  geral: {
    id: 'geral',
    name: 'Produtos Gerais',
    icon: Package,
    description: 'Qualquer tipo de produto sem necessidades especiais de controle',
    gradient: 'gradient-geral',
    color: 'niche-geral',
    idealFor: [
      'Vende produtos variados',
      'Não precisa de controles especiais',
      'Quer um sistema simples e direto',
      'Está começando a organizar o estoque',
    ],
    features: [
      'Cadastro simples e rápido',
      'Controle básico de quantidade',
      'Alertas de estoque baixo',
      'Ideal para começar',
    ],
    labels: {
      product: 'Item',
      products: 'Itens',
      addProduct: 'Cadastrar item',
      stock: 'Estoque',
      entry: 'Entrada',
      exit: 'Saída',
    },
    fields: {
      showSize: false,
      showColor: false,
      showBrand: false,
      showExpiration: false,
      showVariations: false,
    },
    placeholders: {
      productName: 'Ex: Produto X, Item Y',
      productExamples: ['Produto', 'Item', 'Mercadoria'],
    },
  },
};

export function getNicheConfig(type: BusinessType): NicheConfig | null {
  if (!type) return null;
  return nicheConfigs[type];
}
