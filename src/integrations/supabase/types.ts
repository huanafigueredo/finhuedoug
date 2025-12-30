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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_members: {
        Row: {
          account_id: string
          created_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      allowed_users: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      category_budgets: {
        Row: {
          budget_amount: number
          category_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount: number
          category_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number
          category_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value?: number
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Relationships: []
      }
      comprovantes_lancamento: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lancamento_id: string
          nfe_qr_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lancamento_id: string
          nfe_qr_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lancamento_id?: string
          nfe_qr_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovantes_lancamento_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_agendadas: {
        Row: {
          competencia: string
          confirmado_em: string | null
          created_at: string
          data_vencimento: string
          id: string
          lancamento_id: string | null
          observacao: string | null
          recorrencia_id: string
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          competencia: string
          confirmado_em?: string | null
          created_at?: string
          data_vencimento: string
          id?: string
          lancamento_id?: string | null
          observacao?: string | null
          recorrencia_id: string
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          competencia?: string
          confirmado_em?: string | null
          created_at?: string
          data_vencimento?: string
          id?: string
          lancamento_id?: string | null
          observacao?: string | null
          recorrencia_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_agendadas_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_agendadas_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "recorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itens_lancamento: {
        Row: {
          categoria_item: string | null
          confirmado: boolean
          created_at: string
          id: string
          lancamento_id: string
          nome_item: string
          quantidade: number | null
          user_id: string
          valor: number | null
        }
        Insert: {
          categoria_item?: string | null
          confirmado?: boolean
          created_at?: string
          id?: string
          lancamento_id: string
          nome_item: string
          quantidade?: number | null
          user_id: string
          valor?: number | null
        }
        Update: {
          categoria_item?: string | null
          confirmado?: boolean
          created_at?: string
          id?: string
          lancamento_id?: string
          nome_item?: string
          quantidade?: number | null
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_lancamento_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_xp: {
        Row: {
          achievements_count: number
          challenges_completed: number
          created_at: string
          id: string
          month: number
          person_name: string
          updated_at: string
          user_id: string
          xp_earned: number
          year: number
        }
        Insert: {
          achievements_count?: number
          challenges_completed?: number
          created_at?: string
          id?: string
          month: number
          person_name: string
          updated_at?: string
          user_id: string
          xp_earned?: number
          year: number
        }
        Update: {
          achievements_count?: number
          challenges_completed?: number
          created_at?: string
          id?: string
          month?: number
          person_name?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
          year?: number
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recorrencias: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          data_inicio: string
          dia_vencimento: number
          id: string
          lembrete_1_dia: boolean
          lembrete_3_dias: boolean
          lembrete_7_dias: boolean
          observacao_padrao: string | null
          para_quem: string | null
          pessoa: string | null
          subcategoria: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          data_inicio: string
          dia_vencimento: number
          id?: string
          lembrete_1_dia?: boolean
          lembrete_3_dias?: boolean
          lembrete_7_dias?: boolean
          observacao_padrao?: string | null
          para_quem?: string | null
          pessoa?: string | null
          subcategoria?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          data_inicio?: string
          dia_vencimento?: number
          id?: string
          lembrete_1_dia?: boolean
          lembrete_3_dias?: boolean
          lembrete_7_dias?: boolean
          observacao_padrao?: string | null
          para_quem?: string | null
          pessoa?: string | null
          subcategoria?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_padrao?: number
        }
        Relationships: []
      }
      rewards: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          level_required: number
          name: string
          preview_data: Json | null
          type: string
          xp_required: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          level_required?: number
          name: string
          preview_data?: Json | null
          type: string
          xp_required?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          level_required?: number
          name?: string
          preview_data?: Json | null
          type?: string
          xp_required?: number
        }
        Relationships: []
      }
      savings_deposits: {
        Row: {
          amount: number
          created_at: string
          deposited_by: string
          goal_id: string
          id: string
          note: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deposited_by: string
          goal_id: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposited_by?: string
          goal_id?: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_deposits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_deposits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          bank_id: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          icon: string | null
          id: string
          owner: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          owner?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_id?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          owner?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          bank_id: string | null
          cartao: string | null
          category: string | null
          conta_agendada_id: string | null
          created_at: string | null
          date: string
          description: string
          for_who: string | null
          forma_pagamento: string | null
          id: string
          income_origin: string | null
          installment_number: number | null
          installment_value: number | null
          instituicao: string | null
          is_couple: boolean | null
          is_generated_installment: boolean | null
          is_installment: boolean | null
          is_recurring: boolean | null
          modo_valor_informado: string | null
          observacao: string | null
          origem: string | null
          paid_by: string | null
          parent_transaction_id: string | null
          payment_method_id: string | null
          receiving_bank_id: string | null
          recipient_id: string | null
          recurring_day: number | null
          recurring_duration: string | null
          recurring_end_date: string | null
          resumo_curto: string | null
          savings_deposit_id: string | null
          status_extracao: string | null
          subcategory: string | null
          tags: string[] | null
          total_installments: number | null
          total_value: number
          type: string
          user_id: string
          value_per_person: number | null
        }
        Insert: {
          account_id: string
          bank_id?: string | null
          cartao?: string | null
          category?: string | null
          conta_agendada_id?: string | null
          created_at?: string | null
          date: string
          description: string
          for_who?: string | null
          forma_pagamento?: string | null
          id?: string
          income_origin?: string | null
          installment_number?: number | null
          installment_value?: number | null
          instituicao?: string | null
          is_couple?: boolean | null
          is_generated_installment?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          modo_valor_informado?: string | null
          observacao?: string | null
          origem?: string | null
          paid_by?: string | null
          parent_transaction_id?: string | null
          payment_method_id?: string | null
          receiving_bank_id?: string | null
          recipient_id?: string | null
          recurring_day?: number | null
          recurring_duration?: string | null
          recurring_end_date?: string | null
          resumo_curto?: string | null
          savings_deposit_id?: string | null
          status_extracao?: string | null
          subcategory?: string | null
          tags?: string[] | null
          total_installments?: number | null
          total_value: number
          type: string
          user_id: string
          value_per_person?: number | null
        }
        Update: {
          account_id?: string
          bank_id?: string | null
          cartao?: string | null
          category?: string | null
          conta_agendada_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          for_who?: string | null
          forma_pagamento?: string | null
          id?: string
          income_origin?: string | null
          installment_number?: number | null
          installment_value?: number | null
          instituicao?: string | null
          is_couple?: boolean | null
          is_generated_installment?: boolean | null
          is_installment?: boolean | null
          is_recurring?: boolean | null
          modo_valor_informado?: string | null
          observacao?: string | null
          origem?: string | null
          paid_by?: string | null
          parent_transaction_id?: string | null
          payment_method_id?: string | null
          receiving_bank_id?: string | null
          recipient_id?: string | null
          recurring_day?: number | null
          recurring_duration?: string | null
          recurring_end_date?: string | null
          resumo_curto?: string | null
          savings_deposit_id?: string | null
          status_extracao?: string | null
          subcategory?: string | null
          tags?: string[] | null
          total_installments?: number | null
          total_value?: number
          type?: string
          user_id?: string
          value_per_person?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_conta_agendada_id_fkey"
            columns: ["conta_agendada_id"]
            isOneToOne: false
            referencedRelation: "contas_agendadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receiving_bank_id_fkey"
            columns: ["receiving_bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_savings_deposit_id_fkey"
            columns: ["savings_deposit_id"]
            isOneToOne: false
            referencedRelation: "savings_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          equipped_frame: string | null
          equipped_theme: string | null
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          streak_freeze_available: boolean
          streak_freeze_used_at: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          equipped_frame?: string | null
          equipped_theme?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_freeze_used_at?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          equipped_frame?: string | null
          equipped_theme?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_freeze_available?: boolean
          streak_freeze_used_at?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          id: string
          is_equipped: boolean
          reward_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          reward_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          reward_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          person_1_avatar_url: string | null
          person_1_name: string
          person_2_avatar_url: string | null
          person_2_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          person_1_avatar_url?: string | null
          person_1_name?: string
          person_2_avatar_url?: string | null
          person_2_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          person_1_avatar_url?: string | null
          person_1_name?: string
          person_2_avatar_url?: string | null
          person_2_name?: string
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
      is_allowed_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      achievement_category: "spending" | "saving" | "revenue" | "consistency"
      challenge_type: "weekly" | "monthly"
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
      achievement_category: ["spending", "saving", "revenue", "consistency"],
      challenge_type: ["weekly", "monthly"],
    },
  },
} as const
