import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    // Změň 'users' na nějakou tabulku, kterou máš v DB
    // Například 'partners', 'products' - cokoliv co máš
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (error) throw error

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase pinged successfully'
    })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return res.status(500).json({ error: error.message })
  }
}