import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { transferToOwner, createTransferRecipient, generateReference } from '@/lib/paystack'

// GET /api/admin/payouts — completed bookings pending payout
export async function GET() {
  try {
    await requireAuth(['admin'])
    const supabase = getSupabaseAdmin()

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        owner:users!owner_id(id, full_name, email, bank_account, paystack_subaccount_code),
        generator:generators!generator_id(title)
      `)
      .eq('status', 'completed')
      .eq('payment_status', 'success')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Mark each booking with its payout status from payments table
    const bookingIds = bookings.map(b => b.id)
    const { data: payouts } = await supabase
      .from('payments')
      .select('booking_id, status')
      .eq('type', 'payout')
      .in('booking_id', bookingIds)

    const paidSet = new Set(
      (payouts || []).filter(p => p.status === 'success').map(p => p.booking_id)
    )

    const mapped = bookings.map(b => ({
      ...b,
      generator_title: b.generator?.title,
      owner_name: b.owner?.full_name,
      payout_status: paidSet.has(b.id) ? 'paid' : 'pending',
    }))

    return NextResponse.json({ bookings: mapped })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// POST /api/admin/payouts — process payout for a booking
export async function POST(request) {
  try {
    await requireAuth(['admin'])
    const { booking_id } = await request.json()

    if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        owner:users!owner_id(id, full_name, email, bank_account, paystack_subaccount_code)
      `)
      .eq('id', booking_id)
      .eq('status', 'completed')
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found or not completed' }, { status: 404 })
    }

    if (!booking.owner?.bank_account) {
      return NextResponse.json({ error: 'Owner has no bank account on file' }, { status: 400 })
    }

    // Check not already paid
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('type', 'payout')
      .eq('status', 'success')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Payout already processed for this booking' }, { status: 409 })
    }

    // Get or create Paystack transfer recipient
    let recipientCode = booking.owner.paystack_subaccount_code

    if (!recipientCode) {
      const { account_number, bank_code } = booking.owner.bank_account
      const recipient = await createTransferRecipient({
        name: booking.owner.full_name,
        account_number,
        bank_code,
      })
      recipientCode = recipient.recipient_code

      // Save recipient code
      await supabase
        .from('users')
        .update({ paystack_subaccount_code: recipientCode })
        .eq('id', booking.owner_id)
    }

    const reference = generateReference('PAYOUT')

    // Initiate transfer
    const transfer = await transferToOwner({
      amount: booking.owner_payout,
      recipient_code: recipientCode,
      reason: `GenRent payout for booking ${booking_id.slice(0, 8)}`,
      reference,
    })

    // Record payment
    await supabase.from('payments').insert({
      booking_id,
      user_id: booking.owner_id,
      paystack_ref: reference,
      amount: booking.owner_payout,
      type: 'payout',
      status: transfer.status === 'success' ? 'success' : 'pending',
      metadata: transfer,
    })

    // Notify owner
    await supabase.from('notifications').insert({
      user_id: booking.owner_id,
      title: 'Payout Sent! 💸',
      body: `₦${Number(booking.owner_payout).toLocaleString()} has been sent to your bank account.`,
      type: 'payout',
    })

    return NextResponse.json({ success: true, transfer })
  } catch (err) {
    console.error('[POST /api/admin/payouts]', err)
    return NextResponse.json({ error: err.message || 'Payout failed' }, { status: 500 })
  }
}
