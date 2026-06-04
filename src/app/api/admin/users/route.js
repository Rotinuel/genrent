import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/users
export async function GET(request) {
  try {
    await requireAuth(['admin'])
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, role, phone_verified, email_verified, id_verified, avatar_url, is_active, bank_account, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    }
    if (role) query = query.eq('role', role)

    const { data: users, error, count } = await query
    if (error) throw error

    return NextResponse.json({ users, total: count, page, pages: Math.ceil(count / limit) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
