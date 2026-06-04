import axios from 'axios'

// ─── SendGrid Email ───────────────────────────────────────────
export async function sendEmail({ to, subject, html, text }) {
  try {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@genrent.com',
          name: process.env.SENDGRID_FROM_NAME || 'GenRent',
        },
        subject,
        content: [
          { type: 'text/plain', value: text || subject },
          { type: 'text/html', value: html || `<p>${text}</p>` },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return true
  } catch (err) {
    console.error('[sendEmail]', err.response?.data || err.message)
    return false
  }
}

// ─── Termii SMS ───────────────────────────────────────────────
export async function sendSMS({ to, message }) {
  try {
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      to,
      from: process.env.TERMII_SENDER_ID || 'GenRent',
      sms: message,
      type: 'plain',
      api_key: process.env.TERMII_API_KEY,
      channel: 'generic',
    })
    return true
  } catch (err) {
    console.error('[sendSMS]', err.response?.data || err.message)
    return false
  }
}

// ─── Termii OTP ───────────────────────────────────────────────
export async function sendOTP({ to, otp }) {
  return sendSMS({
    to,
    message: `Your GenRent verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
  })
}

// ─── Email templates ──────────────────────────────────────────
export const emailTemplates = {
  bookingConfirmed: ({ renter_name, generator_title, start_date, end_date, total, booking_id }) => ({
    subject: `Booking Confirmed — ${generator_title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px">
        <h1 style="color:#ff7d11;margin-bottom:8px">Booking Confirmed ✓</h1>
        <p>Hi ${renter_name},</p>
        <p>Your booking for <strong>${generator_title}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr><td style="padding:8px 0;color:#a3a3a3">Booking ID</td><td>${booking_id}</td></tr>
          <tr><td style="padding:8px 0;color:#a3a3a3">Dates</td><td>${start_date} → ${end_date}</td></tr>
          <tr><td style="padding:8px 0;color:#a3a3a3">Total Paid</td><td style="color:#ff7d11">₦${Number(total).toLocaleString()}</td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/renter/booking/${booking_id}" style="display:inline-block;background:#ff7d11;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Booking</a>
      </div>
    `,
  }),

  ownerNewBooking: ({ owner_name, renter_name, generator_title, start_date, end_date, payout, booking_id }) => ({
    subject: `New Booking Request — ${generator_title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px">
        <h1 style="color:#ff7d11;margin-bottom:8px">New Booking! 🎉</h1>
        <p>Hi ${owner_name},</p>
        <p><strong>${renter_name}</strong> has booked your <strong>${generator_title}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr><td style="padding:8px 0;color:#a3a3a3">Dates</td><td>${start_date} → ${end_date}</td></tr>
          <tr><td style="padding:8px 0;color:#a3a3a3">Your Payout</td><td style="color:#ff7d11">₦${Number(payout).toLocaleString()}</td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/owner/listings" style="display:inline-block;background:#ff7d11;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard</a>
      </div>
    `,
  }),

  bookingCancelled: ({ name, generator_title, refund_amount, booking_id }) => ({
    subject: `Booking Cancelled — ${generator_title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px">
        <h1 style="color:#ff7d11;margin-bottom:8px">Booking Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Booking for <strong>${generator_title}</strong> (ID: ${booking_id}) has been cancelled.</p>
        ${refund_amount ? `<p>Refund of <strong style="color:#ff7d11">₦${Number(refund_amount).toLocaleString()}</strong> will be processed within 3–5 business days.</p>` : ''}
      </div>
    `,
  }),

  welcomeEmail: ({ name, role }) => ({
    subject: `Welcome to GenRent!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:40px;border-radius:12px">
        <h1 style="color:#ff7d11;margin-bottom:8px">Welcome to GenRent ⚡</h1>
        <p>Hi ${name},</p>
        <p>Your account is ready. ${role === 'owner' ? 'Start listing your generator and earning today.' : 'Find the perfect generator for your needs.'}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;background:#ff7d11;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Get Started</a>
      </div>
    `,
  }),
}
