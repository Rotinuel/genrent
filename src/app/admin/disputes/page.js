'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, EmptyState, StatusBadge, Price, Button, Modal, Avatar } from '@/components/ui'
import { ShieldAlert, Search, CheckCircle, XCircle, MessageSquare, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const STATUS_COLORS = {
  open: 'badge-red',
  investigating: 'badge-orange',
  resolved: 'badge-green',
  closed: 'badge-gray',
}

export default function AdminDisputesPage() {
  const { user } = useRequireAuth('admin')
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('open')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab) params.set('status', tab)
    if (search) params.set('q', search)
    fetch(`/api/admin/disputes?${params}`)
      .then(r => r.json())
      .then(data => setDisputes(data.disputes || []))
      .finally(() => setLoading(false))
  }, [tab, search])

  const updateDisputeStatus = async (disputeId, status, resolutionText) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution: resolutionText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, ...data.dispute } : d))
      setSelected(prev => prev?.id === disputeId ? { ...prev, ...data.dispute } : prev)
      toast.success(`Dispute marked as ${status}`)
      if (status === 'resolved' || status === 'closed') setSelected(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openCount = disputes.filter(d => d.status === 'open').length

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Disputes</h1>
        <p className="page-subtitle">Review and resolve booking disputes between renters and owners</p>
      </div>

      {/* Alert banner for open disputes */}
      {openCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium">
            {openCount} open dispute{openCount > 1 ? 's' : ''} require{openCount === 1 ? 's' : ''} attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600" />
          <input
            type="text"
            placeholder="Search by booking ID or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
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

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No disputes found"
          description={tab ? `No ${tab} disputes at this time.` : 'No disputes yet on the platform.'}
        />
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <div
              key={dispute.id}
              className={clsx(
                'card hover:border-brand-500/40 transition-all cursor-pointer',
                dispute.status === 'open' && 'border-l-4 border-l-red-500'
              )}
              onClick={() => { setSelected(dispute); setResolution(dispute.resolution || '') }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={clsx('badge', STATUS_COLORS[dispute.status] || 'badge-gray')}>
                      {dispute.status}
                    </span>
                    <span className="text-xs text-surface-500 font-mono">
                      Booking #{dispute.booking_id?.slice(0, 8)}
                    </span>
                    <span className="text-xs text-surface-500">·</span>
                    <span className="text-xs text-surface-500">
                      {dispute.created_at ? format(new Date(dispute.created_at), 'MMM d, yyyy') : '—'}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="font-display font-semibold text-surface-900 text-sm mb-1">
                    {dispute.reason}
                  </p>

                  {/* Description excerpt */}
                  {dispute.description && (
                    <p className="text-xs text-surface-600 line-clamp-2 mb-2">
                      {dispute.description}
                    </p>
                  )}

                  {/* Parties */}
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    <span>Raised by: <span className="text-surface-700 font-medium">{dispute.raiser_name || 'Unknown'}</span></span>
                    {dispute.generator_title && (
                      <>
                        <span>·</span>
                        <span>Generator: <span className="text-surface-700">{dispute.generator_title}</span></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Booking total */}
                {dispute.booking_total && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-surface-600">Booking value</p>
                    <Price amount={dispute.booking_total} className="font-display font-bold text-surface-900" />
                  </div>
                )}
              </div>

              {/* Resolution preview */}
              {dispute.resolution && (
                <div className="mt-3 pt-3 border-t border-surface-300 flex items-start gap-2 text-xs text-surface-600">
                  <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{dispute.resolution}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dispute detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Dispute Details" size="lg">
        {selected && (
          <div className="space-y-5">

            {/* Status + metadata */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={clsx('badge', STATUS_COLORS[selected.status] || 'badge-gray')}>
                {selected.status}
              </span>
              <span className="text-xs text-surface-500 font-mono">
                Dispute #{selected.id?.slice(0, 8)}
              </span>
              <span className="text-xs text-surface-500">
                Filed {selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy HH:mm') : '—'}
              </span>
            </div>

            {/* Booking info */}
            <div className="bg-surface-200 rounded-xl p-4 text-sm space-y-2">
              <p className="font-display font-semibold text-surface-900 text-xs uppercase tracking-wide mb-3">Booking Info</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-surface-600">Booking ID:</span><span className="ml-2 font-mono text-xs text-surface-800">{selected.booking_id?.slice(0, 8)}</span></div>
                {selected.generator_title && <div><span className="text-surface-600">Generator:</span><span className="ml-2 text-surface-800">{selected.generator_title}</span></div>}
                {selected.booking_start && <div><span className="text-surface-600">Dates:</span><span className="ml-2 text-surface-800">{selected.booking_start} → {selected.booking_end}</span></div>}
                {selected.booking_total && <div><span className="text-surface-600">Value:</span><Price amount={selected.booking_total} className="ml-2 font-semibold text-surface-800" /></div>}
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card bg-surface-200 border-surface-300">
                <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">Filed By</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.raiser_name} size={28} />
                  <div>
                    <p className="text-sm font-medium text-surface-900">{selected.raiser_name || '—'}</p>
                    <p className="text-xs text-surface-500 capitalize">{selected.raiser_role || ''}</p>
                  </div>
                </div>
              </div>
              {selected.renter_name && (
                <div className="card bg-surface-200 border-surface-300">
                  <p className="text-xs text-surface-500 uppercase tracking-wide mb-2">Other Party</p>
                  <div className="flex items-center gap-2">
                    <Avatar name={selected.renter_name} size={28} />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{selected.renter_name}</p>
                      <p className="text-xs text-surface-500">Renter</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reason + description */}
            <div>
              <p className="label">Reason</p>
              <p className="text-surface-900 font-semibold">{selected.reason}</p>
            </div>
            {selected.description && (
              <div>
                <p className="label">Description</p>
                <p className="text-surface-700 text-sm leading-relaxed">{selected.description}</p>
              </div>
            )}

            {/* Evidence */}
            {selected.evidence_urls?.length > 0 && (
              <div>
                <p className="label mb-2">Evidence ({selected.evidence_urls.length} files)</p>
                <div className="flex flex-wrap gap-2">
                  {selected.evidence_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-surface-200 hover:bg-surface-300 rounded-lg text-xs text-brand-400 transition-colors"
                    >
                      Evidence {i + 1} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution input */}
            <div>
              <label className="label">Resolution / Admin Notes</label>
              <textarea
                className="input resize-none h-24"
                placeholder="Describe how this dispute was resolved, what action was taken, and any refund decisions…"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                disabled={selected.status === 'closed'}
              />
            </div>

            {/* Previous resolution */}
            {selected.resolved_by && (
              <p className="text-xs text-surface-500">
                Resolved by admin on {selected.resolved_at ? format(new Date(selected.resolved_at), 'MMM d, yyyy') : '—'}
              </p>
            )}

            {/* Action buttons */}
            {!['resolved', 'closed'].includes(selected.status) && (
              <div className="flex gap-2 pt-2 border-t border-surface-300 flex-wrap">
                {selected.status === 'open' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateDisputeStatus(selected.id, 'investigating', resolution)}
                    loading={actionLoading}
                  >
                    <Search size={13} />
                    Start Investigation
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => updateDisputeStatus(selected.id, 'resolved', resolution)}
                  loading={actionLoading}
                  disabled={!resolution.trim()}
                >
                  <CheckCircle size={13} />
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateDisputeStatus(selected.id, 'closed', resolution)}
                  loading={actionLoading}
                >
                  <XCircle size={13} />
                  Close (No Action)
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
