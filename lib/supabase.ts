import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: number
          name: string
          location: string
          status: string
          priority: string
          message: string | null
          category: string | null
          latitude: number | null
          longitude: number | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          location: string
          status: string
          priority?: string
          message?: string | null
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          location?: string
          status?: string
          priority?: string
          message?: string | null
          category?: string | null
          latitude?: number | null
          longitude?: number | null
          user_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
