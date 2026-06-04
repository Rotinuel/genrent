'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/geo'
import { FUEL_TYPES } from '@/types'
import { clsx } from 'clsx'

export default function SearchFilters({ onSearch }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    kva_min: searchParams.get('kva_min') || '',
    kva_max: searchParams.get('kva_max') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    price_max: searchParams.get('price_max') || '',
    sort: searchParams.get('sort') || 'rating',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
  })

  const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push(`/listings?${params.toString()}`)
    onSearch?.(filters)
  }

  const clearFilters = () => {
    const cleared = { city: '', state: '', kva_min: '', kva_max: '', fuel_type: '', price_max: '', sort: 'rating', start_date: '', end_date: '' }
    setFilters(cleared)
    router.push('/listings')
    onSearch?.(cleared)
  }

  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-600" />
          <input
            type="text"
            placeholder="Search by city…"
            value={filters.city}
            onChange={e => update('city', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="input pl-10 h-11"
          />
        </div>
        <button onClick={applyFilters} className="btn-primary h-11 px-5">
          <Search size={16} />
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn-secondary h-11 px-4 relative', showFilters && 'border-brand-500/60')}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 rounded-full text-[9px] text-black font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="btn-ghost h-11 px-3 text-surface-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-surface-600">Sort:</span>
        {[
          { label: 'Top Rated', value: 'rating' },
          { label: 'Price ↑', value: 'price_asc' },
          { label: 'Price ↓', value: 'price_desc' },
          { label: 'Newest', value: 'newest' },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => { update('sort', s.value); applyFilters() }}
            className={clsx(
              'badge cursor-pointer transition-all',
              filters.sort === s.value ? 'badge-orange' : 'badge-gray hover:bg-surface-400'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="card animate-fade-in grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">State</label>
            <select className="select" value={filters.state} onChange={e => update('state', e.target.value)}>
              <option value="">All States</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Fuel Type</label>
            <select className="select" value={filters.fuel_type} onChange={e => update('fuel_type', e.target.value)}>
              <option value="">All Types</option>
              {FUEL_TYPES.map(f => <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Min KVA</label>
            <input type="number" placeholder="e.g. 5" className="input" value={filters.kva_min} onChange={e => update('kva_min', e.target.value)} />
          </div>

          <div>
            <label className="label">Max KVA</label>
            <input type="number" placeholder="e.g. 50" className="input" value={filters.kva_max} onChange={e => update('kva_max', e.target.value)} />
          </div>

          <div>
            <label className="label">Max Price/Day (₦)</label>
            <input type="number" placeholder="e.g. 30000" className="input" value={filters.price_max} onChange={e => update('price_max', e.target.value)} />
          </div>

          <div>
            <label className="label">From Date</label>
            <input type="date" className="input" value={filters.start_date} onChange={e => update('start_date', e.target.value)} />
          </div>

          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={filters.end_date} onChange={e => update('end_date', e.target.value)} />
          </div>

          <div className="flex items-end">
            <button onClick={applyFilters} className="btn-primary w-full">Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  )
}
