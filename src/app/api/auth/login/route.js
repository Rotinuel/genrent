import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { setAuthCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, password_hash, phone_verified, email_verified, avatar_url, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { password_hash, ...safeUser } = user

    await setAuthCookie({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    })

    return NextResponse.json({ user: safeUser })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
