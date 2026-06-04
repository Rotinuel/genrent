'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns'
import { calculateDeliveryFee } from '@/lib/geo'
import { Price, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import { Shield, Truck, Calendar } from 'lucide-react'

export default function BookingForm({ listing }) {
  const { user } = useAuth()
  const router = useRouter()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Blocked dates from availability
  const blocked = listing.availability_blocks || []

  // Pricing calc
  const days = startDate && endDate
    ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
    : 0

  let rate = listing.price_daily
  if (days >= 28 && listing.price_monthly) rate = listing.price_monthly / 30
  else if (days >= 7 && listing.price_weekly) rate = listing.price_weekly / 7

  const subtotal = days > 0 ? Math.round(rate * days * 100) / 100 : 0
  const deliveryFee = listing.self_delivery ? (listing.delivery_fee_base || 0) : 0
  const platformFee = Math.round(subtotal * 0.15 * 100) / 100
  const securityDeposit = listing.security_deposit || 0
  const total = subtotal + deliveryFee + platformFee + securityDeposit

  const handleBook = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/listing/' + listing.id)
      return
    }
    if (!startDate || !endDate || !address) {
      toast.error('Please fill in all required fields')
      return
    }
    if (days < 1) {
      toast.error('End date must be after start date')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generator_id: listing.id,
          start_date: startDate,
          end_date: endDate,
          delivery_address: address,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Redirect to Paystack
      window.location.href = data.payment_url
    } catch (err) {
      toast.error(err.message || 'Booking failed')
      setLoading(false)
    }
  }

  return (
    <div className="card sticky top-24">
      <div className="flex items-baseline gap-1 mb-5">
        <Price amount={listing.price_daily} className="font-display font-extrabold text-2xl text-brand-400" />
        <span className="text-surface-600 text-sm">/day</span>
        {listing.price_weekly && (
          <span className="text-xs text-surface-600 ml-2">
            <Price amount={listing.price_weekly} className="text-surface-700" />/week
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              min={today}
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                if (endDate && e.target.value >= endDate) {
                  setEndDate(format(addDays(parseISO(e.target.value), 1), 'yyyy-MM-dd'))
                }
              }}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              min={startDate || today}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Delivery address */}
        <div>
          <label className="label">Delivery Address *</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Where should we deliver the generator?"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Any special instructions…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Pricing breakdown */}
      {days > 0 && (
        <div className="bg-surface-200 rounded-xl p-4 mb-4 space-y-2 text-sm animate-fade-in">
          <div className="flex justify-between text-surface-700">
            <span><Price amount={rate} className="" />/day × {days} {days === 1 ? 'day' : 'days'}</span>
            <Price amount={subtotal} />
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-surface-700">
              <span className="flex items-center gap-1"><Truck size={12} /> Delivery fee</span>
              <Price amount={deliveryFee} />
            </div>
          )}
          <div className="flex justify-between text-surface-700">
            <span>Platform fee (15%)</span>
            <Price amount={platformFee} />
          </div>
          {securityDeposit > 0 && (
            <div className="flex justify-between text-surface-700">
              <span className="flex items-center gap-1"><Shield size={12} /> Security deposit</span>
              <Price amount={securityDeposit} />
            </div>
          )}
          <div className="flex justify-between font-bold text-surface-900 pt-2 border-t border-surface-300">
            <span>Total</span>
            <Price amount={total} className="text-brand-400" />
          </div>
          {securityDeposit > 0 && (
            <p className="text-xs text-surface-600">Security deposit refunded after return.</p>
          )}
        </div>
      )}

      <Button
        onClick={handleBook}
        loading={loading}
        className="w-full"
        size="lg"
      >
        {user ? 'Book & Pay' : 'Sign in to Book'}
      </Button>

      {listing.instant_book && (
        <p className="text-center text-xs text-surface-600 mt-3 flex items-center justify-center gap-1">
          <Calendar size={11} /> Instant booking — no approval needed
        </p>
      )}
    </div>
  )
}
