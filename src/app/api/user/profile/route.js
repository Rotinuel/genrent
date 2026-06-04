import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// PATCH /api/user/profile
export async function PATCH(request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const allowed = ['full_name', 'phone']
    const updates = {}
    allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f] })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // If phone changed, reset verification
    if (updates.phone && updates.phone !== user.phone) {
      updates.phone_verified = false
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, email, full_name, phone, role, phone_verified, email_verified, id_verified, avatar_url')
      .single()

    if (error) throw error

    return NextResponse.json({ user: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: err.status || 500 })
  }
}
