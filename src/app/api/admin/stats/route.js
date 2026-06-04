import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/stats
export async function GET() {
  try {
    await requireAuth(['admin'])
    const supabase = getSupabaseAdmin()

    const [
      { count: totalUsers },
      { count: totalListings },
      { count: activeBookings },
      { count: completedBookings },
      { data: revenue },
      { data: disputes },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('generators').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('payments').select('amount').eq('status', 'success').eq('type', 'charge'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ])

    const totalRevenue = revenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const platformRevenue = totalRevenue * (Number(process.env.PLATFORM_FEE_PERCENT || 15) / 100)

    return NextResponse.json({
      stats: {
        totalUsers,
        totalListings,
        activeBookings,
        completedBookings,
        totalRevenue,
        platformRevenue,
        openDisputes: disputes || 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 })
  }
}
