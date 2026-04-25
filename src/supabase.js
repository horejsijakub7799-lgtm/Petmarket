import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbybizuigbweludbowuf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieWJpenVpZ2J3ZWx1ZGJvd3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzIyNzIsImV4cCI6MjA5MTMwODI3Mn0.T_A8pVwPTXpMWzxqmXa1SrKvJjCYzh91dG9X5nDZbW8'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})