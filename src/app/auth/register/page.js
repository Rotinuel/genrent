'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Zap, Eye, EyeOff, User, Wrench, Truck } from 'lucide-react'
import { Button } from '@/components/ui'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'renter', label: 'Renter', desc: 'Find and rent generators', icon: User },
  { value: 'owner', label: 'Owner', desc: 'List your generators & earn', icon: Wrench },
  { value: 'driver', label: 'Driver', desc: 'Deliver generators, earn per trip', icon: Truck },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [role, setRole] = useState(searchParams.get('role') || 'renter')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const redirectMap = {
    renter: '/renter/dashboard',
    owner: '/owner/listings/new',
    driver: '/driver/dashboard',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const user = await register({ ...form, role })
      toast.success('Account created! Welcome to GenRent ⚡')
      router.push(redirectMap[user.role] || '/')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-black" fill="black" />
          </div>
          <span className="font-display font-bold text-2xl text-surface-900">GenRent</span>
        </Link>

        <div className="card">
          <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Create account</h1>
          <p className="text-surface-600 text-sm mb-5">Join the generator marketplace</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={clsx(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                  role === value
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-surface-300 hover:border-surface-400 text-surface-600 hover:text-surface-800'
                )}
              >
                <Icon size={18} />
                <span className="font-display font-semibold text-xs">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-surface-600 mb-5 text-center">
            {ROLES.find(r => r.value === role)?.desc}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="John Doe" value={form.full_name} onChange={e => update('full_name', e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="+234 801 234 5678" value={form.phone} onChange={e => update('phone', e.target.value)} autoComplete="tel" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-600 hover:text-surface-800">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-surface-600 mt-4">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-brand-400 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-surface-600 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
