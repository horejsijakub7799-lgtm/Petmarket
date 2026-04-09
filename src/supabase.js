import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qbybizuigbweludbowuf.supabase.co'
const supabaseKey = 'sb_publishable_iTrudcPc8hSsjHGNUcMFZQ_zuFHGZen'

export const supabase = createClient(supabaseUrl, supabaseKey)