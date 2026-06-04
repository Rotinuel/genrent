import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { calculateFees, generateReference, initializePayment } from '@/lib/paystack'
import { calculateDeliveryFee } from '@/lib/geo'
import { differenceInCalendarDays, parseISO } from 'date-fns'

// GET /api/bookings — list bookings for current user
export async function GET(request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role') || user.role

    const supabase = getSupabaseAdmin()

    let query = supabase.from('v_bookings').select('*')

    if (role === 'owner') query = query.eq('owner_id', user.id)
    else if (role === 'driver') query = query.eq('driver_id', user.id)
    else query = query.eq('renter_id', user.id)

    if (status) query = query.eq('status', status)

    query = query.order('created_at', { ascending: false })

    const { data: bookings, error } = await query
    if (error) throw error

    return NextResponse.json({ bookings })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch bookings' }, { status: err.status || 500 })
  }
}

// POST /api/bookings — create booking
export async function POST(request) {
  try {
    const user = await requireAuth(['renter'])
    const body = await request.json()

    const { generator_id, start_date, end_date, delivery_address, delivery_lat, delivery_lng, notes } = body

    if (!generator_id || !start_date || !end_date || !delivery_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Fetch generator
    const { data: generator, error: genErr } = await supabase
      .from('generators')
      .select('*, owner:users!owner_id(id, email, full_name)')
      .eq('id', generator_id)
      .eq('status', 'active')
      .single()

    if (genErr || !generator) {
      return NextResponse.json({ error: 'Generator not found or unavailable' }, { status: 404 })
    }

    // Check availability
    const { data: conflicts } = await supabase
      .from('availability_blocks')
      .select('id')
      .eq('generator_id', generator_id)
      .lte('start_date', end_date)
      .gte('end_date', start_date)

    if (conflicts?.length) {
      return NextResponse.json({ error: 'Generator is not available for selected dates' }, { status: 409 })
    }

    // Calculate pricing
    const days = differenceInCalendarDays(parseISO(end_date), parseISO(start_date)) + 1
    if (days < 1) return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })

    let rate = generator.price_daily
    if (days >= 28 && generator.price_monthly) rate = generator.price_monthly / 30
    else if (days >= 7 && generator.price_weekly) rate = generator.price_weekly / 7

    const subtotal = Math.round(rate * days * 100) / 100
    const delivery_fee = delivery_lat && delivery_lng
      ? calculateDeliveryFee(generator, delivery_lat, delivery_lng)
      : generator.delivery_fee_base || 0

    const fees = calculateFees({
      subtotal,
      delivery_fee,
      security_deposit: generator.security_deposit || 0,
    })

    const paystack_ref = generateReference('BOOK')

    // Create booking
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        generator_id,
        renter_id: user.id,
        owner_id: generator.owner_id,
        start_date,
        end_date,
        days,
        delivery_address,
        delivery_lat: delivery_lat || null,
        delivery_lng: delivery_lng || null,
        subtotal: fees.subtotal,
        delivery_fee: fees.delivery_fee,
        platform_fee: fees.platform_fee,
        security_deposit: fees.security_deposit,
        total_amount: fees.total,
        owner_payout: fees.owner_payout,
        paystack_ref,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (bookErr) throw bookErr

    // Initialize Paystack payment
    const payment = await initializePayment({
      email: user.email,
      amount: fees.total,
      reference: paystack_ref,
      metadata: {
        booking_id: booking.id,
        generator_id,
        renter_id: user.id,
        days,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify?ref=${paystack_ref}`,
    })

    return NextResponse.json({ booking, payment_url: payment.authorization_url }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bookings]', err)
    return NextResponse.json({ error: err.message || 'Booking failed' }, { status: err.status || 500 })
  }
}
