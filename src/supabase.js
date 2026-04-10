import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbybizuigbweludbowuf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iTrudcPc8hSsjHGNUcMFZQ_zuFHGZen'

export const supabase = createClient(supabaseUrl, supabaseKey)