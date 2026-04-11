import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null

export const supabaseBucket =
  (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) ||
  'portfolio-images'

export const portfolioTable =
  (import.meta.env.VITE_SUPABASE_PORTFOLIO_TABLE as string | undefined) ||
  'portfolio_content'

export const adminUsersTable =
  (import.meta.env.VITE_SUPABASE_ADMIN_USERS_TABLE as string | undefined) ||
  'admin_users'
