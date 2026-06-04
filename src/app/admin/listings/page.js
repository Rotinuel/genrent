'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, StatusBadge, Button, Price } from '@/components/ui'
import { CheckCircle, XCircle, Eye, Search, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { clsx } from 'clsx'

export default function AdminListingsPage() {
  const { user } = useRequireAuth('admin')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('draft')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('q', search)
    fetch(`/api/admin/listings?${params}`)
      .then(r => r.json())
      .then(data => setListings(data.listings || []))
      .finally(() => setLoading(false))
  }, [statusFilter, search])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      toast.success(`Listing ${status}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Listings</h1>
        <p className="page-subtitle">Review and moderate generator listings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600" />
          <input type="text" placeholder="Search listings…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex gap-1">
          {['', 'draft', 'active', 'paused', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', statusFilter === s ? 'bg-brand-500/20 text-brand-400' : 'text-surface-600 hover:bg-surface-200')}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {listings.length === 0 && <p className="text-center py-10 text-surface-600">No listings found.</p>}
          {listings.map(listing => (
            <div key={listing.id} className="card flex items-start gap-4">
              {/* Photo */}
              <div className="w-16 h-16 bg-surface-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {listing.photos?.[0] ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" /> : <Zap size={20} className="text-surface-500" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-surface-900 truncate">{listing.title}</p>
                  <StatusBadge status={listing.status} />
                </div>
                <p className="text-xs text-surface-600 mb-1">{listing.brand} · {listing.kva} KVA · {listing.fuel_type} · {listing.city}, {listing.state}</p>
                <p className="text-xs text-surface-600">
                  Owner: <span className="text-surface-800">{listing.owner_name}</span> ·
                  <Price amount={listing.price_daily} className="ml-1 text-brand-400 font-semibold" />/day ·
                  {listing.photos?.length || 0} photos
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/listing/${listing.id}`} target="_blank" className="btn-ghost p-2" title="View listing">
                  <Eye size={15} />
                </Link>
                {listing.status !== 'active' && (
                  <button
                    onClick={() => updateStatus(listing.id, 'active')}
                    disabled={updating === listing.id}
                    className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
                {listing.status !== 'suspended' && (
                  <button
                    onClick={() => updateStatus(listing.id, 'suspended')}
                    disabled={updating === listing.id}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Suspend"
                  >
                    <XCircle size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
