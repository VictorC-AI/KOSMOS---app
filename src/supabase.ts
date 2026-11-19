import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// null quando o .env.local não foi preenchido: o App mostra como resolver.
export const supabase = url && chave ? createClient(url, chave) : null
