import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { config } from './config'

export const supabase = createClient<Database>(
  config.supabase.url!,
  config.supabase.anonKey!
)

// Client for server-side operations
export const createServerClient = () => {
  return createClient<Database>(
    config.supabase.url!,
    config.supabase.serviceRoleKey!
  )
}
