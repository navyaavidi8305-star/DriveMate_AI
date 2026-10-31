import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('http')

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = !!isConfigured

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase is not configured. Please update .env with your Supabase URL and anon key.'
  )
}
