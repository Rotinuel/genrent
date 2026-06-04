import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/listings/mine — owner's own listings (all statuses)
export async function GET() {
  try {
    const user = await requireAuth(['owner', 'admin'])
    const supabase = getSupabaseAdmin()

    const { data: listings, error } = await supabase
      .from('generators')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ listings })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
