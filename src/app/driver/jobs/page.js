'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, EmptyState, Price, Button } from '@/components/ui'
import { Truck, MapPin, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DriverJobsPage() {
  const { user } = useRequireAuth('driver')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  const fetchJobs = () => {
    setLoading(true)
    fetch('/api/drivers?status=available')
      .then(r => r.json())
      .then(data => setJobs(data.jobs || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchJobs() }, [])

  const acceptJob = async (jobId) => {
    setAccepting(jobId)
    try {
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, action: 'accept' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success('Job accepted! Check your dashboard.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAccepting(null)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Available Jobs</h1>
          <p className="page-subtitle">Pick up delivery jobs near you</p>
        </div>
        <button onClick={fetchJobs} className="btn-secondary">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No jobs available"
          description="Check back soon — new delivery jobs are added as bookings come in."
        />
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="card hover:border-brand-500/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display font-bold text-surface-900">{job.booking?.generator?.title}</p>
                  <p className="text-sm text-surface-600">
                    {job.booking?.generator?.kva} KVA · {job.booking?.generator?.brand}
                  </p>
                </div>
                {job.fee && (
                  <div className="text-right">
                    <Price amount={job.fee} className="font-display font-bold text-xl text-brand-400" />
                    <p className="text-xs text-surface-600">delivery fee</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-3 text-sm text-surface-700">
                  <div className="w-5 h-5 bg-surface-300 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Package size={11} className="text-surface-600" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Pickup from</p>
                    <p>{job.pickup_address}</p>
                  </div>
                </div>

                <div className="ml-2.5 w-px h-4 bg-surface-400" />

                <div className="flex items-start gap-3 text-sm text-surface-700">
                  <div className="w-5 h-5 bg-brand-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={11} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Deliver to</p>
                    <p>{job.delivery_address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-surface-500 mb-4">
                <span>Rental: {job.booking?.start_date} → {job.booking?.end_date}</span>
                <span className="badge-gray">Return required</span>
              </div>

              <Button
                onClick={() => acceptJob(job.id)}
                loading={accepting === job.id}
                className="w-full"
              >
                <Truck size={15} />
                Accept This Job
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
