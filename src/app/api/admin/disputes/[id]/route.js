import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/notifications'

// PATCH /api/admin/disputes/[id]
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAuth(['admin'])
    const { id } = await params
    const { status, resolution } = await request.json()

    const validStatuses = ['investigating', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    if ((status === 'resolved') && !resolution?.trim()) {
      return NextResponse.json({ error: 'A resolution note is required to resolve a dispute' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const updates = { status }
    if (resolution) updates.resolution = resolution
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_by = admin.id
      updates.resolved_at = new Date().toISOString()
    }

    const { data: dispute, error } = await supabase
      .from('disputes')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        raiser:users!raised_by(id, full_name, email, role),
        booking:bookings!booking_id(
          id, total_amount, start_date, end_date,
          renter:users!renter_id(id, full_name, email),
          owner:users!owner_id(id, full_name, email),
          generator:generators!generator_id(title)
        )
      `)
      .single()

    if (error) throw error

    // If resolved/closed, update booking status and notify both parties
    if (status === 'resolved' || status === 'closed') {
      // Revert booking to completed if it was disputed
      await supabase
        .from('bookings')
        .update({ status: status === 'resolved' ? 'completed' : 'cancelled' })
        .eq('id', dispute.booking_id)
        .eq('status', 'disputed')

      // Notify raiser
      if (dispute.raiser?.email) {
        sendEmail({
          to: dispute.raiser.email,
          subject: `Your dispute has been ${status} — GenRent`,
          html: `
            <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;max-width:560px">
              <h2 style="color:#ff7d11">Dispute ${status === 'resolved' ? 'Resolved ✓' : 'Closed'}</h2>
              <p>Hi ${dispute.raiser.full_name},</p>
              <p>Your dispute regarding <strong>${dispute.booking?.generator?.title}</strong> has been <strong>${status}</strong> by our team.</p>
              ${resolution ? `<div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0;border-left:3px solid #ff7d11"><p style="color:#a3a3a3;font-size:13px;margin:0"><strong>Admin note:</strong> ${resolution}</p></div>` : ''}
              <p>If you have further questions, please contact <a href="mailto:support@genrent.com" style="color:#ff7d11">support@genrent.com</a></p>
            </div>
          `,
        }).catch(console.error)
      }

      // Also notify the other party (renter or owner, whoever didn't raise it)
      const otherParty = dispute.raiser?.id === dispute.booking?.renter?.id
        ? dispute.booking?.owner
        : dispute.booking?.renter

      if (otherParty?.email) {
        sendEmail({
          to: otherParty.email,
          subject: `Dispute update for booking — GenRent`,
          html: `
            <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;max-width:560px">
              <h2 style="color:#ff7d11">Dispute ${status === 'resolved' ? 'Resolved' : 'Closed'}</h2>
              <p>Hi ${otherParty.full_name},</p>
              <p>A dispute filed for booking <strong>#${dispute.booking_id?.slice(0, 8)}</strong> (${dispute.booking?.generator?.title}) has been ${status}.</p>
              ${resolution ? `<p style="color:#a3a3a3;font-size:13px"><strong>Admin note:</strong> ${resolution}</p>` : ''}
            </div>
          `,
        }).catch(console.error)
      }

      // In-app notifications
      const notifs = []
      if (dispute.raised_by) {
        notifs.push({
          user_id: dispute.raised_by,
          title: `Dispute ${status === 'resolved' ? 'Resolved' : 'Closed'}`,
          body: resolution || `Your dispute has been ${status} by our team.`,
          type: 'dispute_update',
          link: `/renter/booking/${dispute.booking_id}`,
        })
      }
      if (otherParty?.id) {
        notifs.push({
          user_id: otherParty.id,
          title: 'Dispute Update',
          body: `A dispute for booking #${dispute.booking_id?.slice(0, 8)} has been ${status}.`,
          type: 'dispute_update',
        })
      }
      if (notifs.length) {
        await supabase.from('notifications').insert(notifs)
      }
    }

    // Flatten for response
    const flattened = {
      ...dispute,
      raiser_name: dispute.raiser?.full_name,
      raiser_role: dispute.raiser?.role,
      renter_name: dispute.booking?.renter?.full_name,
      owner_name: dispute.booking?.owner?.full_name,
      generator_title: dispute.booking?.generator?.title,
      booking_total: dispute.booking?.total_amount,
      booking_start: dispute.booking?.start_date,
      booking_end: dispute.booking?.end_date,
    }

    return NextResponse.json({ dispute: flattened })
  } catch (err) {
    console.error('[PATCH /api/admin/disputes/[id]]', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: err.status || 500 })
  }
}

// GET /api/admin/disputes/[id] — fetch single dispute with full detail
export async function GET(request, { params }) {
  try {
    await requireAuth(['admin'])
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: dispute, error } = await supabase
      .from('disputes')
      .select(`
        *,
        raiser:users!raised_by(id, full_name, email, role, avatar_url),
        resolver:users!resolved_by(id, full_name),
        booking:bookings!booking_id(
          id, start_date, end_date, total_amount, status, delivery_address,
          paystack_ref, payment_status,
          renter:users!renter_id(id, full_name, email, phone),
          owner:users!owner_id(id, full_name, email, phone),
          generator:generators!generator_id(id, title, kva, brand, photos)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    return NextResponse.json({ dispute })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
