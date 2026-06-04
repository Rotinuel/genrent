// supabase/functions/scheduled-payouts/index.ts
// Deploy with: supabase functions deploy scheduled-payouts
// Schedule via Supabase Dashboard > Database > Scheduled Jobs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const PLATFORM_FEE = 0.15

async function paystackTransfer(payload: object) {
  const res = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return res.json()
}

Deno.serve(async () => {
  console.log('[scheduled-payouts] Starting payout run...')

  // Get completed bookings with no payout record (48h+ after completion)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, owner_payout, owner_id,
      owner:users!owner_id(full_name, paystack_subaccount_code)
    `)
    .eq('status', 'completed')
    .eq('payment_status', 'success')
    .lt('updated_at', cutoff)

  if (error) {
    console.error('[scheduled-payouts] Error fetching bookings:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Filter out already paid
  const { data: existingPayouts } = await supabase
    .from('payments')
    .select('booking_id')
    .eq('type', 'payout')
    .in('status', ['success', 'pending'])

  const paidIds = new Set((existingPayouts || []).map((p: any) => p.booking_id))
  const pending = (bookings || []).filter((b: any) => !paidIds.has(b.id))

  console.log(`[scheduled-payouts] ${pending.length} payouts to process`)

  let processed = 0
  let failed = 0

  for (const booking of pending) {
    if (!booking.owner?.paystack_subaccount_code || !booking.owner_payout) {
      console.warn(`[scheduled-payouts] Skipping ${booking.id} — no recipient code or payout amount`)
      continue
    }

    const reference = `PAYOUT_AUTO_${booking.id.slice(0, 8)}_${Date.now()}`

    try {
      const transfer = await paystackTransfer({
        source: 'balance',
        amount: Math.round(Number(booking.owner_payout) * 100),
        recipient: booking.owner.paystack_subaccount_code,
        reason: `GenRent auto-payout for booking ${booking.id.slice(0, 8)}`,
        reference,
      })

      await supabase.from('payments').insert({
        booking_id: booking.id,
        user_id: booking.owner_id,
        paystack_ref: reference,
        amount: booking.owner_payout,
        type: 'payout',
        status: transfer.data?.status === 'success' ? 'success' : 'pending',
        metadata: transfer.data,
      })

      // Notify owner
      await supabase.from('notifications').insert({
        user_id: booking.owner_id,
        title: 'Payout Sent 💸',
        body: `₦${Number(booking.owner_payout).toLocaleString()} sent to your bank.`,
        type: 'payout',
      })

      processed++
    } catch (err) {
      console.error(`[scheduled-payouts] Failed for ${booking.id}:`, err)
      failed++
    }
  }

  return new Response(
    JSON.stringify({ processed, failed, total: pending.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
