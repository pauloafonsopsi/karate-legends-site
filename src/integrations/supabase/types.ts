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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          atualizado_em: string
          cancel_at_period_end: boolean
          criado_em: string
          email: string
          environment: string
          id: string
          moeda: string | null
          origem: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tipo: string
          user_id: string | null
          valor_centavos: number | null
        }
        Insert: {
          atualizado_em?: string
          cancel_at_period_end?: boolean
          criado_em?: string
          email: string
          environment?: string
          id?: string
          moeda?: string | null
          origem?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tipo?: string
          user_id?: string | null
          valor_centavos?: number | null
        }
        Update: {
          atualizado_em?: string
          cancel_at_period_end?: boolean
          criado_em?: string
          email?: string
          environment?: string
          id?: string
          moeda?: string | null
          origem?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tipo?: string
          user_id?: string | null
          valor_centavos?: number | null
        }
        Relationships: []
      }
      atletas: {
        Row: {
          apelido: string | null
          atualizado_em: string
          cidade: string | null
          criado_em: string
          dojo: string | null
          estilo: string | null
          foto_url: string | null
          graduacao: string | null
          historico: boolean
          id: string
          nome: string
          pais: string | null
          publicado: boolean
          registro_legends: number | null
        }
        Insert: {
          apelido?: string | null
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dojo?: string | null
          estilo?: string | null
          foto_url?: string | null
          graduacao?: string | null
          historico?: boolean
          id?: string
          nome: string
          pais?: string | null
          publicado?: boolean
          registro_legends?: number | null
        }
        Update: {
          apelido?: string | null
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dojo?: string | null
          estilo?: string | null
          foto_url?: string | null
          graduacao?: string | null
          historico?: boolean
          id?: string
          nome?: string
          pais?: string | null
          publicado?: boolean
          registro_legends?: number | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      cinturoes: {
        Row: {
          atleta_id: string
          categoria_id: string
          criado_em: string
          desde: string | null
          id: string
          luta_id: string | null
          publicado: boolean
          vigente: boolean
        }
        Insert: {
          atleta_id: string
          categoria_id: string
          criado_em?: string
          desde?: string | null
          id?: string
          luta_id?: string | null
          publicado?: boolean
          vigente?: boolean
        }
        Update: {
          atleta_id?: string
          categoria_id?: string
          criado_em?: string
          desde?: string | null
          id?: string
          luta_id?: string | null
          publicado?: boolean
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cinturoes_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cinturoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cinturoes_luta_id_fkey"
            columns: ["luta_id"]
            isOneToOne: false
            referencedRelation: "lutas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_registro: {
        Row: {
          atualizado_em: string
          estilos: string[]
          fundador_ate: string | null
          id: boolean
          idade_minima: number
        }
        Insert: {
          atualizado_em?: string
          estilos?: string[]
          fundador_ate?: string | null
          id?: boolean
          idade_minima?: number
        }
        Update: {
          atualizado_em?: string
          estilos?: string[]
          fundador_ate?: string | null
          id?: boolean
          idade_minima?: number
        }
        Relationships: []
      }
      contas: {
        Row: {
          atleta_id: string | null
          atualizado_em: string
          cidade: string | null
          criado_em: string
          dojo: string | null
          email: string
          estilo: string | null
          fundador: boolean
          fundador_preco_centavos: number | null
          graduacao: string | null
          id: string
          indicacao: string | null
          nascimento: string | null
          nome: string | null
          origem: string | null
          pais: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          atleta_id?: string | null
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dojo?: string | null
          email: string
          estilo?: string | null
          fundador?: boolean
          fundador_preco_centavos?: number | null
          graduacao?: string | null
          id?: string
          indicacao?: string | null
          nascimento?: string | null
          nome?: string | null
          origem?: string | null
          pais?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          atleta_id?: string | null
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dojo?: string | null
          email?: string
          estilo?: string | null
          fundador?: boolean
          fundador_preco_centavos?: number | null
          graduacao?: string | null
          id?: string
          indicacao?: string | null
          nascimento?: string | null
          nome?: string | null
          origem?: string | null
          pais?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          chave: string
          id: string
          idioma: string
          valor: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave: string
          id?: string
          idioma: string
          valor: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave?: string
          id?: string
          idioma?: string
          valor?: string
        }
        Relationships: []
      }
      cortesias_email: {
        Row: {
          atleta_id: string | null
          criado_em: string
          email: string
          id: string
          observacao: string | null
          usado_em: string | null
        }
        Insert: {
          atleta_id?: string | null
          criado_em?: string
          email: string
          id?: string
          observacao?: string | null
          usado_em?: string | null
        }
        Update: {
          atleta_id?: string | null
          criado_em?: string
          email?: string
          id?: string
          observacao?: string | null
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cortesias_email_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          atualizado_em: string
          cidade: string | null
          criado_em: string
          data_evento: string | null
          descricao: string | null
          edicao: number | null
          formato: string
          gravacao_publica: boolean
          id: string
          imagem_url: string | null
          link_gravacao: string | null
          local: string | null
          nome: string
          pais: string | null
          ppv_plano_chave: string | null
          publicado: boolean
          slug: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          data_evento?: string | null
          descricao?: string | null
          edicao?: number | null
          formato?: string
          gravacao_publica?: boolean
          id?: string
          imagem_url?: string | null
          link_gravacao?: string | null
          local?: string | null
          nome: string
          pais?: string | null
          ppv_plano_chave?: string | null
          publicado?: boolean
          slug: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          data_evento?: string | null
          descricao?: string | null
          edicao?: number | null
          formato?: string
          gravacao_publica?: boolean
          id?: string
          imagem_url?: string | null
          link_gravacao?: string | null
          local?: string | null
          nome?: string
          pais?: string | null
          ppv_plano_chave?: string | null
          publicado?: boolean
          slug?: string
          status?: string
        }
        Relationships: []
      }
      inscricoes_atletas: {
        Row: {
          aceite_privacidade: boolean
          aceite_termos: boolean
          associacao: string | null
          cidade: string | null
          criado_em: string
          dono_dojo: boolean
          email: string
          estilo: string
          graduacao: string
          id: string
          link_certificado: string | null
          link_documento: string | null
          link_documento_verso: string | null
          link_video: string | null
          nome: string
          observacoes: string | null
          pagamento_confirmado: boolean
          pais: string | null
          redes_sociais: string | null
          respondido_em: string | null
          sensei_nome: string | null
          sensei_telefone: string | null
          status: string
          whatsapp: string
        }
        Insert: {
          aceite_privacidade?: boolean
          aceite_termos?: boolean
          associacao?: string | null
          cidade?: string | null
          criado_em?: string
          dono_dojo?: boolean
          email: string
          estilo: string
          graduacao: string
          id?: string
          link_certificado?: string | null
          link_documento?: string | null
          link_documento_verso?: string | null
          link_video?: string | null
          nome: string
          observacoes?: string | null
          pagamento_confirmado?: boolean
          pais?: string | null
          redes_sociais?: string | null
          respondido_em?: string | null
          sensei_nome?: string | null
          sensei_telefone?: string | null
          status?: string
          whatsapp: string
        }
        Update: {
          aceite_privacidade?: boolean
          aceite_termos?: boolean
          associacao?: string | null
          cidade?: string | null
          criado_em?: string
          dono_dojo?: boolean
          email?: string
          estilo?: string
          graduacao?: string
          id?: string
          link_certificado?: string | null
          link_documento?: string | null
          link_documento_verso?: string | null
          link_video?: string | null
          nome?: string
          observacoes?: string | null
          pagamento_confirmado?: boolean
          pais?: string | null
          redes_sociais?: string | null
          respondido_em?: string | null
          sensei_nome?: string | null
          sensei_telefone?: string | null
          status?: string
          whatsapp?: string
        }
        Relationships: []
      }
      lista_espera_ppv: {
        Row: {
          criado_em: string
          email: string
          id: string
          nome: string
          whatsapp: string
        }
        Insert: {
          criado_em?: string
          email: string
          id?: string
          nome: string
          whatsapp: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          whatsapp?: string
        }
        Relationships: []
      }
      lutas: {
        Row: {
          atleta_a_id: string | null
          atleta_b_id: string | null
          atualizado_em: string
          categoria_id: string | null
          criado_em: string
          evento_id: string
          fase: string | null
          id: string
          link_gravacao: string | null
          metodo: string | null
          ordem: number
          resultado: string | null
          status: string
          vale_cinturao: boolean
          vencedor_id: string | null
        }
        Insert: {
          atleta_a_id?: string | null
          atleta_b_id?: string | null
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          evento_id: string
          fase?: string | null
          id?: string
          link_gravacao?: string | null
          metodo?: string | null
          ordem?: number
          resultado?: string | null
          status?: string
          vale_cinturao?: boolean
          vencedor_id?: string | null
        }
        Update: {
          atleta_a_id?: string | null
          atleta_b_id?: string | null
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          evento_id?: string
          fase?: string | null
          id?: string
          link_gravacao?: string | null
          metodo?: string | null
          ordem?: number
          resultado?: string | null
          status?: string
          vale_cinturao?: boolean
          vencedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lutas_atleta_a_id_fkey"
            columns: ["atleta_a_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lutas_atleta_b_id_fkey"
            columns: ["atleta_b_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lutas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lutas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lutas_vencedor_id_fkey"
            columns: ["vencedor_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          aceite_privacidade: boolean
          aceite_termos: boolean
          cidade: string | null
          criado_em: string
          email: string
          id: string
          nome: string
          observacoes: string | null
          pais: string | null
          plano: string
          status: string
          whatsapp: string
        }
        Insert: {
          aceite_privacidade?: boolean
          aceite_termos?: boolean
          cidade?: string | null
          criado_em?: string
          email: string
          id?: string
          nome: string
          observacoes?: string | null
          pais?: string | null
          plano?: string
          status?: string
          whatsapp: string
        }
        Update: {
          aceite_privacidade?: boolean
          aceite_termos?: boolean
          cidade?: string | null
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          observacoes?: string | null
          pais?: string | null
          plano?: string
          status?: string
          whatsapp?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          exige_arquivo: boolean
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          exige_arquivo?: boolean
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          exige_arquivo?: boolean
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      metas_atleta: {
        Row: {
          arquivo_path: string | null
          atualizado_em: string
          conta_id: string
          id: string
          link: string | null
          meta_id: string
          status: string
          verificado_em: string | null
          verificado_por: string | null
        }
        Insert: {
          arquivo_path?: string | null
          atualizado_em?: string
          conta_id: string
          id?: string
          link?: string | null
          meta_id: string
          status?: string
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Update: {
          arquivo_path?: string | null
          atualizado_em?: string
          conta_id?: string
          id?: string
          link?: string | null
          meta_id?: string
          status?: string
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_atleta_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_atleta_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          beneficios: Json
          chave: string
          destaque: boolean
          icone: string
          id: string
          moeda: string
          ordem: number
          periodo: Json
          preco_centavos: number | null
          titulo: Json
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          beneficios?: Json
          chave: string
          destaque?: boolean
          icone?: string
          id?: string
          moeda?: string
          ordem?: number
          periodo?: Json
          preco_centavos?: number | null
          titulo?: Json
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          beneficios?: Json
          chave?: string
          destaque?: boolean
          icone?: string
          id?: string
          moeda?: string
          ordem?: number
          periodo?: Json
          preco_centavos?: number | null
          titulo?: Json
        }
        Relationships: []
      }
      rankings: {
        Row: {
          atleta_id: string
          atualizado_em: string
          categoria_id: string
          id: string
          posicao: number
          publicado: boolean
        }
        Insert: {
          atleta_id: string
          atualizado_em?: string
          categoria_id: string
          id?: string
          posicao: number
          publicado?: boolean
        }
        Update: {
          atleta_id?: string
          atualizado_em?: string
          categoria_id?: string
          id?: string
          posicao?: number
          publicado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "rankings_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      registros: {
        Row: {
          atualizado_em: string
          conta_id: string
          criado_em: string
          environment: string | null
          fundador: boolean
          id: string
          inicio: string
          origem: string | null
          preco_centavos: number | null
          price_id: string | null
          status: string
          stripe_ref: string | null
          tipo: string
          vencimento: string | null
        }
        Insert: {
          atualizado_em?: string
          conta_id: string
          criado_em?: string
          environment?: string | null
          fundador?: boolean
          id?: string
          inicio?: string
          origem?: string | null
          preco_centavos?: number | null
          price_id?: string | null
          status?: string
          stripe_ref?: string | null
          tipo: string
          vencimento?: string | null
        }
        Update: {
          atualizado_em?: string
          conta_id?: string
          criado_em?: string
          environment?: string | null
          fundador?: boolean
          id?: string
          inicio?: string
          origem?: string | null
          preco_centavos?: number | null
          price_id?: string | null
          status?: string
          stripe_ref?: string | null
          tipo?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      status_historico: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          id: string
          registro_id: string
          status_anterior: string | null
          status_novo: string | null
          tabela: string
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          registro_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tabela: string
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          registro_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tabela?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atribuir_numero: { Args: { _conta_id: string }; Returns: number }
      caminho_da_lenda: { Args: { _conta_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      minha_conta_iniciar: {
        Args: { _indicacao?: string; _origem?: string }
        Returns: string
      }
      registro_ativo: { Args: { _conta_id: string }; Returns: boolean }
      reservar_registros_legends: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user" | "consultor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user", "consultor"],
    },
  },
} as const
