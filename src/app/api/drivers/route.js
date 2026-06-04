import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/drivers/jobs — list jobs for driver
export async function GET(request) {
  try {
    const user = await requireAuth(['driver', 'admin'])
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('driver_jobs')
      .select(`
        *,
        booking:bookings!booking_id(*, 
          generator:generators!generator_id(title, kva, brand, photos),
          renter:users!renter_id(full_name, phone)
        )
      `)

    if (user.role === 'driver') {
      query = status === 'available'
        ? query.is('driver_id', null).eq('status', 'unassigned')
        : query.eq('driver_id', user.id)
    }

    if (status && status !== 'available') query = query.eq('status', status)

    query = query.order('created_at', { ascending: false })

    const { data: jobs, error } = await query
    if (error) throw error

    return NextResponse.json({ jobs })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}

// PATCH /api/drivers/jobs/[id] — accept, update status, location
export async function PATCH(request) {
  try {
    const user = await requireAuth(['driver'])
    const body = await request.json()
    const { job_id, action, driver_lat, driver_lng } = body

    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const { data: job } = await supabase
      .from('driver_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const statusMap = {
      accept: 'accepted',
      pickup: 'picked_up',
      deliver: 'delivered',
      return_start: 'en_route_return',
      complete: 'returned',
    }

    const timestampMap = {
      pickup: 'picked_up_at',
      deliver: 'delivered_at',
      complete: 'returned_at',
    }

    const updates = {}

    if (action === 'accept') {
      if (job.driver_id && job.driver_id !== user.id) {
        return NextResponse.json({ error: 'Job already taken' }, { status: 409 })
      }
      updates.driver_id = user.id
      updates.status = 'accepted'
      updates.accepted_at = new Date().toISOString()
    } else if (statusMap[action]) {
      if (job.driver_id !== user.id) return NextResponse.json({ error: 'Not your job' }, { status: 403 })
      updates.status = statusMap[action]
      if (timestampMap[action]) updates[timestampMap[action]] = new Date().toISOString()
    }

    // Update driver location
    if (driver_lat && driver_lng) {
      updates.driver_lat = driver_lat
      updates.driver_lng = driver_lng
    }

    const { data: updated, error } = await supabase
      .from('driver_jobs')
      .update(updates)
      .eq('id', job_id)
      .select()
      .single()

    if (error) throw error

    // Sync delivery status to booking
    if (updates.status) {
      await supabase
        .from('bookings')
        .update({ delivery_status: updates.status, driver_id: updates.driver_id || job.driver_id })
        .eq('id', job.booking_id)
    }

    return NextResponse.json({ job: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
