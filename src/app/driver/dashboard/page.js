'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, EmptyState, Price, Button, StatusBadge } from '@/components/ui'
import { Truck, MapPin, Phone, Calendar, DollarSign, CheckCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_ACTIONS = {
  assigned: { label: 'Start Pickup', action: 'en_route_pickup', color: 'btn-primary' },
  accepted: { label: 'Confirm Picked Up', action: 'pickup', color: 'btn-primary' },
  en_route_pickup: { label: 'Confirm Picked Up', action: 'pickup', color: 'btn-primary' },
  picked_up: { label: 'Mark Delivered', action: 'deliver', color: 'btn-primary' },
  en_route_delivery: { label: 'Mark Delivered', action: 'deliver', color: 'btn-primary' },
  delivered: { label: 'Start Return', action: 'return_start', color: 'btn-secondary' },
  en_route_return: { label: 'Mark Returned', action: 'complete', color: 'btn-primary' },
}

export default function DriverDashboard() {
  const { user } = useRequireAuth('driver')
  const [myJobs, setMyJobs] = useState([])
  const [availableJobs, setAvailableJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/drivers?status=available').then(r => r.json()),
    ]).then(([mine, available]) => {
      setMyJobs(mine.jobs || [])
      setAvailableJobs(available.jobs || [])
    }).finally(() => setLoading(false))
  }, [])

  const totalEarned = myJobs
    .filter(j => j.status === 'returned')
    .reduce((s, j) => s + Number(j.fee || 0), 0)

  const handleAction = async (jobId, action) => {
    setUpdating(jobId)
    try {
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...data.job } : j))
      toast.success('Status updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleAcceptJob = async (jobId) => {
    setUpdating(jobId)
    try {
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, action: 'accept' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId))
      setMyJobs(prev => [data.job, ...prev])
      toast.success('Job accepted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  if (!user) return null

  const active = myJobs.filter(j => !['returned', 'cancelled'].includes(j.status))
  const completed = myJobs.filter(j => j.status === 'returned')

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Driver Dashboard</h1>
        <p className="page-subtitle">Manage your deliveries and track earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-surface-600 text-xs">Active Jobs</p>
            <Truck size={15} className="text-brand-500" />
          </div>
          <p className="font-display font-bold text-3xl text-brand-400">{active.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-surface-600 text-xs">Completed</p>
            <CheckCircle size={15} className="text-surface-500" />
          </div>
          <p className="font-display font-bold text-3xl text-surface-900">{completed.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-surface-600 text-xs">Total Earned</p>
            <DollarSign size={15} className="text-surface-500" />
          </div>
          <Price amount={totalEarned} className="font-display font-bold text-2xl text-surface-900" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {[
          { label: 'Active Jobs', value: 'active' },
          { label: 'Available', value: 'available' },
          { label: 'Completed', value: 'completed' },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.value ? 'bg-brand-500/20 text-brand-400' : 'text-surface-600 hover:bg-surface-200'
            )}
          >
            {t.label}
            {t.value === 'available' && availableJobs.length > 0 && (
              <span className="ml-1.5 badge-orange">{availableJobs.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {tab === 'active' && (
            active.length === 0 ? (
              <EmptyState icon={Truck} title="No active jobs" description="Accept available jobs to start delivering." />
            ) : (
              <div className="space-y-4">
                {active.map(job => <JobCard key={job.id} job={job} onAction={handleAction} updating={updating} />)}
              </div>
            )
          )}

          {tab === 'available' && (
            availableJobs.length === 0 ? (
              <EmptyState icon={MapPin} title="No available jobs" description="New delivery jobs will appear here." />
            ) : (
              <div className="space-y-4">
                {availableJobs.map(job => (
                  <div key={job.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-surface-900">{job.booking?.generator?.title}</p>
                        <p className="text-xs text-surface-600">{job.booking?.generator?.kva} KVA</p>
                      </div>
                      {job.fee && <Price amount={job.fee} className="font-display font-bold text-brand-400" />}
                    </div>
                    <div className="space-y-1.5 text-xs text-surface-600 mb-4">
                      <p className="flex items-center gap-1.5"><MapPin size={12} /> Pickup: {job.pickup_address}</p>
                      <p className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-500" /> Deliver to: {job.delivery_address}</p>
                    </div>
                    <Button
                      onClick={() => handleAcceptJob(job.id)}
                      loading={updating === job.id}
                      className="w-full"
                    >
                      Accept Job
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'completed' && (
            completed.length === 0 ? (
              <EmptyState icon={CheckCircle} title="No completed jobs" description="Completed deliveries will appear here." />
            ) : (
              <div className="space-y-3">
                {completed.map(job => (
                  <div key={job.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">{job.booking?.generator?.title}</p>
                      <p className="text-xs text-surface-600">{job.delivery_address}</p>
                      {job.returned_at && <p className="text-xs text-surface-500">{format(parseISO(job.returned_at), 'MMM d, yyyy')}</p>}
                    </div>
                    <Price amount={job.fee || 0} className="font-display font-bold text-brand-400" />
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </DashboardLayout>
  )
}

function JobCard({ job, onAction, updating }) {
  const nextAction = STATUS_ACTIONS[job.status]

  return (
    <div className="card border-l-4 border-l-brand-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-semibold text-surface-900">{job.booking?.generator?.title}</p>
          <p className="text-xs text-surface-600 capitalize">{job.status?.replace(/_/g, ' ')}</p>
        </div>
        {job.fee && <Price amount={job.fee} className="font-display font-bold text-brand-400" />}
      </div>

      <div className="space-y-2 text-xs text-surface-600 mb-4">
        <p className="flex items-center gap-1.5"><MapPin size={11} /> Pickup: {job.pickup_address}</p>
        <p className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-500" /> Deliver to: {job.delivery_address}</p>
        {job.booking?.renter?.full_name && (
          <p className="flex items-center gap-1.5">
            <Phone size={11} />
            Renter: {job.booking.renter.full_name}
            {job.booking.renter.phone && (
              <a href={`tel:${job.booking.renter.phone}`} className="text-brand-400 ml-1">{job.booking.renter.phone}</a>
            )}
          </p>
        )}
      </div>

      {nextAction && (
        <Button
          onClick={() => onAction(job.id, nextAction.action)}
          loading={updating === job.id}
          className="w-full"
        >
          {nextAction.label}
        </Button>
      )}
    </div>
  )
}
