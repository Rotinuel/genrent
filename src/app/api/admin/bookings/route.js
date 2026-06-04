import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/bookings
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
      .from('v_bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)

    if (q) {
      // Search by partial booking ID, renter name, or owner name
      query = query.or(
        `id.ilike.%${q}%,renter_name.ilike.%${q}%,owner_name.ilike.%${q}%,generator_title.ilike.%${q}%`
      )
    }

    const { data: bookings, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      bookings,
      total: count,
      page,
      pages: Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
