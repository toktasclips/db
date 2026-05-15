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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
