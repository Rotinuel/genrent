import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// POST /api/reviews — create review
export async function POST(request) {
  try {
    const user = await requireAuth()
    const { booking_id, rating, body, type } = await request.json()

    if (!booking_id || !rating || !type) {
      return NextResponse.json({ error: 'booking_id, rating, and type required' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify booking is completed
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('status', 'completed')
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not yet completed' }, { status: 404 })
    }

    // Verify reviewer is part of booking
    const canReview = booking.renter_id === user.id || booking.owner_id === user.id
    if (!canReview) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Determine reviewee
    let reviewee_id = null
    if (type === 'generator' || type === 'owner') reviewee_id = booking.owner_id
    if (type === 'renter') reviewee_id = booking.renter_id

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id: user.id,
        reviewee_id,
        generator_id: booking.generator_id,
        rating: parseInt(rating),
        body: body || null,
        type,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
      throw error
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 })
  }
}

// GET /api/reviews?generator_id=xxx or ?user_id=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const generator_id = searchParams.get('generator_id')
    const user_id = searchParams.get('user_id')

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('reviews')
      .select('*, reviewer:users!reviewer_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })

    if (generator_id) query = query.eq('generator_id', generator_id).eq('type', 'generator')
    else if (user_id) query = query.eq('reviewee_id', user_id)

    const { data: reviews, error } = await query
    if (error) throw error

    return NextResponse.json({ reviews })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
