import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/listings
export async function GET(request) {
  try {
    await requireAuth(['admin'])
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 30

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('generators')
      .select(`
        *,
        owner:users!owner_id(id, full_name, email, bank_account)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)
    if (q) query = query.ilike('title', `%${q}%`)

    const { data: listings, error, count } = await query
    if (error) throw error

    // Flatten owner_name for convenience
    const mapped = listings.map(l => ({
      ...l,
      owner_name: l.owner?.full_name,
    }))

    return NextResponse.json({ listings: mapped, total: count })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
