'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Spinner, Price, Button, Modal } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import { DollarSign, TrendingUp, Clock, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EarningsPage() {
  const { user } = useRequireAuth('owner')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bankModal, setBankModal] = useState(false)
  const [bankForm, setBankForm] = useState({ account_number: '', bank_code: '', bank_name: '' })
  const [banks, setBanks] = useState([])
  const [savingBank, setSavingBank] = useState(false)

  useEffect(() => {
    fetch('/api/bookings?role=owner')
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false))

    // Fetch banks
    fetch('/api/payments/banks')
      .then(r => r.json())
      .then(data => setBanks(data.banks || []))
      .catch(() => {})
  }, [])

  const completed = bookings.filter(b => b.status === 'completed')
  const pending = bookings.filter(b => ['confirmed', 'active'].includes(b.status))

  const totalEarned = completed.reduce((s, b) => s + Number(b.owner_payout || 0), 0)
  const pendingAmount = pending.reduce((s, b) => s + Number(b.owner_payout || 0), 0)

  const handleSaveBank = async () => {
    if (!bankForm.account_number || !bankForm.bank_code) {
      toast.error('Account number and bank are required')
      return
    }
    setSavingBank(true)
    try {
      const res = await fetch('/api/owner/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Bank account saved!')
      setBankModal(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingBank(false)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-subtitle">Track your income and manage payouts</p>
        </div>
        <Button onClick={() => setBankModal(true)}>
          <CreditCard size={16} />
          {user.bank_account ? 'Update Bank' : 'Add Bank Account'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned', amount: totalEarned, icon: TrendingUp, highlight: true },
          { label: 'Pending Payout', amount: pendingAmount, icon: Clock },
          { label: 'Completed Bookings', value: completed.length, icon: DollarSign },
        ].map(({ label, amount, value, icon: Icon, highlight }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-600 text-xs">{label}</p>
              <Icon size={15} className={highlight ? 'text-brand-500' : 'text-surface-500'} />
            </div>
            {amount !== undefined ? (
              <Price amount={amount} className={`font-display font-bold text-2xl ${highlight ? 'text-brand-400' : 'text-surface-900'}`} />
            ) : (
              <p className="font-display font-bold text-2xl text-surface-900">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Bank account status */}
      {!user.bank_account && (
        <div className="card bg-brand-500/10 border-brand-500/30 mb-6 flex items-center gap-4">
          <CreditCard size={20} className="text-brand-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-surface-900">Add your bank account to receive payouts</p>
            <p className="text-xs text-surface-600">Payouts are released within 48 hours of booking completion.</p>
          </div>
          <Button onClick={() => setBankModal(true)} size="sm">Add Bank</Button>
        </div>
      )}

      {/* Earnings table */}
      <div>
        <h2 className="section-title">Earnings History</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : completed.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-surface-600 text-sm">No completed bookings yet. Your earnings will appear here.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-surface-300">
                  <th className="pb-3 pr-4 text-surface-600 font-medium">Booking</th>
                  <th className="pb-3 pr-4 text-surface-600 font-medium">Dates</th>
                  <th className="pb-3 pr-4 text-surface-600 font-medium">Renter</th>
                  <th className="pb-3 pr-4 text-surface-600 font-medium text-right">Gross</th>
                  <th className="pb-3 text-surface-600 font-medium text-right">Your Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300">
                {completed.map(b => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 text-surface-700 font-mono text-xs">#{b.id?.slice(0, 8)}</td>
                    <td className="py-3 pr-4 text-surface-700">
                      {format(parseISO(b.start_date), 'MMM d')} – {format(parseISO(b.end_date), 'MMM d')}
                    </td>
                    <td className="py-3 pr-4 text-surface-700">{b.renter_name}</td>
                    <td className="py-3 pr-4 text-right text-surface-700">
                      <Price amount={b.total_amount} />
                    </td>
                    <td className="py-3 text-right font-semibold text-brand-400">
                      <Price amount={b.owner_payout} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-surface-400">
                  <td colSpan={4} className="pt-3 text-surface-600 font-medium">Total</td>
                  <td className="pt-3 text-right font-display font-bold text-brand-400">
                    <Price amount={totalEarned} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Bank account modal */}
      <Modal open={bankModal} onClose={() => setBankModal(false)} title="Bank Account Details">
        <p className="text-sm text-surface-600 mb-4">Your payout will be sent to this account after each completed booking.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Bank</label>
            <select
              className="select"
              value={bankForm.bank_code}
              onChange={e => {
                const bank = banks.find(b => b.code === e.target.value)
                setBankForm(prev => ({ ...prev, bank_code: e.target.value, bank_name: bank?.name || '' }))
              }}
            >
              <option value="">Select your bank</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account Number</label>
            <input
              type="text"
              className="input"
              placeholder="0123456789"
              maxLength={10}
              value={bankForm.account_number}
              onChange={e => setBankForm(prev => ({ ...prev, account_number: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setBankModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveBank} loading={savingBank} className="flex-1">Save Account</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
