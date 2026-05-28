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
      achievements: {
        Row: {
          code: string
          description: string
          icon_url: string | null
          id: string
          name: string
          rarity: string
          xp_reward: number
        }
        Insert: {
          code: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          rarity: string
          xp_reward?: number
        }
        Update: {
          code?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          tokens_estimated: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          pool_id: string
          reactions: Json | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          pool_id: string
          reactions?: Json | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          pool_id?: string
          reactions?: Json | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collected_cards: {
        Row: {
          acquired_at: string | null
          level: number | null
          team_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          level?: number | null
          team_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          level?: number | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collected_cards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collected_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quiz: {
        Row: {
          correct_index: number
          created_at: string | null
          date: string
          difficulty: string | null
          fact: string | null
          id: string
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string | null
          date?: string
          difficulty?: string | null
          fact?: string | null
          id?: string
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string | null
          date?: string
          difficulty?: string | null
          fact?: string | null
          id?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      fantasy_lineup_players: {
        Row: {
          is_bench: boolean | null
          lineup_id: string
          player_id: string
          slot: string
        }
        Insert: {
          is_bench?: boolean | null
          lineup_id: string
          player_id: string
          slot: string
        }
        Update: {
          is_bench?: boolean | null
          lineup_id?: string
          player_id?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_lineup_players_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "fantasy_lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineup_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_lineups: {
        Row: {
          budget_used: number | null
          captain_id: string | null
          created_at: string | null
          formation: string | null
          gameweek: number
          id: string
          locked_at: string | null
          pool_id: string
          total_points: number | null
          user_id: string
          vice_captain_id: string | null
        }
        Insert: {
          budget_used?: number | null
          captain_id?: string | null
          created_at?: string | null
          formation?: string | null
          gameweek: number
          id?: string
          locked_at?: string | null
          pool_id: string
          total_points?: number | null
          user_id: string
          vice_captain_id?: string | null
        }
        Update: {
          budget_used?: number | null
          captain_id?: string | null
          created_at?: string | null
          formation?: string | null
          gameweek?: number
          id?: string
          locked_at?: string | null
          pool_id?: string
          total_points?: number | null
          user_id?: string
          vice_captain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_lineups_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineups_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineups_vice_captain_id_fkey"
            columns: ["vice_captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_transfers: {
        Row: {
          cost_points: number | null
          created_at: string | null
          gameweek: number
          id: string
          in_player_id: string
          out_player_id: string
          pool_id: string
          used_free_transfer: boolean | null
          user_id: string
        }
        Insert: {
          cost_points?: number | null
          created_at?: string | null
          gameweek: number
          id?: string
          in_player_id: string
          out_player_id: string
          pool_id: string
          used_free_transfer?: boolean | null
          user_id: string
        }
        Update: {
          cost_points?: number | null
          created_at?: string | null
          gameweek?: number
          id?: string
          in_player_id?: string
          out_player_id?: string
          pool_id?: string
          used_free_transfer?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_transfers_in_player_id_fkey"
            columns: ["in_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_transfers_out_player_id_fkey"
            columns: ["out_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_transfers_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_transfers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          city: string | null
          country: string | null
          external_api_id: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string | null
          phase: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label: string | null
          stadium: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          venue_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          city?: string | null
          country?: string | null
          external_api_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string | null
          phase?: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label?: string | null
          stadium?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          venue_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          city?: string | null
          country?: string | null
          external_api_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string | null
          phase?: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label?: string | null
          stadium?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          venue_id?: string | null
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
          {
            foreignKeyName: "matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      mural_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          pool_id: string
          target_user_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pool_id: string
          target_user_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pool_id?: string
          target_user_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mural_posts_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_posts_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      player_match_stats: {
        Row: {
          assists: number | null
          bonus_points: number | null
          clean_sheet: boolean | null
          created_at: string | null
          goals: number | null
          id: string
          match_id: string
          minutes_played: number | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_saved: number | null
          player_id: string
          red_cards: number | null
          saves: number | null
          total_points: number | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus_points?: number | null
          clean_sheet?: boolean | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id: string
          minutes_played?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id: string
          red_cards?: number | null
          saves?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus_points?: number | null
          clean_sheet?: boolean | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string
          minutes_played?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: string
          red_cards?: number | null
          saves?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
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
          invited_by: string | null
          joined_at: string | null
          pool_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          invited_by?: string | null
          joined_at?: string | null
          pool_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          invited_by?: string | null
          joined_at?: string | null
          pool_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          fantasy_scoring_config: Json | null
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
          fantasy_scoring_config?: Json | null
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
          fantasy_scoring_config?: Json | null
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
      predictions_bracket: {
        Row: {
          bracket_json: Json
          created_at: string | null
          id: string
          locked_at: string | null
          points_awarded: number | null
          pool_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bracket_json: Json
          created_at?: string | null
          id?: string
          locked_at?: string | null
          points_awarded?: number | null
          pool_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bracket_json?: Json
          created_at?: string | null
          id?: string
          locked_at?: string | null
          points_awarded?: number | null
          pool_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_bracket_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_bracket_user_id_fkey"
            columns: ["user_id"]
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
      predictions_pickem: {
        Row: {
          created_at: string | null
          id: string
          locked_at: string | null
          match_id: string
          points_awarded: number | null
          pool_id: string
          updated_at: string | null
          user_id: string
          winner: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          locked_at?: string | null
          match_id: string
          points_awarded?: number | null
          pool_id: string
          updated_at?: string | null
          user_id: string
          winner: string
        }
        Update: {
          created_at?: string | null
          id?: string
          locked_at?: string | null
          match_id?: string
          points_awarded?: number | null
          pool_id?: string
          updated_at?: string | null
          user_id?: string
          winner?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_pickem_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_pickem_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_pickem_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions_props: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          locked_at: string | null
          points_awarded: number | null
          pool_id: string
          prop_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          locked_at?: string | null
          points_awarded?: number | null
          pool_id: string
          prop_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          locked_at?: string | null
          points_awarded?: number | null
          pool_id?: string
          prop_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_props_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_props_prop_id_fkey"
            columns: ["prop_id"]
            isOneToOne: false
            referencedRelation: "props"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_props_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions_survivor: {
        Row: {
          created_at: string | null
          id: string
          locked_at: string | null
          pool_id: string
          result: string | null
          round_number: number
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          locked_at?: string | null
          pool_id: string
          result?: string | null
          round_number: number
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          locked_at?: string | null
          pool_id?: string
          result?: string | null
          round_number?: number
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_survivor_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_survivor_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_survivor_user_id_fkey"
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
          last_quiz_date: string | null
          league_tier: string | null
          name: string | null
          quiz_streak: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_team_id?: string | null
          id: string
          last_quiz_date?: string | null
          league_tier?: string | null
          name?: string | null
          quiz_streak?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_team_id?: string | null
          id?: string
          last_quiz_date?: string | null
          league_tier?: string | null
          name?: string | null
          quiz_streak?: number | null
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
      props: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          options_jsonb: Json | null
          points: number | null
          question: string
          resolved_at: string | null
          resolved_value: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          options_jsonb?: Json | null
          points?: number | null
          question: string
          resolved_at?: string | null
          resolved_value?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          options_jsonb?: Json | null
          points?: number | null
          question?: string
          resolved_at?: string | null
          resolved_value?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
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
      quiz_answers: {
        Row: {
          answer_index: number
          answered_at: string | null
          id: string
          is_correct: boolean
          quiz_id: string | null
          user_id: string | null
        }
        Insert: {
          answer_index: number
          answered_at?: string | null
          id?: string
          is_correct: boolean
          quiz_id?: string | null
          user_id?: string | null
        }
        Update: {
          answer_index?: number
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          quiz_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "daily_quiz"
            referencedColumns: ["id"]
          },
        ]
      }
      survivor_rounds: {
        Row: {
          created_at: string | null
          ends_at: string
          id: string
          match_ids: string[]
          pool_id: string
          round_number: number
          starts_at: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          id?: string
          match_ids: string[]
          pool_id: string
          round_number: number
          starts_at: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          id?: string
          match_ids?: string[]
          pool_id?: string
          round_number?: number
          starts_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survivor_rounds_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string
          external_api_id: string | null
          fifa_ranking: number | null
          flag_url: string
          group_letter: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          external_api_id?: string | null
          fifa_ranking?: number | null
          flag_url: string
          group_letter?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          external_api_id?: string | null
          fifa_ranking?: number | null
          flag_url?: string
          group_letter?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          pool_id: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          pool_id?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          pool_id?: string | null
          unlocked_at?: string | null
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
          {
            foreignKeyName: "user_achievements_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string
          country: string
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          state: string | null
        }
        Insert: {
          capacity?: number | null
          city: string
          country: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          state?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          state?: string | null
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
    }
    Functions: {
      advance_survivor: { Args: { p_match_id: string }; Returns: undefined }
      award_bracket_points: { Args: { p_pool_id: string }; Returns: undefined }
      award_card: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      award_pickem_points: { Args: { p_match_id: string }; Returns: undefined }
      award_points_for_match: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      award_points_for_prop: {
        Args: { p_prop_id: string; p_resolved_value: string }
        Returns: undefined
      }
      create_pool_with_owner: {
        Args: {
          p_invite_code: string
          p_modes_enabled: string[]
          p_name: string
          p_scope_config: Json
          p_scope_type: string
          p_scoring_config: Json
          p_type: string
        }
        Returns: {
          id: string
          invite_code: string
          name: string
          owner_id: string
        }[]
      }
      delete_pool: { Args: { p_pool_id: string }; Returns: undefined }
      get_cron_headers: { Args: never; Returns: Json }
      increment_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      initialize_survivor_rounds: {
        Args: { p_pool_id: string }
        Returns: undefined
      }
      is_pool_admin: {
        Args: { p_pool_id: string; p_user_id: string }
        Returns: boolean
      }
      is_pool_member: {
        Args: { p_pool_id: string; p_user_id: string }
        Returns: boolean
      }
      leave_pool: { Args: { p_pool_id: string }; Returns: undefined }
      lock_predictions_for_match: {
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
          external_api_id: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string | null
          phase: Database["public"]["Enums"]["match_phase"] | null
          placeholder_label: string | null
          stadium: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          venue_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "matches"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      refresh_leaderboard_view: { Args: never; Returns: undefined }
      toggle_chat_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: undefined
      }
      transfer_pool_ownership: {
        Args: { p_new_owner: string; p_pool_id: string }
        Returns: undefined
      }
      update_quiz_streak: { Args: { p_user_id: string }; Returns: undefined }
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
