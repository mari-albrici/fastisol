import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isManagementConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://configuration-required.supabase.co',
  supabaseAnonKey || 'configuration-required',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

export function getManagementLoginEmail(username: string) {
  const normalizedUsername = username.trim()
  const configuredUsername = import.meta.env.VITE_MANAGEMENT_USERNAME?.trim() ?? ''
  const configuredEmail = import.meta.env.VITE_MANAGEMENT_EMAIL?.trim() ?? ''

  if (normalizedUsername.includes('@')) return normalizedUsername
  if (configuredUsername && normalizedUsername === configuredUsername && configuredEmail) return configuredEmail
  return normalizedUsername
}

