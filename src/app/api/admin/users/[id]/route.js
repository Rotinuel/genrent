import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// PATCH /api/admin/users/[id]
export async function PATCH(request, { params }) {
  try {
    await requireAuth(['admin'])
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const allowed = ['is_active', 'id_verified', 'email_verified', 'phone_verified', 'role']
    const updates = {}
    allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f] })

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, is_active, id_verified, phone_verified')
      .single()

    if (error) throw error
    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
