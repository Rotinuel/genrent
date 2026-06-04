'use client'

import { clsx } from 'clsx'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// ─── Button ───────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: '',
    lg: 'text-base px-7 py-3',
  }
  return (
    <button
      className={clsx(variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input className={clsx('input', error && 'border-red-500 focus:border-red-500', className)} {...props} />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select className={clsx('select', error && 'border-red-500', className)} {...props}>
        {children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        className={clsx('input resize-none', error && 'border-red-500', className)}
        rows={4}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending: 'badge-gray',
    confirmed: 'badge-blue',
    active: 'badge-green',
    completed: 'badge-green',
    cancelled: 'badge-red',
    disputed: 'badge-red',
    draft: 'badge-gray',
    paused: 'badge-orange',
    suspended: 'badge-red',
    active_listing: 'badge-green',
  }
  const labels = {
    active_listing: 'Active',
  }
  return (
    <span className={map[status] || 'badge-gray'}>
      {labels[status] || status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === overlayRef.current) onClose?.() }}
    >
      <div className={clsx('card w-full animate-fade-up shadow-card', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-surface-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-brand-500', className)} />
}

// ─── Empty state ──────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-surface-200 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-surface-600" />
        </div>
      )}
      <h3 className="font-display font-bold text-surface-800 text-lg mb-1">{title}</h3>
      {description && <p className="text-surface-600 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

// ─── Rating stars ─────────────────────────────────────────────
export function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= rating ? '#ff7d11' : 'none'} stroke={i <= rating ? '#ff7d11' : '#525252'} strokeWidth="1.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────
export function Avatar({ src, name, size = 36 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="rounded-full bg-brand-500/20 text-brand-400 font-display font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}

// ─── Price formatter ─────────────────────────────────────────
export function Price({ amount, className }) {
  return (
    <span className={className}>
      ₦{Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  )
}
