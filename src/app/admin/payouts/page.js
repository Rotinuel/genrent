'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, Price, Button } from '@/components/ui'
import { DollarSign, Send, CheckCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminPayoutsPage() {
  const { user } = useRequireAuth('admin')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)

  // Load completed bookings not yet paid out
  useEffect(() => {
    fetch('/api/admin/payouts')
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false))
  }, [])

  const processPayout = async (bookingId) => {
    setPaying(bookingId)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payout_status: 'paid' } : b))
      toast.success('Payout initiated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPaying(null)
    }
  }

  const pending = bookings.filter(b => b.payout_status !== 'paid')
  const processed = bookings.filter(b => b.payout_status === 'paid')
  const totalPending = pending.reduce((s, b) => s + Number(b.owner_payout || 0), 0)

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Payouts</h1>
        <p className="page-subtitle">Process owner earnings for completed bookings</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card bg-brand-500/10 border-brand-500/30">
          <p className="text-surface-600 text-xs mb-2">Pending Payouts</p>
          <Price amount={totalPending} className="font-display font-bold text-2xl text-brand-400" />
          <p className="text-xs text-surface-600 mt-1">{pending.length} bookings</p>
        </div>
        <div className="stat-card">
          <p className="text-surface-600 text-xs mb-2">Processed Today</p>
          <p className="font-display font-bold text-2xl text-surface-900">{processed.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-surface-600 text-xs mb-2">Owners Awaiting</p>
          <p className="font-display font-bold text-2xl text-surface-900">
            {new Set(pending.map(b => b.owner_id)).size}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {/* Pending payouts */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="section-title">Pending Payouts</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-surface-300">
                      {['Booking', 'Owner', 'Generator', 'Completed', 'Payout', 'Action'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-surface-600 font-medium last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-300">
                    {pending.map(b => (
                      <tr key={b.id} className="hover:bg-surface-200/40">
                        <td className="py-3 pr-4 font-mono text-xs text-surface-600">#{b.id?.slice(0, 8)}</td>
                        <td className="py-3 pr-4">
                          <p className="text-surface-900 font-medium">{b.owner_name}</p>
                          <p className="text-xs text-surface-600">{b.owner?.bank_account ? '🏦 Bank set' : '⚠️ No bank'}</p>
                        </td>
                        <td className="py-3 pr-4 text-surface-700 max-w-[120px] truncate">{b.generator_title}</td>
                        <td className="py-3 pr-4 text-surface-600 text-xs">
                          {b.updated_at ? format(new Date(b.updated_at), 'MMM d') : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <Price amount={b.owner_payout} className="font-display font-bold text-brand-400" />
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            onClick={() => processPayout(b.id)}
                            loading={paying === b.id}
                            disabled={!b.owner?.bank_account}
                          >
                            <Send size={13} />
                            Pay Out
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Processed */}
          {processed.length > 0 && (
            <div>
              <h2 className="section-title">Processed Payouts</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-surface-300">
                      {['Booking', 'Owner', 'Amount', 'Date'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-surface-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-300">
                    {processed.map(b => (
                      <tr key={b.id} className="hover:bg-surface-200/40">
                        <td className="py-2.5 pr-4 font-mono text-xs text-surface-600">#{b.id?.slice(0, 8)}</td>
                        <td className="py-2.5 pr-4 text-surface-700">{b.owner_name}</td>
                        <td className="py-2.5 pr-4">
                          <Price amount={b.owner_payout} className="font-semibold text-surface-900" />
                        </td>
                        <td className="py-2.5 text-surface-600 text-xs">
                          <CheckCircle size={12} className="inline mr-1 text-green-400" />
                          Paid
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <DollarSign size={40} className="text-surface-500 mx-auto mb-3" />
              <p className="text-surface-600">No payouts to process right now.</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
