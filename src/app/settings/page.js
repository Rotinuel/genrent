'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button, Avatar, Input } from '@/components/ui'
import { Camera, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSendOtp = async () => {
    setSendingOtp(true)
    try {
      const res = await fetch('/api/auth/otp/send', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpSent(true)
      toast.success('OTP sent to your phone!')
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit code')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser({ phone_verified: true })
      setOtpSent(false)
      setOtp('')
      toast.success('Phone number verified! ✓')
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile and account</p>
        </div>

        {/* Avatar */}
        <div className="card mb-6">
          <h2 className="font-display font-bold text-lg text-surface-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user.avatar_url} name={user.full_name} size={64} />
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center">
                <Camera size={12} className="text-black" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900">{user.full_name}</p>
              <p className="text-xs text-surface-600 capitalize">{user.role} · Joined {new Date(user.created_at).getFullYear()}</p>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="card mb-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-surface-900">Personal Info</h2>

          <Input
            label="Full Name"
            value={form.full_name}
            onChange={e => update('full_name', e.target.value)}
          />

          <div>
            <label className="label">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={user.email} disabled />
            <p className="text-xs text-surface-600 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                className="input flex-1"
                placeholder="+234 801 234 5678"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
              />
              {user.phone_verified ? (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium whitespace-nowrap">
                  <CheckCircle size={14} />
                  Verified
                </div>
              ) : (
                <Button onClick={handleSendOtp} loading={sendingOtp} variant="secondary" size="sm" className="whitespace-nowrap">
                  <Phone size={14} />
                  Verify Phone
                </Button>
              )}
            </div>
          </div>

          {/* OTP input */}
          {otpSent && !user.phone_verified && (
            <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl animate-fade-in">
              <p className="text-sm text-surface-800 mb-3">
                Enter the 6-digit code sent to <strong>{form.phone}</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 font-mono text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <Button onClick={handleVerifyOtp} loading={verifying}>
                  Verify
                </Button>
              </div>
              <button onClick={handleSendOtp} disabled={sendingOtp} className="text-xs text-brand-400 hover:underline mt-2">
                Resend code
              </button>
            </div>
          )}

          {!user.phone_verified && !otpSent && (
            <div className="flex items-start gap-2 p-3 bg-surface-200 rounded-xl">
              <AlertCircle size={14} className="text-brand-400 shrink-0 mt-0.5" />
              <p className="text-xs text-surface-600">
                Verify your phone number to increase trust with renters and owners.
              </p>
            </div>
          )}

          <Button onClick={handleSaveProfile} loading={saving} className="w-full">
            Save Changes
          </Button>
        </div>

        {/* Verification status */}
        <div className="card mb-6">
          <h2 className="font-display font-bold text-lg text-surface-900 mb-4">Verification Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Email Verified', done: user.email_verified },
              { label: 'Phone Verified', done: user.phone_verified },
              { label: 'ID Verified', done: user.id_verified },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-surface-700">{label}</span>
                <span className={`flex items-center gap-1.5 font-medium ${done ? 'text-green-400' : 'text-surface-500'}`}>
                  {done ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {done ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
          {!user.id_verified && (
            <div className="mt-4 p-3 bg-surface-200 rounded-xl text-xs text-surface-600">
              ID verification is reviewed by our team. Contact <a href="mailto:verify@genrent.com" className="text-brand-400">verify@genrent.com</a> to submit your ID.
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="card border-red-500/20">
          <h2 className="font-display font-bold text-lg text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-surface-600 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
          <Button variant="danger" size="sm" onClick={() => toast.error('Please contact support@genrent.com to delete your account.')}>
            Delete Account
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
