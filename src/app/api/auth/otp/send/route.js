import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { sendOTP } from '@/lib/notifications'

// POST /api/auth/otp/send
export async function POST(request) {
  try {
    const user = await requireAuth()
    const supabase = getSupabaseAdmin()

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await supabase
      .from('users')
      .update({ otp_code: otp, otp_expires_at: expires.toISOString() })
      .eq('id', user.id)

    const { data: fullUser } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .single()

    if (!fullUser?.phone) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
    }

    await sendOTP({ to: fullUser.phone, otp })

    return NextResponse.json({ success: true, message: 'OTP sent' })
  } catch (err) {
    console.error('[POST /api/auth/otp/send]', err)
    return NextResponse.json({ error: err.message || 'Failed to send OTP' }, { status: err.status || 500 })
  }
}
