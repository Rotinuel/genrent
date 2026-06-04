// supabase/functions/booking-reminders/index.ts
// Runs daily to send reminders for upcoming bookings

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')!
const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@genrent.com'

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'GenRent' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
}

Deno.serve(async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Bookings starting tomorrow
  const { data: upcoming } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, delivery_address,
      generator:generators!generator_id(title, kva),
      renter:users!renter_id(full_name, email),
      owner:users!owner_id(full_name, email, phone)
    `)
    .eq('start_date', tomorrowStr)
    .eq('status', 'confirmed')

  let sent = 0

  for (const b of upcoming || []) {
    // Remind renter
    if (b.renter?.email) {
      await sendEmail(
        b.renter.email,
        `Reminder: Your generator rental starts tomorrow`,
        `<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px">
          <h2 style="color:#ff7d11">Your Rental Starts Tomorrow ⚡</h2>
          <p>Hi ${b.renter.full_name},</p>
          <p>Your <strong>${b.generator?.title}</strong> rental starts on <strong>${b.start_date}</strong>.</p>
          <p>Delivery to: <strong>${b.delivery_address}</strong></p>
          <p>If you have questions, contact the owner: ${b.owner?.full_name} (${b.owner?.phone || 'see platform'})</p>
        </div>`
      )
      sent++
    }

    // Remind owner
    if (b.owner?.email) {
      await sendEmail(
        b.owner.email,
        `Reminder: Rental starts tomorrow — ${b.generator?.title}`,
        `<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px">
          <h2 style="color:#ff7d11">Rental Starts Tomorrow ⚡</h2>
          <p>Hi ${b.owner.full_name},</p>
          <p>A booking for your <strong>${b.generator?.title}</strong> starts tomorrow (<strong>${b.start_date}</strong>).</p>
          <p>Renter: <strong>${b.renter?.full_name}</strong></p>
          <p>Delivery to: <strong>${b.delivery_address}</strong></p>
          <p>Make sure the generator is ready and fuelled.</p>
        </div>`
      )
      sent++
    }
  }

  // Also prompt reviews for bookings completed 2 days ago
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const twoDaysStr = twoDaysAgo.toISOString().split('T')[0]

  const { data: completed } = await supabase
    .from('bookings')
    .select(`
      id,
      renter:users!renter_id(full_name, email)
    `)
    .eq('end_date', twoDaysStr)
    .eq('status', 'completed')

  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://genrent.com'

  for (const b of completed || []) {
    if (b.renter?.email) {
      await sendEmail(
        b.renter.email,
        'How was your rental? Leave a review',
        `<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px">
          <h2 style="color:#ff7d11">How Was Your Experience? ⭐</h2>
          <p>Hi ${b.renter.full_name},</p>
          <p>Your recent rental has ended. Help other renters by leaving a review!</p>
          <a href="${appUrl}/renter/booking/${b.id}" style="display:inline-block;background:#ff7d11;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">Leave a Review</a>
        </div>`
      )
      sent++
    }
  }

  return new Response(JSON.stringify({ reminders_sent: sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
