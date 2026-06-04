'use client'

import { useEffect, useState } from 'react'
import { useAuth, useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BookingCard from '@/components/bookings/BookingCard'
import { Spinner, EmptyState, Price, Stars } from '@/components/ui'
import { Calendar, Search, Star, Zap } from 'lucide-react'
import Link from 'next/link'

export default function RenterDashboard() {
  const { user } = useRequireAuth('renter')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })

  useEffect(() => {
    fetch('/api/bookings?role=renter')
      .then(r => r.json())
      .then(data => {
        const all = data.bookings || []
        setBookings(all)
        setStats({
          total: all.length,
          active: all.filter(b => b.status === 'active').length,
          completed: all.filter(b => b.status === 'completed').length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Hello, {user.full_name.split(' ')[0]} ⚡</h1>
          <p className="page-subtitle">Manage your generator rentals</p>
        </div>
        <Link href="/listings" className="btn-primary">
          <Search size={16} />
          Find Generator
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: stats.total, icon: Calendar },
          { label: 'Active Now', value: stats.active, icon: Zap, highlight: stats.active > 0 },
          { label: 'Completed', value: stats.completed, icon: Star },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-600 text-xs font-medium">{label}</p>
              <Icon size={16} className={highlight ? 'text-brand-500' : 'text-surface-500'} />
            </div>
            <p className={`font-display font-bold text-3xl ${highlight ? 'text-brand-400' : 'text-surface-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">My Bookings</h2>
          <Link href="/renter/bookings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No bookings yet"
            description="Find a generator near you and make your first booking."
            action={<Link href="/listings" className="btn-primary">Browse Generators</Link>}
          />
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map(booking => (
              <BookingCard key={booking.id} booking={booking} role="renter" />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
