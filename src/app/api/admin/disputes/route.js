import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/disputes
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
      .from('disputes')
      .select(`
        *,
        raiser:users!raised_by(id, full_name, role),
        booking:bookings!booking_id(
          id, start_date, end_date, total_amount, status,
          renter:users!renter_id(id, full_name),
          owner:users!owner_id(id, full_name),
          generator:generators!generator_id(title, kva)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)
    if (q) query = query.or(`reason.ilike.%${q}%,description.ilike.%${q}%`)

    const { data: raw, error, count } = await query
    if (error) throw error

    // Flatten for convenience
    const disputes = (raw || []).map(d => ({
      ...d,
      raiser_name: d.raiser?.full_name,
      raiser_role: d.raiser?.role,
      renter_name: d.booking?.renter?.full_name,
      owner_name: d.booking?.owner?.full_name,
      generator_title: d.booking?.generator?.title,
      booking_total: d.booking?.total_amount,
      booking_start: d.booking?.start_date,
      booking_end: d.booking?.end_date,
    }))

    return NextResponse.json({ disputes, total: count, page, pages: Math.ceil((count || 0) / limit) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/admin/disputes — admin creates a dispute on behalf of a user (rare)
export async function POST(request) {
  try {
    await requireAuth(['admin'])
    const body = await request.json()
    const { booking_id, raised_by, reason, description } = body

    if (!booking_id || !raised_by || !reason) {
      return NextResponse.json({ error: 'booking_id, raised_by, and reason are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({ booking_id, raised_by, reason, description, status: 'open' })
      .select()
      .single()

    if (error) throw error

    // Also update booking status to disputed
    await supabase
      .from('bookings')
      .update({ status: 'disputed' })
      .eq('id', booking_id)

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
