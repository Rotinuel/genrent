import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import { setAuthCookie } from '@/lib/auth'
import { sendEmail, emailTemplates } from '@/lib/notifications'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, full_name, phone, role = 'renter' } = body

    // Validate
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    if (!['renter', 'owner', 'driver'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Check if email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        phone: phone || null,
        role,
      })
      .select('id, email, full_name, phone, role, phone_verified, email_verified, created_at')
      .single()

    if (error) throw error

    // Set auth cookie
    await setAuthCookie({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    })

    // Send welcome email (non-blocking)
    const tmpl = emailTemplates.welcomeEmail({ name: user.full_name, role: user.role })
    sendEmail({ to: user.email, ...tmpl }).catch(console.error)

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
