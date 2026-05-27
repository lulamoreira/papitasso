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
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          city: string | null
          country: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string | null
          phase: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label: string | null
          stadium: string | null
          status: Database["public"]["Enums"]["match_status"] | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          city?: string | null
          country?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string | null
          phase?: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label?: string | null
          stadium?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          city?: string | null
          country?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string | null
          phase?: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label?: string | null
          stadium?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          payload: Json | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          market_value: number | null
          name: string
          photo_url: string | null
          position: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          market_value?: number | null
          name: string
          photo_url?: string | null
          position?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          market_value?: number | null
          name?: string
          photo_url?: string | null
          position?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_members: {
        Row: {
          joined_at: string | null
          pool_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          pool_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          joined_at?: string | null
          pool_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          id: string
          invite_code: string
          modes_enabled: string[] | null
          name: string
          owner_id: string
          scope_config: Json | null
          scope_type: string
          scoring_config: Json
          type: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          invite_code: string
          modes_enabled?: string[] | null
          name: string
          owner_id: string
          scope_config?: Json | null
          scope_type?: string
          scoring_config?: Json
          type?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string
          modes_enabled?: string[] | null
          name?: string
          owner_id?: string
          scope_config?: Json | null
          scope_type?: string
          scoring_config?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions_exact: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: string
          locked_at: string | null
          match_id: string
          points_awarded: number | null
          pool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: string
          locked_at?: string | null
          match_id: string
          points_awarded?: number | null
          pool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: string
          locked_at?: string | null
          match_id?: string
          points_awarded?: number | null
          pool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_exact_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_exact_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_exact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_winners: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_proof_url: string | null
          id: string
          notes: string | null
          prize_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_proof_url?: string | null
          id?: string
          notes?: string | null
          prize_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_proof_url?: string | null
          id?: string
          notes?: string | null
          prize_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_winners_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          category: string
          created_at: string | null
          custom_rule_jsonb: Json | null
          delivery_method: string | null
          description: string | null
          estimated_value_cents: number | null
          id: string
          photo_url: string | null
          pool_id: string
          position_order: number | null
          rank: number | null
          sponsor: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          custom_rule_jsonb?: Json | null
          delivery_method?: string | null
          description?: string | null
          estimated_value_cents?: number | null
          id?: string
          photo_url?: string | null
          pool_id: string
          position_order?: number | null
          rank?: number | null
          sponsor?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          custom_rule_jsonb?: Json | null
          delivery_method?: string | null
          description?: string | null
          estimated_value_cents?: number | null
          id?: string
          photo_url?: string | null
          pool_id?: string
          position_order?: number | null
          rank?: number | null
          sponsor?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "prizes_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          favorite_team_id: string | null
          id: string
          league_tier: string | null
          name: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_team_id?: string | null
          id: string
          league_tier?: string | null
          name?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_team_id?: string | null
          id?: string
          league_tier?: string | null
          name?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string
          fifa_ranking: number | null
          flag_url: string
          group_letter: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          fifa_ranking?: number | null
          flag_url: string
          group_letter?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          fifa_ranking?: number | null
          flag_url?: string
          group_letter?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          points: number | null
          pool_id: string | null
          position: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_exact_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_exact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_points_for_match: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      matches_for_pool: {
        Args: { p_pool_id: string }
        Returns: {
          away_score: number | null
          away_team_id: string | null
          city: string | null
          country: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string | null
          phase: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label: string | null
          stadium: string | null
          status: Database["public"]["Enums"]["match_status"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "matches"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      match_phase:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter"
        | "semi"
        | "third"
        | "final"
      match_status: "scheduled" | "live" | "finished"
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
      match_phase: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter",
        "semi",
        "third",
        "final",
      ],
      match_status: ["scheduled", "live", "finished"],
    },
  },
} as const
