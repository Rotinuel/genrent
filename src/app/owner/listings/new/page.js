'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { FUEL_TYPES } from '@/types'
import { NIGERIAN_STATES } from '@/lib/geo'
import { Upload, X, Zap, Image as ImageIcon, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STEPS = ['Generator Info', 'Pricing', 'Location & Delivery', 'Photos & Publish']

export default function NewListingPage() {
  const { user } = useRequireAuth('owner')
  const router = useRouter()
  const fileRef = useRef(null)

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [createdId, setCreatedId] = useState(null)
  const [photos, setPhotos] = useState([]) // { url, file, preview } objects
  const [uploadedUrls, setUploadedUrls] = useState([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    model: '',
    kva: '',
    fuel_type: 'diesel',
    year_manufactured: '',
    condition_rating: '4',
    price_daily: '',
    price_weekly: '',
    price_monthly: '',
    security_deposit: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    service_radius_km: '20',
    self_delivery: false,
    delivery_fee_base: '',
    delivery_fee_per_km: '',
    instant_book: true,
  })

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // ─── Step validation ──────────────────────────────────────────
  const canProceed = {
    1: form.title && form.brand && form.kva && form.fuel_type,
    2: form.price_daily,
    3: form.city && form.state,
  }

  // ─── Create listing (draft) on step 3 → 4 ────────────────────
  const createListing = async () => {
    if (createdId) return createdId // already created
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setCreatedId(data.listing.id)
    return data.listing.id
  }

  const handleNext = async () => {
    if (step === 3) {
      // Create listing as draft before showing photo step
      setSubmitting(true)
      try {
        await createListing()
        setStep(4)
      } catch (err) {
        toast.error(err.message || 'Failed to save listing')
      } finally {
        setSubmitting(false)
      }
      return
    }
    setStep(s => s + 1)
  }

  // ─── Photo selection (local preview) ─────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removePhoto = (idx) => {
    setPhotos(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[idx].preview)
      updated.splice(idx, 1)
      return updated
    })
  }

  // ─── Upload photos then activate listing ─────────────────────
  const handlePublish = async () => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo before publishing')
      return
    }

    setUploading(true)
    try {
      const listingId = createdId || (await createListing())

      // Upload photos
      const fd = new FormData()
      photos.forEach(p => fd.append('photos', p.file))

      const upRes = await fetch(`/api/listings/${listingId}/photos`, {
        method: 'POST',
        body: fd,
      })
      const upData = await upRes.json()
      if (!upRes.ok) throw new Error(upData.error || 'Photo upload failed')

      setUploadedUrls(upData.photos || [])

      // Activate listing
      const activateRes = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (!activateRes.ok) {
        const d = await activateRes.json()
        throw new Error(d.error || 'Failed to activate listing')
      }

      toast.success('Listing published! Renters can now find it. ⚡')
      router.push(`/owner/listings/${listingId}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  // ─── Save as draft without photos ────────────────────────────
  const handleSaveDraft = async () => {
    setSubmitting(true)
    try {
      const listingId = createdId || (await createListing())
      toast.success('Saved as draft. Add photos later to publish.')
      router.push(`/owner/listings/${listingId}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">Add Your Generator</h1>
          <p className="page-subtitle">Fill in the details to list your generator for rent</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const s = i + 1
            const done = step > s
            const active = step === s
            return (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold transition-all',
                    active ? 'bg-brand-500 text-black' :
                    done ? 'bg-brand-500/30 text-brand-400' :
                    'bg-surface-300 text-surface-600'
                  )}>
                    {done ? <CheckCircle size={16} /> : s}
                  </div>
                  <span className={clsx('text-xs hidden sm:block', active ? 'text-surface-900 font-medium' : 'text-surface-500')}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={clsx('h-px flex-1', done ? 'bg-brand-500' : 'bg-surface-300')} />
                )}
              </div>
            )
          })}
        </div>

        <div className="card space-y-5">

          {/* ── Step 1: Generator Info ─────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="font-display font-bold text-xl text-surface-900">Generator Details</h2>

              <Input
                label="Listing Title *"
                placeholder="e.g. Lutian 7.5KVA Silent Generator"
                value={form.title}
                onChange={e => update('title', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Brand *" placeholder="e.g. Lutian, Elepaq, Sumec" value={form.brand} onChange={e => update('brand', e.target.value)} />
                <Input label="Model" placeholder="e.g. LT6500" value={form.model} onChange={e => update('model', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="KVA Rating *" type="number" step="0.5" min="0.5" placeholder="e.g. 7.5" value={form.kva} onChange={e => update('kva', e.target.value)} />
                <Select label="Fuel Type *" value={form.fuel_type} onChange={e => update('fuel_type', e.target.value)}>
                  {FUEL_TYPES.map(f => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Year Manufactured" type="number" placeholder="e.g. 2022" value={form.year_manufactured} onChange={e => update('year_manufactured', e.target.value)} />
                <Select label="Condition" value={form.condition_rating} onChange={e => update('condition_rating', e.target.value)}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Fair</option>
                  <option value="2">⭐⭐ Needs service</option>
                </Select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input resize-none h-24"
                  placeholder="Describe your generator's features, what appliances it can power, noise level, any important details renters should know…"
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!canProceed[1]}
              >
                Next: Pricing →
              </Button>
            </>
          )}

          {/* ── Step 2: Pricing ───────────────────────────── */}
          {step === 2 && (
            <>
              <h2 className="font-display font-bold text-xl text-surface-900">Pricing</h2>

              <div className="grid grid-cols-3 gap-4">
                <Input label="Daily Rate (₦) *" type="number" min="0" placeholder="15000" value={form.price_daily} onChange={e => update('price_daily', e.target.value)} />
                <Input label="Weekly Rate (₦)" type="number" min="0" placeholder="90000" value={form.price_weekly} onChange={e => update('price_weekly', e.target.value)} />
                <Input label="Monthly Rate (₦)" type="number" min="0" placeholder="300000" value={form.price_monthly} onChange={e => update('price_monthly', e.target.value)} />
              </div>
              <p className="text-xs text-surface-600 -mt-3">Weekly and monthly rates are optional — they attract longer bookings.</p>

              <Input
                label="Security Deposit (₦)"
                type="number"
                min="0"
                placeholder="e.g. 20000"
                value={form.security_deposit}
                onChange={e => update('security_deposit', e.target.value)}
              />
              <p className="text-xs text-surface-600 -mt-3">Refunded to the renter after the generator is returned in good condition.</p>

              {/* Earnings preview */}
              {form.price_daily && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 animate-fade-in">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-2">Your Earnings Estimate</p>
                  <div className="space-y-1 text-sm text-surface-700">
                    <div className="flex justify-between">
                      <span>Per day (after 15% fee)</span>
                      <span className="font-semibold text-surface-900">₦{Math.round(Number(form.price_daily) * 0.85).toLocaleString()}</span>
                    </div>
                    {form.price_weekly && (
                      <div className="flex justify-between">
                        <span>Per week</span>
                        <span className="font-semibold text-surface-900">₦{Math.round(Number(form.price_weekly) * 0.85).toLocaleString()}</span>
                      </div>
                    )}
                    {form.price_monthly && (
                      <div className="flex justify-between">
                        <span>Per month</span>
                        <span className="font-semibold text-surface-900">₦{Math.round(Number(form.price_monthly) * 0.85).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-300">
                <input
                  type="checkbox"
                  id="instant_book"
                  checked={form.instant_book}
                  onChange={e => update('instant_book', e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <div>
                  <label htmlFor="instant_book" className="text-sm font-medium text-surface-900 cursor-pointer">Enable Instant Booking</label>
                  <p className="text-xs text-surface-600">Renters can book without waiting for your manual approval.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1" disabled={!canProceed[2]}>Next: Location →</Button>
              </div>
            </>
          )}

          {/* ── Step 3: Location & Delivery ───────────────── */}
          {step === 3 && (
            <>
              <h2 className="font-display font-bold text-xl text-surface-900">Location & Delivery</h2>

              <Input
                label="Street Address"
                placeholder="14 Adeola Odeku Street, VI"
                value={form.address}
                onChange={e => update('address', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="City *" placeholder="Lagos" value={form.city} onChange={e => update('city', e.target.value)} />
                <Select label="State *" value={form.state} onChange={e => update('state', e.target.value)}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" type="number" step="any" placeholder="6.5244" value={form.latitude} onChange={e => update('latitude', e.target.value)} />
                <Input label="Longitude" type="number" step="any" placeholder="3.3792" value={form.longitude} onChange={e => update('longitude', e.target.value)} />
              </div>
              <p className="text-xs text-surface-600 -mt-3">
                Find your coordinates at{' '}
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  maps.google.com
                </a>
                {' '}→ right-click your location → copy coordinates.
              </p>

              <Input
                label="Service Radius (km)"
                type="number"
                min="1"
                placeholder="20"
                value={form.service_radius_km}
                onChange={e => update('service_radius_km', e.target.value)}
              />

              <div className="border border-surface-300 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="self_delivery"
                    checked={form.self_delivery}
                    onChange={e => update('self_delivery', e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label htmlFor="self_delivery" className="text-sm font-medium text-surface-900 cursor-pointer">
                    I will deliver the generator myself
                  </label>
                </div>
                {form.self_delivery && (
                  <div className="grid grid-cols-2 gap-4 pt-1 animate-fade-in">
                    <Input label="Base Delivery Fee (₦)" type="number" min="0" placeholder="5000" value={form.delivery_fee_base} onChange={e => update('delivery_fee_base', e.target.value)} />
                    <Input label="Additional Fee per KM (₦)" type="number" min="0" placeholder="200" value={form.delivery_fee_per_km} onChange={e => update('delivery_fee_per_km', e.target.value)} />
                  </div>
                )}
                {!form.self_delivery && (
                  <p className="text-xs text-surface-600">A GenRent driver will be assigned to handle delivery.</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                <Button onClick={handleNext} loading={submitting} className="flex-1" disabled={!canProceed[3]}>
                  Next: Add Photos →
                </Button>
              </div>
            </>
          )}

          {/* ── Step 4: Photos & Publish ──────────────────── */}
          {step === 4 && (
            <>
              <h2 className="font-display font-bold text-xl text-surface-900">Add Photos</h2>
              <p className="text-surface-600 text-sm -mt-2">
                Good photos get <strong className="text-surface-800">3× more bookings.</strong> Add at least 3 photos from different angles.
              </p>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-200 group">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-brand-400 font-semibold text-center py-1">
                        Main photo
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className={clsx(
                    'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all',
                    photos.length === 0
                      ? 'border-brand-500/50 bg-brand-500/5 hover:bg-brand-500/10'
                      : 'border-surface-400 hover:border-brand-500 hover:bg-brand-500/5'
                  )}
                >
                  <Upload size={20} className={photos.length === 0 ? 'text-brand-500' : 'text-surface-600'} />
                  <span className="text-xs text-surface-600 text-center px-2">
                    {photos.length === 0 ? 'Add photos' : 'Add more'}
                  </span>
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {photos.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <ImageIcon size={36} className="text-surface-500" />
                  <p className="text-surface-600 text-sm">No photos added yet.<br />Click the box above to select photos from your device.</p>
                </div>
              )}

              {photos.length > 0 && (
                <p className="text-xs text-surface-600">
                  {photos.length} photo{photos.length > 1 ? 's' : ''} selected.
                  {photos.length < 3 && <span className="text-brand-400"> Add {3 - photos.length} more for best results.</span>}
                </p>
              )}

              {/* Publish / Draft buttons */}
              <div className="space-y-3 pt-2 border-t border-surface-300">
                <Button
                  onClick={handlePublish}
                  loading={uploading}
                  disabled={photos.length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Zap size={16} />
                  {uploading ? 'Uploading & Publishing…' : 'Publish Listing Now'}
                </Button>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting || uploading}
                  className="w-full text-sm text-surface-600 hover:text-surface-800 py-2 transition-colors"
                >
                  Skip photos — save as draft (won't be visible to renters)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
