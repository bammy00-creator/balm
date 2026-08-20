export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          branch_id: string
          clinic_id: string
          created_at: string
          id: string
          note: string | null
          resolved_at: string | null
          resolved_by: string | null
          response_id: string
          status: Database["public"]["Enums"]["alert_status"]
        }
        Insert: {
          branch_id: string
          clinic_id: string
          created_at?: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id: string
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Update: {
          branch_id?: string
          clinic_id?: string
          created_at?: string
          id?: string
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id?: string
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          clinic_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          lga: string | null
          logo_url: string | null
          monthly_response_limit: number
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["clinic_plan"]
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lga?: string | null
          logo_url?: string | null
          monthly_response_limit?: number
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["clinic_plan"]
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lga?: string | null
          logo_url?: string | null
          monthly_response_limit?: number
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["clinic_plan"]
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
        }
        Relationships: []
      }
      feedback_links: {
        Row: {
          branch_id: string
          channel: Database["public"]["Enums"]["link_channel"]
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          token: string
        }
        Insert: {
          branch_id: string
          channel?: Database["public"]["Enums"]["link_channel"]
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          token?: string
        }
        Update: {
          branch_id?: string
          channel?: Database["public"]["Enums"]["link_channel"]
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_links_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_links_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          clinic_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["profile_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          clinic_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role: Database["public"]["Enums"]["profile_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          clinic_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          branch_id: string
          clinic_id: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: string | null
        }
        Insert: {
          branch_id: string
          clinic_id: string
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: string | null
        }
        Update: {
          branch_id?: string
          clinic_id?: string
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      public_reviews: {
        Row: {
          body: string | null
          clinic_id: string
          created_at: string
          display_name: string
          id: string
          published_at: string
          response_id: string
          score: number
        }
        Insert: {
          body?: string | null
          clinic_id: string
          created_at?: string
          display_name: string
          id?: string
          published_at?: string
          response_id: string
          score: number
        }
        Update: {
          body?: string | null
          clinic_id?: string
          created_at?: string
          display_name?: string
          id?: string
          published_at?: string
          response_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_reviews_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          branch_id: string
          clinic_id: string
          comment: string | null
          comment_flagged: boolean
          composite_score: number
          consent_to_publish: boolean
          created_at: string
          id: string
          link_id: string | null
          patient_name: string | null
          patient_phone: string | null
          provider_id: string | null
          publish_status: Database["public"]["Enums"]["publish_status"]
          respect_score: number
          return_intent: Database["public"]["Enums"]["return_intent"]
          source_ip_hash: string | null
          wait_band: Database["public"]["Enums"]["wait_band"]
        }
        Insert: {
          branch_id: string
          clinic_id: string
          comment?: string | null
          comment_flagged?: boolean
          composite_score?: number
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          link_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          provider_id?: string | null
          publish_status?: Database["public"]["Enums"]["publish_status"]
          respect_score: number
          return_intent: Database["public"]["Enums"]["return_intent"]
          source_ip_hash?: string | null
          wait_band: Database["public"]["Enums"]["wait_band"]
        }
        Update: {
          branch_id?: string
          clinic_id?: string
          comment?: string | null
          comment_flagged?: boolean
          composite_score?: number
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          link_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          provider_id?: string | null
          publish_status?: Database["public"]["Enums"]["publish_status"]
          respect_score?: number
          return_intent?: Database["public"]["Enums"]["return_intent"]
          source_ip_hash?: string | null
          wait_band?: Database["public"]["Enums"]["wait_band"]
        }
        Relationships: [
          {
            foreignKeyName: "responses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "feedback_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      alert_recipient_emails: {
        Args: { p_branch_id: string; p_clinic_id: string }
        Returns: string[]
      }
      comment_looks_clinical: { Args: { p_comment: string }; Returns: boolean }
      compute_composite_score: {
        Args: {
          p_respect_score: number
          p_return_intent: Database["public"]["Enums"]["return_intent"]
          p_wait_band: Database["public"]["Enums"]["wait_band"]
        }
        Returns: number
      }
      create_clinic_with_owner: {
        Args: {
          p_address: string | null
          p_email: string | null
          p_lga: string | null
          p_name: string
          p_phone: string | null
          p_slug: string
          p_state: string | null
        }
        Returns: string
      }
      dashboard_summary: { Args: { p_since: string }; Returns: Json }
      generate_short_token: { Args: Record<PropertyKey, never>; Returns: string }
      redact_expired_patient_contact: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      alert_status: "open" | "resolved" | "ignored"
      clinic_plan: "free" | "paid"
      clinic_status: "active" | "suspended"
      link_channel: "qr" | "whatsapp" | "sms" | "other"
      profile_role: "owner" | "staff" | "admin"
      publish_status: "none" | "pending" | "approved" | "rejected" | "published"
      return_intent: "yes" | "maybe" | "no"
      wait_band: "under_15" | "15_to_30" | "30_to_60" | "over_60"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
