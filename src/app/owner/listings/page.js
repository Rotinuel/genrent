'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, EmptyState, StatusBadge, Price } from '@/components/ui'
import { Zap, PlusCircle, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

export default function OwnerListingsPage() {
  const { user } = useRequireAuth('owner')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch owner's own listings via admin client
    fetch('/api/listings/mine')
      .then(r => r.json())
      .then(data => setListings(data.listings || []))
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">Manage your generator listings</p>
        </div>
        <Link href="/owner/listings/new" className="btn-primary">
          <PlusCircle size={16} />
          Add Generator
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No listings yet"
          description="Add your first generator to start earning on GenRent."
          action={<Link href="/owner/listings/new" className="btn-primary">Add Generator</Link>}
        />
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="card flex items-center gap-4">
              {/* Photo */}
              <div className="w-16 h-16 bg-surface-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {listing.photos?.[0]
                  ? <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <Zap size={20} className="text-brand-500" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-display font-semibold text-surface-900 truncate">{listing.title}</p>
                  <StatusBadge status={listing.status} />
                </div>
                <p className="text-xs text-surface-600">
                  {listing.kva} KVA · {listing.brand} · {listing.city}{listing.state ? `, ${listing.state}` : ''}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                  <span><Price amount={listing.price_daily} className="text-brand-400 font-semibold" />/day</span>
                  <span>·</span>
                  <span>{listing.view_count || 0} views</span>
                  <span>·</span>
                  <span>⭐ {listing.rating_avg > 0 ? Number(listing.rating_avg).toFixed(1) : 'No ratings'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/listing/${listing.id}`} target="_blank" className="btn-ghost p-2" title="View public listing">
                  <Eye size={15} />
                </Link>
                <Link href={`/owner/listings/${listing.id}`} className="btn-secondary py-1.5 px-3 text-xs">
                  <Edit size={13} />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
