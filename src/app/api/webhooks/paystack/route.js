import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabase = getSupabaseAdmin()

    switch (event.event) {
      case 'charge.success': {
        const { reference, amount, customer } = event.data
        // Already handled in /verify, but catch here as fallback
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, payment_status')
          .eq('paystack_ref', reference)
          .single()

        if (booking && booking.payment_status !== 'success') {
          await supabase
            .from('bookings')
            .update({ payment_status: 'success', status: 'confirmed' })
            .eq('id', booking.id)
        }
        break
      }

      case 'transfer.success': {
        const { reference } = event.data
        await supabase
          .from('payments')
          .update({ status: 'success' })
          .eq('paystack_ref', reference)
          .eq('type', 'payout')
        break
      }

      case 'transfer.failed':
      case 'transfer.reversed': {
        const { reference } = event.data
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('paystack_ref', reference)
          .eq('type', 'payout')
        break
      }

      case 'refund.processed': {
        const { transaction_reference } = event.data
        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('paystack_ref', transaction_reference)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[POST /api/webhooks/paystack]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
