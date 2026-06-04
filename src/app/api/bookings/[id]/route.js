import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { sendEmail, emailTemplates } from '@/lib/notifications'

// GET /api/bookings/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const supabase = getSupabaseAdmin()

    const { data: booking, error } = await supabase
      .from('v_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only involved parties can view
    const canView = [booking.renter_id, booking.owner_id, booking.driver_id].includes(user.id) || user.role === 'admin'
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ booking })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: err.status || 500 })
  }
}

// PATCH /api/bookings/[id] — status transitions
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const { action, reason } = await request.json()
    const supabase = getSupabaseAdmin()

    const { data: booking, error } = await supabase
      .from('v_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates = {}

    if (action === 'confirm' && user.id === booking.owner_id && booking.status === 'pending') {
      updates.status = 'confirmed'
    } else if (action === 'activate' && user.role === 'admin' && booking.status === 'confirmed') {
      updates.status = 'active'
    } else if (action === 'complete' && (user.id === booking.owner_id || user.role === 'admin') && booking.status === 'active') {
      updates.status = 'completed'
    } else if (action === 'cancel' && booking.status !== 'completed') {
      const canCancel = user.id === booking.renter_id || user.id === booking.owner_id || user.role === 'admin'
      if (!canCancel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      updates.status = 'cancelled'
      updates.cancelled_by = user.id
      updates.cancellation_reason = reason || 'No reason provided'
    } else if (action === 'dispute' && (user.id === booking.renter_id || user.id === booking.owner_id)) {
      updates.status = 'disputed'
    } else {
      return NextResponse.json({ error: 'Invalid action or unauthorized' }, { status: 400 })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Release availability block on cancel
    if (action === 'cancel') {
      await supabase
        .from('availability_blocks')
        .delete()
        .eq('booking_id', id)
    }

    return NextResponse.json({ booking: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}
