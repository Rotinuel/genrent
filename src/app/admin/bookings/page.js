'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, StatusBadge, Price, Button, Modal } from '@/components/ui'
import { Search, Calendar, Eye, CheckCircle, XCircle, Zap } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Disputed', value: 'disputed' },
]

export default function AdminBookingsPage() {
  const { user } = useRequireAuth('admin')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab) params.set('status', tab)
    if (search) params.set('q', search)
    fetch(`/api/admin/bookings?${params}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false))
  }, [tab, search])

  const handleAction = async (bookingId, action) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: data.booking.status } : b))
      if (selected?.id === bookingId) setSelected(prev => ({ ...prev, status: data.booking.status }))
      toast.success(`Booking ${action}d`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!user) return null

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    disputed: bookings.filter(b => b.status === 'disputed').length,
    revenue: bookings.filter(b => b.payment_status === 'success').reduce((s, b) => s + Number(b.total_amount || 0), 0),
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Bookings</h1>
        <p className="page-subtitle">Monitor and manage all platform bookings</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Showing', value: stats.total },
          { label: 'Active Rentals', value: stats.active, highlight: stats.active > 0 },
          { label: 'Disputed', value: stats.disputed, alert: stats.disputed > 0 },
          { label: 'Revenue (filtered)', amount: stats.revenue },
        ].map(({ label, value, amount, highlight, alert }) => (
          <div key={label} className={clsx('stat-card', alert && 'border-red-500/30')}>
            <p className="text-surface-600 text-xs mb-1">{label}</p>
            {amount !== undefined
              ? <Price amount={amount} className="font-display font-bold text-xl text-surface-900" />
              : <p className={clsx('font-display font-bold text-2xl', highlight ? 'text-brand-400' : alert ? 'text-red-400' : 'text-surface-900')}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600" />
          <input
            type="text"
            placeholder="Search by renter, owner, booking ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              tab === t.value ? 'bg-brand-500/20 text-brand-400' : 'text-surface-600 hover:bg-surface-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={36} className="text-surface-500 mx-auto mb-3" />
          <p className="text-surface-600">No bookings found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-surface-300">
                {['ID', 'Generator', 'Renter', 'Owner', 'Dates', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="pb-3 pr-3 text-surface-600 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-surface-200/40 transition-colors">
                  <td className="py-3 pr-3 font-mono text-xs text-surface-500">#{b.id?.slice(0, 8)}</td>
                  <td className="py-3 pr-3">
                    <p className="text-surface-800 font-medium max-w-[120px] truncate">{b.generator_title}</p>
                    <p className="text-xs text-surface-500">{b.generator_kva} KVA</p>
                  </td>
                  <td className="py-3 pr-3 text-surface-700">{b.renter_name}</td>
                  <td className="py-3 pr-3 text-surface-700">{b.owner_name}</td>
                  <td className="py-3 pr-3 text-surface-600 text-xs whitespace-nowrap">
                    {b.start_date} →<br />{b.end_date}
                  </td>
                  <td className="py-3 pr-3">
                    <Price amount={b.total_amount} className="font-semibold text-surface-900" />
                    <p className="text-xs text-surface-500">{b.payment_status}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected(b)}
                        className="p-1.5 rounded-lg text-surface-600 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      {b.status === 'pending' && (
                        <button
                          onClick={() => handleAction(b.id, 'confirm')}
                          className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Force confirm"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button
                          onClick={() => handleAction(b.id, 'cancel')}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancel booking"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Detail" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div><span className="text-surface-600">Booking ID:</span> <span className="font-mono text-xs text-surface-800">{selected.id}</span></div>
                <div><span className="text-surface-600">Generator:</span> <span className="text-surface-800 font-medium">{selected.generator_title}</span></div>
                <div><span className="text-surface-600">KVA:</span> <span className="text-surface-800">{selected.generator_kva}</span></div>
                <div><span className="text-surface-600">Renter:</span> <span className="text-surface-800">{selected.renter_name}</span></div>
                <div><span className="text-surface-600">Owner:</span> <span className="text-surface-800">{selected.owner_name}</span></div>
              </div>
              <div className="space-y-2">
                <div><span className="text-surface-600">Start:</span> <span className="text-surface-800">{selected.start_date}</span></div>
                <div><span className="text-surface-600">End:</span> <span className="text-surface-800">{selected.end_date}</span></div>
                <div><span className="text-surface-600">Days:</span> <span className="text-surface-800">{selected.days}</span></div>
                <div><span className="text-surface-600">Status:</span> <StatusBadge status={selected.status} /></div>
                <div><span className="text-surface-600">Payment:</span> <span className={`font-medium ${selected.payment_status === 'success' ? 'text-green-400' : 'text-surface-600'}`}>{selected.payment_status}</span></div>
              </div>
            </div>

            {selected.delivery_address && (
              <div className="text-sm">
                <span className="text-surface-600">Delivery address:</span>
                <p className="text-surface-800 mt-0.5">{selected.delivery_address}</p>
              </div>
            )}

            {/* Financials */}
            <div className="bg-surface-200 rounded-xl p-4 space-y-2 text-sm">
              {[
                ['Subtotal', selected.subtotal],
                ['Delivery fee', selected.delivery_fee],
                ['Platform fee', selected.platform_fee],
                ['Security deposit', selected.security_deposit],
              ].filter(([, v]) => Number(v) > 0).map(([label, amount]) => (
                <div key={label} className="flex justify-between text-surface-700">
                  <span>{label}</span>
                  <Price amount={amount} />
                </div>
              ))}
              <div className="flex justify-between font-bold text-surface-900 pt-2 border-t border-surface-300">
                <span>Total</span>
                <Price amount={selected.total_amount} className="text-brand-400" />
              </div>
              <div className="flex justify-between text-surface-600">
                <span>Owner payout</span>
                <Price amount={selected.owner_payout} />
              </div>
            </div>

            {selected.paystack_ref && (
              <p className="text-xs text-surface-500 font-mono">Paystack ref: {selected.paystack_ref}</p>
            )}

            {/* Admin actions */}
            <div className="flex gap-2 pt-2 border-t border-surface-300">
              {selected.status === 'confirmed' && (
                <Button size="sm" onClick={() => handleAction(selected.id, 'activate')} loading={actionLoading}>
                  <Zap size={13} /> Mark Active
                </Button>
              )}
              {selected.status === 'active' && (
                <Button size="sm" onClick={() => handleAction(selected.id, 'complete')} loading={actionLoading}>
                  <CheckCircle size={13} /> Mark Completed
                </Button>
              )}
              {['pending', 'confirmed'].includes(selected.status) && (
                <Button size="sm" variant="danger" onClick={() => handleAction(selected.id, 'cancel')} loading={actionLoading}>
                  <XCircle size={13} /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
