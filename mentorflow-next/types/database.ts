// Supabase generated types placeholder.
// Replace with: npx supabase gen types typescript --project-id <ref> > types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          id: string
          entry_date: string | null
          mood: string | null
          takipci: number | null
          mail: number | null
          icerik: number | null
          reklam: number | null
          tpm: number | null
          hotlist: number | null
          musteri: number | null
          teklif: number | null
          alinan: number | null
          anlasma: number | null
          yorum: string | null
          win: string | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          entry_date?: string | null
          mood?: string | null
          takipci?: number | null
          mail?: number | null
          icerik?: number | null
          reklam?: number | null
          tpm?: number | null
          hotlist?: number | null
          musteri?: number | null
          teklif?: number | null
          alinan?: number | null
          anlasma?: number | null
          yorum?: string | null
          win?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          entry_date?: string | null
          mood?: string | null
          takipci?: number | null
          mail?: number | null
          icerik?: number | null
          reklam?: number | null
          tpm?: number | null
          hotlist?: number | null
          musteri?: number | null
          teklif?: number | null
          alinan?: number | null
          anlasma?: number | null
          yorum?: string | null
          win?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          name: string | null
          date: string | null
          icon: string | null
          done: boolean | null
          notes: Json | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          date?: string | null
          icon?: string | null
          done?: boolean | null
          notes?: Json | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          date?: string | null
          icon?: string | null
          done?: boolean | null
          notes?: Json | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          id: string
          title: string | null
          date: string | null
          status: string | null
          notes: Json | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          date?: string | null
          status?: string | null
          notes?: Json | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          date?: string | null
          status?: string | null
          notes?: Json | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
