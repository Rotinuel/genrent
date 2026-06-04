import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyPayment } from '@/lib/paystack'
import { sendEmail, emailTemplates } from '@/lib/notifications'

// GET /api/payments/verify?ref=XXX — Paystack redirect callback
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref') || searchParams.get('reference')

  if (!ref) {
    return NextResponse.redirect(new URL('/renter/bookings?error=invalid_ref', request.url))
  }

  try {
    const payment = await verifyPayment(ref)

    if (payment.status !== 'success') {
      return NextResponse.redirect(new URL(`/renter/bookings?error=payment_failed&ref=${ref}`, request.url))
    }

    const supabase = getSupabaseAdmin()

    // Find booking by ref
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, renter:users!renter_id(email, full_name), owner:users!owner_id(email, full_name), generator:generators!generator_id(title)')
      .eq('paystack_ref', ref)
      .single()

    if (!booking) {
      return NextResponse.redirect(new URL('/renter/bookings?error=booking_not_found', request.url))
    }

    if (booking.payment_status === 'success') {
      return NextResponse.redirect(new URL(`/renter/booking/${booking.id}?paid=1`, request.url))
    }

    // Update booking and create payment record
    await supabase
      .from('bookings')
      .update({ payment_status: 'success', status: 'confirmed' })
      .eq('id', booking.id)

    await supabase.from('payments').insert({
      booking_id: booking.id,
      user_id: booking.renter_id,
      paystack_ref: ref,
      amount: booking.total_amount,
      type: 'charge',
      status: 'success',
      metadata: payment,
    })

    // Block availability
    await supabase.from('availability_blocks').insert({
      generator_id: booking.generator_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      reason: 'booking',
      booking_id: booking.id,
    })

    // Send confirmation emails (non-blocking)
    const renterTmpl = emailTemplates.bookingConfirmed({
      renter_name: booking.renter.full_name,
      generator_title: booking.generator.title,
      start_date: booking.start_date,
      end_date: booking.end_date,
      total: booking.total_amount,
      booking_id: booking.id,
    })
    sendEmail({ to: booking.renter.email, ...renterTmpl }).catch(console.error)

    const ownerTmpl = emailTemplates.ownerNewBooking({
      owner_name: booking.owner.full_name,
      renter_name: booking.renter.full_name,
      generator_title: booking.generator.title,
      start_date: booking.start_date,
      end_date: booking.end_date,
      payout: booking.owner_payout,
      booking_id: booking.id,
    })
    sendEmail({ to: booking.owner.email, ...ownerTmpl }).catch(console.error)

    // Create in-app notification
    await supabase.from('notifications').insert([
      {
        user_id: booking.renter_id,
        title: 'Booking Confirmed!',
        body: `Your booking for ${booking.generator.title} has been confirmed.`,
        type: 'booking_confirmed',
        link: `/renter/booking/${booking.id}`,
      },
      {
        user_id: booking.owner_id,
        title: 'New Booking!',
        body: `${booking.renter.full_name} booked your generator.`,
        type: 'new_booking',
        link: `/owner/dashboard`,
      },
    ])

    return NextResponse.redirect(new URL(`/renter/booking/${booking.id}?paid=1`, request.url))
  } catch (err) {
    console.error('[GET /api/payments/verify]', err)
    return NextResponse.redirect(new URL('/renter/bookings?error=server_error', request.url))
  }
}
