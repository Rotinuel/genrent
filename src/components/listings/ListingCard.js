'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Zap, Fuel, Star } from 'lucide-react'
import { Stars, Price } from '@/components/ui'
import { clsx } from 'clsx'

const FUEL_COLORS = {
  petrol: 'badge-orange',
  diesel: 'badge-blue',
  gas: 'badge-green',
  hybrid: 'badge-gray',
}

export default function ListingCard({ listing, className }) {
  const photo = listing.photos?.[0] || null
  const initials = listing.brand?.slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={clsx(
        'group block bg-surface-100 border border-surface-300 rounded-2xl overflow-hidden',
        'hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-200',
        className
      )}
    >
      {/* Photo */}
      <div className="relative h-48 bg-surface-200 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 bg-surface-300 rounded-2xl flex items-center justify-center">
              <Zap size={24} className="text-brand-500" />
            </div>
            <span className="text-surface-600 text-xs font-mono">{initials}</span>
          </div>
        )}
        {/* KVA badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-brand-400 text-xs font-display font-bold px-2.5 py-1 rounded-lg">
          {listing.kva} KVA
        </div>
        {/* Distance badge */}
        {listing.distance_km !== undefined && listing.distance_km !== null && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-surface-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <MapPin size={10} />
            {listing.distance_km < 1 ? `${Math.round(listing.distance_km * 1000)}m` : `${listing.distance_km}km`}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-surface-900 text-sm leading-snug group-hover:text-brand-400 transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <span className={clsx('badge shrink-0', FUEL_COLORS[listing.fuel_type])}>
            {listing.fuel_type}
          </span>
        </div>

        <p className="text-surface-600 text-xs mb-3 flex items-center gap-1">
          <MapPin size={11} />
          {listing.city}{listing.state ? `, ${listing.state}` : ''}
        </p>

        {/* Rating */}
        {listing.rating_count > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Stars rating={Math.round(listing.rating_avg)} size={12} />
            <span className="text-surface-600 text-xs">
              {Number(listing.rating_avg).toFixed(1)} ({listing.rating_count})
            </span>
          </div>
        )}

        {/* Owner */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-surface-600">
            by <span className="text-surface-800">{listing.owner_name}</span>
            {listing.owner_verified && (
              <span className="ml-1 text-brand-500">✓</span>
            )}
          </span>
          <div className="text-right">
            <Price amount={listing.price_daily} className="font-display font-bold text-brand-400 text-sm" />
            <span className="text-surface-600 text-xs">/day</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
