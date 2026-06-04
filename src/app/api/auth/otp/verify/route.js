import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function POST(request) {
  try {
    const user = await requireAuth()
    const { otp } = await request.json()

    if (!otp) return NextResponse.json({ error: 'OTP required' }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const { data: dbUser } = await supabase
      .from('users')
      .select('otp_code, otp_expires_at')
      .eq('id', user.id)
      .single()

    if (!dbUser?.otp_code) {
      return NextResponse.json({ error: 'No OTP found. Request a new one.' }, { status: 400 })
    }

    if (new Date() > new Date(dbUser.otp_expires_at)) {
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 })
    }

    if (dbUser.otp_code !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 })
    }

    await supabase
      .from('users')
      .update({ phone_verified: true, otp_code: null, otp_expires_at: null })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: err.status || 500 })
  }
}
