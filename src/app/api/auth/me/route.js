import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const tokenUser = await getCurrentUser()
    if (!tokenUser) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, phone_verified, email_verified, id_verified, avatar_url, bank_account, paystack_subaccount_code, is_active, created_at')
      .eq('id', tokenUser.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
