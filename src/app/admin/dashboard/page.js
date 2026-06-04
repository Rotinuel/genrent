'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, Price } from '@/components/ui'
import { Users, Zap, Calendar, DollarSign, ShieldAlert, TrendingUp, BarChart2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useRequireAuth('admin')
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/bookings?limit=10').then(r => r.json()),
    ]).then(([s, b]) => {
      setStats(s.stats)
      setRecentBookings(b.bookings || [])
    }).finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-subtitle">Platform health at a glance</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats?.totalUsers?.toLocaleString(), icon: Users, href: '/admin/users' },
              { label: 'Active Listings', value: stats?.totalListings?.toLocaleString(), icon: Zap, href: '/admin/listings' },
              { label: 'Active Rentals', value: stats?.activeBookings?.toLocaleString(), icon: Calendar, highlight: true },
              { label: 'Completed', value: stats?.completedBookings?.toLocaleString(), icon: TrendingUp },
            ].map(({ label, value, icon: Icon, href, highlight }) => (
              <div key={label} className={`stat-card ${href ? 'hover:border-brand-500/40 cursor-pointer transition-all' : ''}`}
                onClick={() => href && (window.location.href = href)}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-surface-600 text-xs">{label}</p>
                  <Icon size={15} className={highlight ? 'text-brand-500' : 'text-surface-500'} />
                </div>
                <p className={`font-display font-bold text-3xl ${highlight ? 'text-brand-400' : 'text-surface-900'}`}>{value || 0}</p>
              </div>
            ))}
          </div>

          {/* Revenue cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="stat-card md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-surface-600 text-xs">Total Platform Revenue (GMV)</p>
                <DollarSign size={15} className="text-surface-500" />
              </div>
              <Price amount={stats?.totalRevenue || 0} className="font-display font-bold text-3xl text-surface-900" />
              <p className="text-xs text-surface-600 mt-1">Gross transaction volume</p>
            </div>
            <div className="stat-card bg-brand-500/10 border-brand-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-surface-600 text-xs">GenRent Commission</p>
                <BarChart2 size={15} className="text-brand-500" />
              </div>
              <Price amount={stats?.platformRevenue || 0} className="font-display font-bold text-3xl text-brand-400" />
              <p className="text-xs text-surface-600 mt-1">15% platform fee</p>
            </div>
          </div>

          {/* Alerts */}
          {(stats?.openDisputes || 0) > 0 && (
            <Link href="/admin/disputes" className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6 hover:bg-red-500/15 transition-colors">
              <ShieldAlert size={20} className="text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">{stats.openDisputes} Open Dispute{stats.openDisputes > 1 ? 's' : ''}</p>
                <p className="text-xs text-surface-600">Requires admin review</p>
              </div>
              <span className="ml-auto text-red-400 text-sm">Review →</span>
            </Link>
          )}

          {/* Quick actions */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Manage Users', href: '/admin/users', icon: Users, desc: 'View, suspend, verify users' },
              { label: 'Moderate Listings', href: '/admin/listings', icon: Zap, desc: 'Approve or suspend listings' },
              { label: 'Process Payouts', href: '/admin/payouts', icon: DollarSign, desc: 'Release owner earnings' },
            ].map(({ label, href, icon: Icon, desc }) => (
              <Link key={href} href={href} className="card-hover">
                <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={18} className="text-brand-500" />
                </div>
                <p className="font-display font-semibold text-surface-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-surface-600">{desc}</p>
              </Link>
            ))}
          </div>

          {/* Recent bookings */}
          <div>
            <h2 className="section-title">Recent Bookings</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-surface-300">
                    {['ID', 'Generator', 'Renter', 'Dates', 'Total', 'Status'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-surface-600 font-medium last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-300">
                  {recentBookings.slice(0, 8).map(b => (
                    <tr key={b.id} className="hover:bg-surface-200/50 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-xs text-surface-600">#{b.id?.slice(0, 8)}</td>
                      <td className="py-2.5 pr-4 text-surface-700 max-w-[140px] truncate">{b.generator_title}</td>
                      <td className="py-2.5 pr-4 text-surface-700">{b.renter_name}</td>
                      <td className="py-2.5 pr-4 text-surface-600 text-xs">{b.start_date} → {b.end_date}</td>
                      <td className="py-2.5 pr-4"><Price amount={b.total_amount} className="font-semibold text-surface-900" /></td>
                      <td className="py-2.5">
                        <span className={`badge ${
                          b.status === 'active' ? 'badge-green' :
                          b.status === 'completed' ? 'badge-green' :
                          b.status === 'confirmed' ? 'badge-blue' :
                          b.status === 'cancelled' ? 'badge-red' :
                          b.status === 'disputed' ? 'badge-red' : 'badge-gray'
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
