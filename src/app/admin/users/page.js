'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, Avatar, Button, Modal } from '@/components/ui'
import { Search, Shield, ShieldOff, CheckCircle, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function AdminUsersPage() {
  const { user } = useRequireAuth('admin')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (roleFilter) params.set('role', roleFilter)
    setLoading(true)
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .finally(() => setLoading(false))
  }, [search, roleFilter])

  const handleToggle = async (userId, field, currentValue) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.user } : u))
      toast.success('User updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage platform users, verification and access</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select className="select w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="renter">Renters</option>
          <option value="owner">Owners</option>
          <option value="driver">Drivers</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-surface-300">
                {['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="pb-3 pr-4 text-surface-600 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-200/40 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar_url} name={u.full_name} size={32} />
                      <div>
                        <p className="font-medium text-surface-900">{u.full_name}</p>
                        <p className="text-xs text-surface-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={clsx('badge capitalize', {
                      'badge-orange': u.role === 'owner',
                      'badge-blue': u.role === 'driver',
                      'badge-gray': u.role === 'renter',
                      'badge-green': u.role === 'admin',
                    })}>{u.role}</span>
                  </td>
                  <td className="py-3 pr-4 text-surface-600 text-xs">
                    {u.phone || '—'}
                    {u.phone_verified && <span className="ml-1 text-green-400">✓</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-surface-600 text-xs">
                    {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(u.id, 'is_active', u.is_active)}
                        className={clsx('p-1.5 rounded-lg transition-colors text-xs', u.is_active ? 'hover:bg-red-500/10 hover:text-red-400 text-surface-600' : 'hover:bg-green-500/10 hover:text-green-400 text-surface-600')}
                        title={u.is_active ? 'Suspend user' : 'Activate user'}
                      >
                        {u.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      {!u.id_verified && (
                        <button
                          onClick={() => handleToggle(u.id, 'id_verified', false)}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 hover:text-green-400 text-surface-600 transition-colors"
                          title="Mark ID verified"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-10 text-surface-600 text-sm">No users found.</p>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
