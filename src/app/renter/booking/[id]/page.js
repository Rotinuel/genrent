'use client'

import { useEffect, useState, use } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatusBadge, Price, Spinner, Button, Modal } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import { Calendar, MapPin, Phone, User, Truck, Star, AlertTriangle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function BookingDetailPage({ params }) {
  const { id } = use(params)
  const { user } = useRequireAuth('renter')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [disputeModal, setDisputeModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDesc, setDisputeDesc] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(data => setBooking(data.booking))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooking(data.booking)
      setCancelModal(false)
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReview = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/bookings/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, rating, body: reviewBody, type: 'generator' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviewModal(false)
      toast.success('Review submitted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please enter a reason for the dispute')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/bookings/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, reason: disputeReason, description: disputeDesc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooking(prev => ({ ...prev, status: 'disputed' }))
      setDisputeModal(false)
      toast.success('Dispute filed. Our team will review within 24 hours.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!user) return null
  if (loading) return <DashboardLayout><div className="flex justify-center py-16"><Spinner /></div></DashboardLayout>
  if (!booking) return <DashboardLayout><p className="text-surface-600">Booking not found.</p></DashboardLayout>

  const canCancel = ['pending', 'confirmed'].includes(booking.status)
  const canReview = booking.status === 'completed'
  const canDispute = ['active', 'completed'].includes(booking.status)

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/renter/bookings" className="text-sm text-surface-600 hover:text-brand-400 mb-2 block">← Back to bookings</Link>
            <h1 className="page-title">{booking.generator_title}</h1>
            <p className="text-surface-600 text-sm mt-1">{booking.generator_kva} KVA · {booking.generator_brand}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Dispute banner */}
        {booking.status === 'disputed' && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 animate-fade-in">
            <ShieldAlert size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Dispute In Progress</p>
              <p className="text-xs text-surface-600">Our team is reviewing your dispute. We'll contact you within 24 hours.</p>
            </div>
          </div>
        )}

        {/* Booking info */}
        <div className="card mb-4">
          <h2 className="font-display font-semibold text-surface-900 mb-4">Booking Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-surface-700">
              <Calendar size={15} className="text-brand-500 shrink-0" />
              <span>{format(parseISO(booking.start_date), 'MMM d')} – {format(parseISO(booking.end_date), 'MMM d, yyyy')} ({booking.days} days)</span>
            </div>
            <div className="flex items-start gap-3 text-surface-700">
              <MapPin size={15} className="text-brand-500 shrink-0 mt-0.5" />
              <span>{booking.delivery_address}</span>
            </div>
            {booking.notes && (
              <div className="flex items-start gap-3 text-surface-700">
                <span className="text-surface-500 shrink-0">Note:</span>
                <span>{booking.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery status */}
        {booking.driver_name && (
          <div className="card mb-4">
            <h2 className="font-display font-semibold text-surface-900 mb-3">Delivery</h2>
            <div className="flex items-center gap-3 text-sm text-surface-700">
              <Truck size={15} className="text-brand-500" />
              <span>Driver: <strong>{booking.driver_name}</strong></span>
              {booking.driver_phone && (
                <a href={`tel:${booking.driver_phone}`} className="text-brand-400 flex items-center gap-1">
                  <Phone size={12} />{booking.driver_phone}
                </a>
              )}
            </div>
            <p className="text-xs text-surface-600 mt-2 capitalize">
              Status: {booking.delivery_status?.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Owner info */}
        <div className="card mb-4">
          <h2 className="font-display font-semibold text-surface-900 mb-3">Owner</h2>
          <div className="flex items-center gap-3 text-sm text-surface-700">
            <User size={15} className="text-brand-500" />
            <span>{booking.owner_name}</span>
            {booking.owner_phone && (
              <a href={`tel:${booking.owner_phone}`} className="text-brand-400 flex items-center gap-1">
                <Phone size={12} />{booking.owner_phone}
              </a>
            )}
          </div>
        </div>

        {/* Payment summary */}
        <div className="card mb-6">
          <h2 className="font-display font-semibold text-surface-900 mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            {[
              ['Subtotal', booking.subtotal],
              booking.delivery_fee > 0 && ['Delivery fee', booking.delivery_fee],
              ['Platform fee', booking.platform_fee],
              booking.security_deposit > 0 && ['Security deposit', booking.security_deposit],
            ].filter(Boolean).map(([label, amount]) => (
              <div key={label} className="flex justify-between text-surface-700">
                <span>{label}</span>
                <Price amount={amount} />
              </div>
            ))}
            <div className="flex justify-between font-bold text-surface-900 pt-2 border-t border-surface-300">
              <span>Total Paid</span>
              <Price amount={booking.total_amount} className="text-brand-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`badge ${booking.payment_status === 'success' ? 'badge-green' : 'badge-gray'}`}>
              Payment: {booking.payment_status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {canReview && (
            <Button onClick={() => setReviewModal(true)}>
              <Star size={15} />
              Leave a Review
            </Button>
          )}
          {canDispute && booking.status !== 'disputed' && (
            <Button variant="secondary" onClick={() => setDisputeModal(true)}>
              <ShieldAlert size={15} />
              File a Dispute
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setCancelModal(true)}>
              <AlertTriangle size={15} />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Booking">
        <p className="text-surface-600 text-sm mb-4">
          Are you sure you want to cancel this booking? Refunds are subject to the cancellation policy.
        </p>
        <div className="mb-4">
          <label className="label">Reason (optional)</label>
          <textarea
            className="input"
            rows={3}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Tell us why you're cancelling…"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setCancelModal(false)} className="flex-1">Keep Booking</Button>
          <Button variant="danger" onClick={handleCancel} loading={actionLoading} className="flex-1">Cancel Booking</Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Leave a Review">
        <div className="mb-4">
          <label className="label">Rating</label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-brand-400' : 'text-surface-400'}`}
              >★</button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="label">Your Review</label>
          <textarea
            className="input"
            rows={4}
            value={reviewBody}
            onChange={e => setReviewBody(e.target.value)}
            placeholder="Share your experience with this generator…"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setReviewModal(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleReview} loading={actionLoading} className="flex-1">Submit Review</Button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal open={disputeModal} onClose={() => setDisputeModal(false)} title="File a Dispute">
        <p className="text-surface-600 text-sm mb-4">
          Disputes are reviewed by our team within 24 hours. Please provide as much detail as possible.
        </p>
        <div className="space-y-4 mb-5">
          <div>
            <label className="label">Reason *</label>
            <select
              className="select"
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              <option value="Generator not delivered">Generator not delivered</option>
              <option value="Generator not working as described">Generator not working as described</option>
              <option value="Generator damaged on delivery">Generator damaged on delivery</option>
              <option value="Wrong generator delivered">Wrong generator delivered</option>
              <option value="Owner unresponsive">Owner unresponsive</option>
              <option value="Overcharged or billing issue">Overcharged / billing issue</option>
              <option value="Safety concern">Safety concern</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={4}
              value={disputeDesc}
              onChange={e => setDisputeDesc(e.target.value)}
              placeholder="Describe the issue in detail. What happened? When? What outcome are you seeking?"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDisputeModal(false)} className="flex-1">Cancel</Button>
          <Button
            variant="danger"
            onClick={handleDispute}
            loading={actionLoading}
            className="flex-1"
            disabled={!disputeReason}
          >
            <ShieldAlert size={15} />
            File Dispute
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
