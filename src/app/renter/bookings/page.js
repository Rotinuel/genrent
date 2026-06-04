'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BookingCard from '@/components/bookings/BookingCard'
import { Spinner, EmptyState } from '@/components/ui'
import { Calendar } from 'lucide-react'
import { clsx } from 'clsx'

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function RenterBookingsPage() {
  const { user } = useRequireAuth('renter')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')

  useEffect(() => {
    setLoading(true)
    const q = tab ? `?status=${tab}&role=renter` : '?role=renter'
    fetch(`/api/bookings${q}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false))
  }, [tab])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track all your generator rentals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              tab === t.value ? 'bg-brand-500/20 text-brand-400' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No bookings" description={tab ? `No ${tab} bookings found.` : 'You have no bookings yet.'} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => <BookingCard key={b.id} booking={b} role="renter" />)}
        </div>
      )}
    </DashboardLayout>
  )
}
