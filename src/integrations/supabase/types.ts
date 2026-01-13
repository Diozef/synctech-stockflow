export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          id: string
          min_stock_alert: number
          notifications_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at?: string
          id?: string
          min_stock_alert?: number
          notifications_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          id?: string
          min_stock_alert?: number
          notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_sizes: {
        Row: {
          business_id: string
          created_at: string
          id: string
          size_value: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          size_value: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          size_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_sizes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string
          cpf: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cpf?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cpf?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          business_id: string
          category: Database["public"]["Enums"]["finance_category"]
          created_at: string
          description: string | null
          finance_type: Database["public"]["Enums"]["finance_type"]
          id: string
          installment_id: string | null
          notes: string | null
          product_id: string | null
          stock_movement_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          category: Database["public"]["Enums"]["finance_category"]
          created_at?: string
          description?: string | null
          finance_type: Database["public"]["Enums"]["finance_type"]
          id?: string
          installment_id?: string | null
          notes?: string | null
          product_id?: string | null
          stock_movement_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: Database["public"]["Enums"]["finance_category"]
          created_at?: string
          description?: string | null
          finance_type?: Database["public"]["Enums"]["finance_type"]
          id?: string
          installment_id?: string | null
          notes?: string | null
          product_id?: string | null
          stock_movement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          customer_id: string | null
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_at: string | null
          sale_id: string
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          customer_id?: string | null
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_at?: string | null
          sale_id: string
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          customer_id?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_at?: string | null
          sale_id?: string
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_notifications: {
        Row: {
          business_id: string
          created_at: string
          current_quantity: number
          id: string
          is_read: boolean
          min_quantity: number
          product_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_quantity: number
          id?: string
          is_read?: boolean
          min_quantity: number
          product_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_quantity?: number
          id?: string
          is_read?: boolean
          min_quantity?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          business_id: string
          color: string | null
          created_at: string
          expiration_date: string | null
          id: string
          name: string
          photo_url: string | null
          price: number
          quantity: number
          size: string | null
          size_category: Database["public"]["Enums"]["size_category"] | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          business_id: string
          color?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          name: string
          photo_url?: string | null
          price?: number
          quantity?: number
          size?: string | null
          size_category?: Database["public"]["Enums"]["size_category"] | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          business_id?: string
          color?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          price?: number
          quantity?: number
          size?: string | null
          size_category?: Database["public"]["Enums"]["size_category"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          down_payment_amount: number | null
          first_due_date: string | null
          has_down_payment: boolean
          id: string
          installments_count: number
          notes: string | null
          payment_type: Database["public"]["Enums"]["sale_payment_type"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          down_payment_amount?: number | null
          first_due_date?: string | null
          has_down_payment?: boolean
          id?: string
          installments_count?: number
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["sale_payment_type"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          down_payment_amount?: number | null
          first_due_date?: string | null
          has_down_payment?: boolean
          id?: string
          installments_count?: number
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["sale_payment_type"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          observation: string | null
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          observation?: string | null
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          observation?: string | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          hotmart_subscription_code: string | null
          hotmart_transaction_id: string | null
          id: string
          plan_name: string
          price_cents: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotmart_subscription_code?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          plan_name?: string
          price_cents?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotmart_subscription_code?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          plan_name?: string
          price_cents?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      safe_uuid_generate: { Args: never; Returns: string }
    }
    Enums: {
      business_type: "moda" | "cosmeticos" | "geral"
      finance_category:
        | "vendas"
        | "devolucao"
        | "aluguel"
        | "energia"
        | "agua"
        | "internet"
        | "folha_pagamento"
        | "marketing"
        | "manutencao"
        | "outro"
      finance_type: "receita" | "despesa"
      installment_status: "pendente" | "pago" | "atrasado" | "cancelado"
      movement_type: "entrada" | "saida"
      sale_payment_type: "avista" | "parcelado"
      size_category: "letras" | "numeracao" | "calcados" | "personalizado"
      subscription_status: "trial" | "active" | "cancelled" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_type: ["moda", "cosmeticos", "geral"],
      finance_category: [
        "vendas",
        "devolucao",
        "aluguel",
        "energia",
        "agua",
        "internet",
        "folha_pagamento",
        "marketing",
        "manutencao",
        "outro",
      ],
      finance_type: ["receita", "despesa"],
      installment_status: ["pendente", "pago", "atrasado", "cancelado"],
      movement_type: ["entrada", "saida"],
      sale_payment_type: ["avista", "parcelado"],
      size_category: ["letras", "numeracao", "calcados", "personalizado"],
      subscription_status: ["trial", "active", "cancelled", "expired"],
    },
  },
} as const
