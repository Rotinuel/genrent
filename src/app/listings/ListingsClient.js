'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ListingCard from '@/components/listings/ListingCard'
import SearchFilters from '@/components/listings/SearchFilters'
import { Spinner, EmptyState } from '@/components/ui'
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ListingsClient() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Keep a separate filters state so search bar overrides don't break URL sync
  const [activeFilters, setActiveFilters] = useState({})

  async function fetchListings(filters = {}, pg = 1) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // Start from URL params
      searchParams.forEach((v, k) => { if (v) params.set(k, v) })
      // Override / merge with any active filter object
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      params.set('page', String(pg))
      params.set('limit', '20')

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setListings(data.listings || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
      setPage(pg)
    } catch (err) {
      console.error('[ListingsClient]', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when URL params change
  // Use searchParams.toString() as a stable primitive dependency
  const searchParamsStr = searchParams.toString()
  useEffect(() => {
    fetchListings(activeFilters, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsStr])

  const handleSearch = (filters) => {
    setActiveFilters(filters)
    fetchListings(filters, 1)
  }

  const handlePage = (p) => {
    fetchListings(activeFilters, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-surface-900 mb-1">Browse Generators</h1>
        <p className="text-surface-600">
          {loading
            ? 'Searching…'
            : error
            ? 'Could not load listings'
            : `${total.toLocaleString()} generator${total !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <SearchFilters onSearch={handleSearch} />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-3 text-sm">{error}</p>
          <button onClick={() => fetchListings(activeFilters, 1)} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="h-48 shimmer" />
              <div className="p-4 bg-surface-100 border border-surface-300 rounded-b-2xl space-y-2">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
                <div className="h-3 shimmer rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && listings.length === 0 && (
        <EmptyState
          icon={Zap}
          title="No generators found"
          description="Try adjusting your filters or searching in a different city."
        />
      )}

      {/* Grid */}
      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="animate-fade-up"
              style={{ '--delay': `${i * 0.03}s` }}
            >
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => handlePage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary px-3 py-2 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <button
                key={p}
                onClick={() => handlePage(p)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === p ? 'bg-brand-500 text-black' : 'btn-ghost'
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => handlePage(Math.min(pages, page + 1))}
            disabled={page === pages}
            className="btn-secondary px-3 py-2 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
