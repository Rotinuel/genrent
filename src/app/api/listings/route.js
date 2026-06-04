import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { getDistance } from '@/lib/geo'

// GET /api/listings — public search with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Only apply numeric filters when actually provided
    const rawKvaMin   = searchParams.get('kva_min')
    const rawKvaMax   = searchParams.get('kva_max')
    const rawPriceMax = searchParams.get('price_max')
    const lat         = parseFloat(searchParams.get('lat'))
    const lng         = parseFloat(searchParams.get('lng'))
    const radius      = parseFloat(searchParams.get('radius') || '50')
    const fuel_type   = searchParams.get('fuel_type')
    const city        = searchParams.get('city')
    const state       = searchParams.get('state')
    const start_date  = searchParams.get('start_date')
    const end_date    = searchParams.get('end_date')
    const sort        = searchParams.get('sort') || 'newest'
    const page        = parseInt(searchParams.get('page') || '1')
    const limit       = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('generators')
      .select(
        `id, title, description, brand, kva, fuel_type, photos,
         price_daily, price_weekly, price_monthly, security_deposit,
         latitude, longitude, address, city, state, service_radius_km,
         self_delivery, delivery_fee_base, delivery_fee_per_km,
         instant_book, condition_rating, rating_avg, rating_count, view_count,
         status, created_at,
         owner:users!owner_id(id, full_name, avatar_url, phone_verified)`,
        { count: 'exact' }
      )
      .eq('status', 'active')

    // Only add numeric filters when the param was actually passed
    if (rawKvaMin)   query = query.gte('kva', parseFloat(rawKvaMin))
    if (rawKvaMax)   query = query.lte('kva', parseFloat(rawKvaMax))
    if (rawPriceMax) query = query.lte('price_daily', parseFloat(rawPriceMax))

    if (fuel_type) query = query.eq('fuel_type', fuel_type)
    if (city)      query = query.ilike('city', `%${city}%`)
    if (state)     query = query.ilike('state', `%${state}%`)

    // Exclude generators already booked on requested dates
    if (start_date && end_date) {
      const { data: booked } = await supabase
        .from('availability_blocks')
        .select('generator_id')
        .lte('start_date', end_date)
        .gte('end_date', start_date)

      if (booked?.length) {
        const ids = booked.map(b => b.generator_id)
        query = query.not('id', 'in', `(${ids.join(',')})`)
      }
    }

    // Sorting
    switch (sort) {
      case 'price_asc':  query = query.order('price_daily', { ascending: true });  break
      case 'price_desc': query = query.order('price_daily', { ascending: false }); break
      case 'rating':     query = query.order('rating_avg',  { ascending: false }); break
      default:           query = query.order('created_at',  { ascending: false }); break // newest
    }

    // Pagination
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data: raw, error, count } = await query

    if (error) {
      console.error('[GET /api/listings] Supabase error:', error)
      throw error
    }

    // Flatten nested owner object
    let listings = (raw || []).map(g => ({
      ...g,
      owner_name:     g.owner?.full_name   ?? null,
      owner_avatar:   g.owner?.avatar_url  ?? null,
      owner_verified: g.owner?.phone_verified ?? false,
      owner: undefined, // remove nested object
    }))

    // Client-side radius filter when coordinates supplied
    if (!isNaN(lat) && !isNaN(lng)) {
      listings = listings
        .map(g => ({
          ...g,
          distance_km:
            g.latitude && g.longitude
              ? Math.round(getDistance(lat, lng, g.latitude, g.longitude) * 10) / 10
              : null,
        }))
        .filter(g => g.distance_km === null || g.distance_km <= radius)
        .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
    }

    return NextResponse.json({
      listings,
      total: count ?? 0,
      page,
      pages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err) {
    console.error('[GET /api/listings]', err)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

// POST /api/listings — create new listing (owners only)
export async function POST(request) {
  try {
    const user = await requireAuth(['owner', 'admin'])
    const body = await request.json()

    const {
      title, description, brand, model, kva, fuel_type,
      price_daily, price_weekly, price_monthly, security_deposit,
      latitude, longitude, address, city, state, service_radius_km,
      self_delivery, delivery_fee_base, delivery_fee_per_km,
      instant_book, condition_rating, year_manufactured,
    } = body

    if (!title || !brand || !kva || !fuel_type || !price_daily) {
      return NextResponse.json(
        { error: 'title, brand, kva, fuel_type and price_daily are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: listing, error } = await supabase
      .from('generators')
      .insert({
        owner_id:          user.id,
        title:             title.trim(),
        description:       description?.trim() || null,
        brand:             brand.trim(),
        model:             model?.trim() || null,
        kva:               parseFloat(kva),
        fuel_type,
        price_daily:       parseFloat(price_daily),
        price_weekly:      price_weekly  ? parseFloat(price_weekly)  : null,
        price_monthly:     price_monthly ? parseFloat(price_monthly) : null,
        security_deposit:  parseFloat(security_deposit || 0),
        latitude:          latitude  ? parseFloat(latitude)  : null,
        longitude:         longitude ? parseFloat(longitude) : null,
        address:           address?.trim()  || null,
        city:              city?.trim()     || null,
        state:             state?.trim()    || null,
        service_radius_km: parseInt(service_radius_km || 20),
        self_delivery:     !!self_delivery,
        delivery_fee_base:    parseFloat(delivery_fee_base    || 0),
        delivery_fee_per_km:  parseFloat(delivery_fee_per_km  || 0),
        instant_book:      instant_book !== false,
        condition_rating:  condition_rating   ? parseInt(condition_rating)   : null,
        year_manufactured: year_manufactured  ? parseInt(year_manufactured)  : null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ listing }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/listings]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create listing' },
      { status: err.status || 500 }
    )
  }
}
