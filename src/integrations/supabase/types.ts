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
      assinaturas: {
        Row: {
          cafe_surpresa: boolean | null
          created_at: string
          id: string
          metodo_preparo: string | null
          moagem: Database["public"]["Enums"]["tipo_moagem"] | null
          preco: number
          produto_id: string | null
          proxima_entrega: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
          stripe_subscription_id: string | null
          tipo: Database["public"]["Enums"]["tipo_assinatura"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cafe_surpresa?: boolean | null
          created_at?: string
          id?: string
          metodo_preparo?: string | null
          moagem?: Database["public"]["Enums"]["tipo_moagem"] | null
          preco: number
          produto_id?: string | null
          proxima_entrega?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
          stripe_subscription_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_assinatura"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cafe_surpresa?: boolean | null
          created_at?: string
          id?: string
          metodo_preparo?: string | null
          moagem?: Database["public"]["Enums"]["tipo_moagem"] | null
          preco?: number
          produto_id?: string | null
          proxima_entrega?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
          stripe_subscription_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_assinatura"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          aprovado: boolean
          aroma: number | null
          comentario: string | null
          compra_verificada: boolean | null
          created_at: string
          finalizacao: number | null
          id: string
          nota: number
          produto_id: string
          resposta_admin: string | null
          resposta_admin_at: string | null
          sabor: number | null
          titulo: string | null
          user_id: string
        }
        Insert: {
          aprovado?: boolean
          aroma?: number | null
          comentario?: string | null
          compra_verificada?: boolean | null
          created_at?: string
          finalizacao?: number | null
          id?: string
          nota: number
          produto_id: string
          resposta_admin?: string | null
          resposta_admin_at?: string | null
          sabor?: number | null
          titulo?: string | null
          user_id: string
        }
        Update: {
          aprovado?: boolean
          aroma?: number | null
          comentario?: string | null
          compra_verificada?: boolean | null
          created_at?: string
          finalizacao?: number | null
          id?: string
          nota?: number
          produto_id?: string
          resposta_admin?: string | null
          resposta_admin_at?: string | null
          sabor?: number | null
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          imagem_url: string | null
          link: string | null
          ordem: number
          subtitulo: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          subtitulo?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          subtitulo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          autor_id: string | null
          conteudo: string | null
          created_at: string
          id: string
          imagem_url: string | null
          publicado: boolean
          resumo: string | null
          slug: string
          tags: string[] | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          resumo?: string | null
          slug: string
          tags?: string[] | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          publicado?: boolean
          resumo?: string | null
          slug?: string
          tags?: string[] | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_produtos: {
        Row: {
          collection_id: string
          id: string
          ordem: number
          produto_id: string
        }
        Insert: {
          collection_id: string
          id?: string
          ordem?: number
          produto_id: string
        }
        Update: {
          collection_id?: string
          id?: string
          ordem?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_produtos_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          desconto_percentual: number | null
          desconto_valor: number | null
          id: string
          usos_restantes: number | null
          valido_ate: string | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          usos_restantes?: number | null
          valido_ate?: string | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          usos_restantes?: number | null
          valido_ate?: string | null
          valor_minimo?: number | null
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          apelido: string | null
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          created_at: string
          estado: string
          id: string
          logradouro: string
          numero: string
          principal: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          apelido?: string | null
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          created_at?: string
          estado: string
          id?: string
          logradouro: string
          numero: string
          principal?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          apelido?: string | null
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          created_at?: string
          estado?: string
          id?: string
          logradouro?: string
          numero?: string
          principal?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          variante_id: string | null
        }
        Insert: {
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          variante_id?: string | null
        }
        Update: {
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          pedido_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          codigo_rastreamento: string | null
          created_at: string
          cupom_id: string | null
          desconto: number | null
          email_visitante: string | null
          endereco_entrega: Json | null
          frete: number | null
          id: string
          mensagem_presente: string | null
          metodo_pagamento: string | null
          order_number: number | null
          presente: boolean | null
          status: Database["public"]["Enums"]["status_pedido"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          codigo_rastreamento?: string | null
          created_at?: string
          cupom_id?: string | null
          desconto?: number | null
          email_visitante?: string | null
          endereco_entrega?: Json | null
          frete?: number | null
          id?: string
          mensagem_presente?: string | null
          metodo_pagamento?: string | null
          order_number?: number | null
          presente?: boolean | null
          status?: Database["public"]["Enums"]["status_pedido"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          codigo_rastreamento?: string | null
          created_at?: string
          cupom_id?: string | null
          desconto?: number | null
          email_visitante?: string | null
          endereco_entrega?: Json | null
          frete?: number | null
          id?: string
          mensagem_presente?: string | null
          metodo_pagamento?: string | null
          order_number?: number | null
          presente?: boolean | null
          status?: Database["public"]["Enums"]["status_pedido"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_fidelidade: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          pedido_id: string | null
          pontos: number
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          pedido_id?: string | null
          pontos: number
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          pedido_id?: string | null
          pontos?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_fidelidade_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_imagens: {
        Row: {
          alt_text: string | null
          id: string
          ordem: number
          principal: boolean
          produto_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          ordem?: number
          principal?: boolean
          produto_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          ordem?: number
          principal?: boolean
          produto_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_imagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          acidez: number | null
          altitude: string | null
          ativo: boolean
          categoria_id: string | null
          corpo: number | null
          created_at: string
          descricao: string | null
          descricao_sensorial: string | null
          destaque: boolean
          docura: number | null
          estoque: number
          estoque_minimo: number
          id: string
          intensidade: number | null
          nome: string
          notas_sensoriais: string[] | null
          origem: string | null
          peso_padrao: number | null
          preco: number
          preco_promocional: number | null
          processo: string | null
          retrogosto: number | null
          safra: string | null
          sca_score: number | null
          sku: string | null
          slug: string
          tipo_torra: Database["public"]["Enums"]["tipo_torra"] | null
          updated_at: string
          variedade: string | null
        }
        Insert: {
          acidez?: number | null
          altitude?: string | null
          ativo?: boolean
          categoria_id?: string | null
          corpo?: number | null
          created_at?: string
          descricao?: string | null
          descricao_sensorial?: string | null
          destaque?: boolean
          docura?: number | null
          estoque?: number
          estoque_minimo?: number
          id?: string
          intensidade?: number | null
          nome: string
          notas_sensoriais?: string[] | null
          origem?: string | null
          peso_padrao?: number | null
          preco: number
          preco_promocional?: number | null
          processo?: string | null
          retrogosto?: number | null
          safra?: string | null
          sca_score?: number | null
          sku?: string | null
          slug: string
          tipo_torra?: Database["public"]["Enums"]["tipo_torra"] | null
          updated_at?: string
          variedade?: string | null
        }
        Update: {
          acidez?: number | null
          altitude?: string | null
          ativo?: boolean
          categoria_id?: string | null
          corpo?: number | null
          created_at?: string
          descricao?: string | null
          descricao_sensorial?: string | null
          destaque?: boolean
          docura?: number | null
          estoque?: number
          estoque_minimo?: number
          id?: string
          intensidade?: number | null
          nome?: string
          notas_sensoriais?: string[] | null
          origem?: string | null
          peso_padrao?: number | null
          preco?: number
          preco_promocional?: number | null
          processo?: string | null
          retrogosto?: number | null
          safra?: string | null
          sca_score?: number | null
          sku?: string | null
          slug?: string
          tipo_torra?: Database["public"]["Enums"]["tipo_torra"] | null
          updated_at?: string
          variedade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          loyalty_tier: string | null
          phone: string | null
          preferred_grind: string | null
          preferred_roast: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_tier?: string | null
          phone?: string | null
          preferred_grind?: string | null
          preferred_roast?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_tier?: string | null
          phone?: string | null
          preferred_grind?: string | null
          preferred_roast?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variantes: {
        Row: {
          ativo: boolean
          estoque: number
          id: string
          moagem: Database["public"]["Enums"]["tipo_moagem"]
          peso: number
          preco: number
          produto_id: string
        }
        Insert: {
          ativo?: boolean
          estoque?: number
          id?: string
          moagem: Database["public"]["Enums"]["tipo_moagem"]
          peso: number
          preco: number
          produto_id: string
        }
        Update: {
          ativo?: boolean
          estoque?: number
          id?: string
          moagem?: Database["public"]["Enums"]["tipo_moagem"]
          peso?: number
          preco?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variantes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_loyalty_tier: { Args: { _user_id: string }; Returns: string }
      get_user_points: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      status_assinatura: "ativa" | "pausada" | "cancelada"
      status_pedido:
        | "pendente"
        | "confirmado"
        | "preparando"
        | "enviado"
        | "entregue"
        | "cancelado"
      tipo_assinatura: "mensal" | "trimestral" | "semestral"
      tipo_moagem: "graos" | "grossa" | "media" | "fina" | "extra_fina"
      tipo_torra: "clara" | "media" | "media_escura" | "escura"
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
      app_role: ["admin", "user"],
      status_assinatura: ["ativa", "pausada", "cancelada"],
      status_pedido: [
        "pendente",
        "confirmado",
        "preparando",
        "enviado",
        "entregue",
        "cancelado",
      ],
      tipo_assinatura: ["mensal", "trimestral", "semestral"],
      tipo_moagem: ["graos", "grossa", "media", "fina", "extra_fina"],
      tipo_torra: ["clara", "media", "media_escura", "escura"],
    },
  },
} as const
