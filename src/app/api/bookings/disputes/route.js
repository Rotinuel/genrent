import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// POST /api/bookings/disputes — file a dispute
export async function POST(request) {
  try {
    const user = await requireAuth(['renter', 'owner'])
    const { booking_id, reason, description } = await request.json()

    if (!booking_id || !reason) {
      return NextResponse.json({ error: 'booking_id and reason are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify user is party to the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, renter_id, owner_id, status')
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isParty = booking.renter_id === user.id || booking.owner_id === user.id
    if (!isParty) {
      return NextResponse.json({ error: 'You are not a party to this booking' }, { status: 403 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot file a dispute on a cancelled booking' }, { status: 400 })
    }

    // Check no existing open dispute
    const { data: existing } = await supabase
      .from('disputes')
      .select('id')
      .eq('booking_id', booking_id)
      .in('status', ['open', 'investigating'])
      .single()

    if (existing) {
      return NextResponse.json({ error: 'A dispute is already open for this booking' }, { status: 409 })
    }

    // Create dispute
    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        booking_id,
        raised_by: user.id,
        reason,
        description: description || null,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'disputed' })
      .eq('id', booking_id)

    // Notify admin (create in-app notification for all admins)
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: 'New Dispute Filed',
          body: `${user.full_name} filed a dispute: "${reason}"`,
          type: 'new_dispute',
          link: `/admin/disputes`,
        }))
      )
    }

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bookings/disputes]', err)
    return NextResponse.json({ error: err.message || 'Failed to file dispute' }, { status: 500 })
  }
}

// GET /api/bookings/disputes — list disputes for current user
export async function GET(request) {
  try {
    const user = await requireAuth()
    const supabase = getSupabaseAdmin()

    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        *,
        booking:bookings!booking_id(
          id, start_date, end_date,
          generator:generators!generator_id(title, kva, photos)
        )
      `)
      .eq('raised_by', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ disputes })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
