import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Variables de entorno de Supabase no encontradas. ' +
    'Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          code: string
          teacher_id: string | null
          mission_title: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          teacher_id?: string | null
          mission_title: string
          is_active?: boolean
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          session_id: string
          nickname: string
          xp: number
          streak: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          nickname: string
          xp?: number
          streak?: number
          created_at?: string
        }
      }
      reading_texts: {
        Row: {
          id: string
          title: string
          content: string
          level: 'basic' | 'intermediate' | 'advanced'
          base_group_id: string | null
        }
      }
      student_progress: {
        Row: {
          id: string
          student_id: string
          gnosis_pre: number | null
          gnosis_post: number | null
          evidences_collected: any[]
          draft_text: string | null
          ai_feedback: any[]
          final_text: string | null
          reflection: string | null
          updated_at: string
        }
      }
    }
  }
}
