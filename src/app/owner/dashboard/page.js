'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BookingCard from '@/components/bookings/BookingCard'
import { Spinner, EmptyState, Price } from '@/components/ui'
import { PlusCircle, Zap, Calendar, DollarSign, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function OwnerDashboard() {
  const { user } = useRequireAuth('owner')
  const [bookings, setBookings] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings?role=owner').then(r => r.json()),
      fetch('/api/listings?owner=me').then(r => r.json()),
    ]).then(([bData, lData]) => {
      setBookings(bData.bookings || [])
      setListings(lData.listings || [])
    }).finally(() => setLoading(false))
  }, [])

  const totalEarned = bookings
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + Number(b.owner_payout || 0), 0)

  const pendingPayout = bookings
    .filter(b => ['confirmed', 'active'].includes(b.status))
    .reduce((s, b) => s + Number(b.owner_payout || 0), 0)

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Owner Dashboard</h1>
          <p className="page-subtitle">Manage your listings and track earnings</p>
        </div>
        <Link href="/owner/listings/new" className="btn-primary">
          <PlusCircle size={16} />
          Add Generator
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Listings', value: listings.filter(l => l.status === 'active').length, icon: Zap },
          { label: 'Total Bookings', value: bookings.length, icon: Calendar },
          { label: 'Total Earned', value: null, amount: totalEarned, icon: DollarSign, highlight: true },
          { label: 'Pending Payout', value: null, amount: pendingPayout, icon: TrendingUp },
        ].map(({ label, value, amount, icon: Icon, highlight }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-600 text-xs">{label}</p>
              <Icon size={16} className={highlight ? 'text-brand-500' : 'text-surface-500'} />
            </div>
            {amount !== undefined ? (
              <Price amount={amount} className={`font-display font-bold text-2xl ${highlight ? 'text-brand-400' : 'text-surface-900'}`} />
            ) : (
              <p className="font-display font-bold text-2xl text-surface-900">{value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Bookings</h2>
            <Link href="/owner/bookings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings yet" description="Share your listing to start getting bookings." />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map(b => <BookingCard key={b.id} booking={b} role="owner" />)}
            </div>
          )}
        </div>

        {/* My listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">My Listings</h2>
            <Link href="/owner/listings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No listings yet"
              description="Add your first generator to start earning."
              action={<Link href="/owner/listings/new" className="btn-primary">Add Generator</Link>}
            />
          ) : (
            <div className="space-y-3">
              {listings.slice(0, 5).map(l => (
                <Link key={l.id} href={`/owner/listings/${l.id}`} className="card-hover flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {l.photos?.[0] ? <img src={l.photos[0]} alt="" className="w-full h-full object-cover" /> : <Zap size={18} className="text-brand-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-surface-900 truncate">{l.title}</p>
                    <p className="text-xs text-surface-600">{l.kva} KVA · <Price amount={l.price_daily} />/day</p>
                  </div>
                  <span className={`badge ${l.status === 'active' ? 'badge-green' : l.status === 'draft' ? 'badge-gray' : 'badge-orange'}`}>
                    {l.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
