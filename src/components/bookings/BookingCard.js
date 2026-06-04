'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { StatusBadge, Price } from '@/components/ui'
import { Calendar, MapPin, Zap } from 'lucide-react'

export default function BookingCard({ booking, role = 'renter' }) {
  const href = role === 'renter' ? `/renter/booking/${booking.id}` : `/owner/bookings/${booking.id}`

  return (
    <Link href={href} className="card-hover block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Generator photo or icon */}
          <div className="w-14 h-14 bg-surface-200 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
            {booking.generator_photos?.[0] ? (
              <img src={booking.generator_photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <Zap size={20} className="text-brand-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-surface-900 text-sm truncate">
              {booking.generator_title || booking.generator?.title}
            </p>
            <p className="text-xs text-surface-600 mb-2">
              {booking.generator_kva || booking.generator?.kva} KVA · {booking.generator_brand || booking.generator?.brand}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-600">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {format(parseISO(booking.start_date), 'MMM d')} – {format(parseISO(booking.end_date), 'MMM d, yyyy')}
                <span className="text-surface-500">({booking.days}d)</span>
              </span>
              {booking.delivery_address && (
                <span className="flex items-center gap-1 max-w-[180px] truncate">
                  <MapPin size={11} />
                  {booking.delivery_address}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={booking.status} />
          <Price amount={booking.total_amount} className="font-display font-bold text-sm text-surface-900" />
          {role === 'owner' && (
            <span className="text-xs text-surface-600">
              You earn: <Price amount={booking.owner_payout} className="text-brand-400 font-semibold" />
            </span>
          )}
        </div>
      </div>

      {/* Party info */}
      <div className="mt-3 pt-3 border-t border-surface-300 flex items-center justify-between text-xs text-surface-600">
        <span>
          {role === 'renter' ? `Owner: ${booking.owner_name}` : `Renter: ${booking.renter_name}`}
        </span>
        <span className="text-surface-500">
          #{booking.id?.slice(0, 8)}
        </span>
      </div>
    </Link>
  )
}
