import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth, getCurrentUser } from '@/lib/auth'

// GET /api/listings/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: listing, error } = await supabase
      .from('generators')
      .select(`
        *,
        owner:users!owner_id(id, full_name, avatar_url, phone_verified, email_verified, created_at),
        reviews(
          id, rating, body, created_at, type,
          reviewer:users!reviewer_id(full_name, avatar_url)
        ),
        availability_blocks(start_date, end_date, reason)
      `)
      .eq('id', id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Increment view count (non-blocking)
    supabase
      .from('generators')
      .update({ view_count: (listing.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(() => {})

    return NextResponse.json({ listing })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

// PUT /api/listings/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await requireAuth(['owner', 'admin'])
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: existing } = await supabase
      .from('generators')
      .select('owner_id, photos')
      .eq('id', id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.owner_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow status 'active' if listing has at least 1 photo
    if (body.status === 'active') {
      const currentPhotos = body.photos || existing.photos || []
      if (currentPhotos.length === 0) {
        return NextResponse.json({ error: 'Please add at least one photo before activating your listing' }, { status: 400 })
      }
    }

    const allowedFields = [
      'title', 'description', 'brand', 'model', 'kva', 'fuel_type',
      'photos', 'price_daily', 'price_weekly', 'price_monthly',
      'security_deposit', 'latitude', 'longitude', 'address', 'city',
      'state', 'service_radius_km', 'self_delivery', 'delivery_fee_base',
      'delivery_fee_per_km', 'instant_book', 'condition_rating',
      'year_manufactured', 'last_serviced_at', 'status',
    ]

    const updates = {}
    allowedFields.forEach(f => {
      if (body[f] !== undefined) updates[f] = body[f]
    })

    const { data: updated, error } = await supabase
      .from('generators')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ listing: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: err.status || 500 })
  }
}

// DELETE /api/listings/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const user = await requireAuth(['owner', 'admin'])
    const supabase = getSupabaseAdmin()

    const { data: listing } = await supabase
      .from('generators')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.owner_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await supabase.from('generators').update({ status: 'suspended' }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
