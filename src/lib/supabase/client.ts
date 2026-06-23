import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client. Reads env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 * Until configured, this is `null` and the app runs on the mock store
 * (`src/stores/data.ts`). When the keys are set, the data layer can switch
 * its reads/writes to Supabase without UI changes.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
