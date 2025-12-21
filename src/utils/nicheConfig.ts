import { BusinessType } from '@/contexts/BusinessContext';
import { Shirt, Sparkles, Package } from 'lucide-react';

// ====================================================
// CONFIGURAÇÕES POR NICHO
// ====================================================
// 
// Este arquivo centraliza TODAS as configurações específicas de cada nicho.
// Qualquer ajuste de texto, labels ou campos deve ser feito aqui.
//
// ====================================================

export interface NicheConfig {
  id: BusinessType;
  name: string;
  icon: typeof Shirt;
  description: string;
  gradient: string;
  color: string;
  // Textos para tela de confirmação
  idealFor: string[];
  benefits: string;
  features: string[];
  // Labels do sistema
  labels: {
    product: string;
    products: string;
    addProduct: string;
    stock: string;
    entry: string;
    exit: string;
  };
  // Configuração de campos
  fields: {
    showSize: boolean;
    showColor: boolean;
    showBrand: boolean;
    showExpiration: boolean;
    showVariations: boolean;
  };
  // Placeholders
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
    description: 'Roupas, calçados, bolsas e produtos com tamanhos e cores.',
    gradient: 'gradient-moda',
    color: 'niche-moda',
    // Textos específicos para confirmação
    idealFor: [
      'Vende roupas, calçados, bolsas ou acessórios',
      'Trabalha com tamanhos e cores',
      'Já perdeu vendas por falta de um tamanho específico',
      'Vende pelo WhatsApp ou Instagram',
    ],
    benefits: 'Você poderá controlar seu estoque por tamanho e cor, registrar vendas com poucos cliques e receber alertas quando algum tamanho estiver acabando.',
    features: [
      'Controle de tamanhos (letras, numeração e calçados)',
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
    description: 'Maquiagem, perfumes e produtos de beleza por unidade.',
    gradient: 'gradient-cosmeticos',
    color: 'niche-cosmeticos',
    // Textos específicos para confirmação
    idealFor: [
      'Vende maquiagem, perfumes ou produtos de beleza',
      'Controla produtos por unidade',
      'Precisa acompanhar validade',
      'Quer evitar perdas por vencimento',
    ],
    benefits: 'Você poderá acompanhar quantidades por produto, registrar saídas rapidamente e receber alertas de produtos com validade próxima.',
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
    description: 'Produtos variados sem tamanhos ou validade.',
    gradient: 'gradient-geral',
    color: 'niche-geral',
    // Textos específicos para confirmação
    idealFor: [
      'Vende produtos variados',
      'Não trabalha com tamanhos ou validade',
      'Quer controle simples e rápido',
      'Não quer sistemas complicados',
    ],
    benefits: 'Você terá um controle simples de entradas e saídas, evitando perdas e sabendo exatamente o que você tem em estoque.',
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
