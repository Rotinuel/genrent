'use client'

import { useEffect, useState, use } from 'react'
import { useRequireAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button, Spinner, StatusBadge, Price } from '@/components/ui'
import { Upload, Trash2, Eye, Zap, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function OwnerListingPage({ params }) {
  const { id } = use(params)
  const { user } = useRequireAuth('owner')
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(data => {
        setListing(data.listing)
        setForm(data.listing || {})
      })
      .finally(() => setLoading(false))
  }, [id])

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListing(data.listing)
      toast.success('Listing updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('photos', f))
      const res = await fetch(`/api/listings/${id}/photos`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListing(prev => ({ ...prev, photos: data.photos }))
      setForm(prev => ({ ...prev, photos: data.photos }))
      toast.success(`${files.length} photo(s) uploaded!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (url) => {
    const photos = (form.photos || []).filter(p => p !== url)
    setForm(prev => ({ ...prev, photos }))
    await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos }),
    })
  }

  const toggleStatus = async () => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListing(data.listing)
      setForm(data.listing)
      toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'paused'}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!user) return null
  if (loading) return <DashboardLayout><div className="flex justify-center py-16"><Spinner /></div></DashboardLayout>
  if (!listing) return <DashboardLayout><p className="text-surface-600">Listing not found.</p></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/owner/listings" className="text-sm text-surface-600 hover:text-brand-400 mb-2 block">← My Listings</Link>
            <h1 className="page-title">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={listing.status} />
            <Link href={`/listing/${id}`} target="_blank" className="btn-ghost p-2"><Eye size={16} /></Link>
          </div>
        </div>

        {/* Status toggle */}
        <div className="card mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-surface-900 text-sm">
              {listing.status === 'active' ? '✅ Listing is Live' : listing.status === 'draft' ? '📝 Draft — Add photos to activate' : '⏸ Listing is Paused'}
            </p>
            <p className="text-xs text-surface-600">
              {listing.view_count || 0} views · {listing.rating_count || 0} reviews
            </p>
          </div>
          <Button
            variant={listing.status === 'active' ? 'secondary' : 'primary'}
            onClick={toggleStatus}
            disabled={listing.status === 'draft' || listing.status === 'suspended'}
            size="sm"
          >
            {listing.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </div>

        {/* Photos */}
        <div className="card mb-6">
          <h2 className="font-display font-bold text-lg text-surface-900 mb-4">Photos</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(form.photos || []).map((url, i) => (
              <div key={url} className="relative group rounded-xl overflow-hidden aspect-square bg-surface-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/70 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <Trash2 size={12} />
                </button>
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 text-xs bg-brand-500 text-black px-1.5 py-0.5 rounded font-semibold">Main</span>}
              </div>
            ))}

            {/* Upload button */}
            <label className="aspect-square border-2 border-dashed border-surface-400 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-all">
              {uploading ? <Spinner size={24} /> : (
                <>
                  <Upload size={20} className="text-surface-600" />
                  <span className="text-xs text-surface-600">Add photos</span>
                </>
              )}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-surface-600">First photo is the main listing image. Min 3 photos recommended to get more bookings.</p>
        </div>

        {/* Edit form */}
        <div className="card space-y-5">
          <h2 className="font-display font-bold text-lg text-surface-900">Edit Details</h2>

          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title || ''} onChange={e => update('title', e.target.value)} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input h-24 resize-none" value={form.description || ''} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Rate (₦)</label>
              <input type="number" className="input" value={form.price_daily || ''} onChange={e => update('price_daily', e.target.value)} />
            </div>
            <div>
              <label className="label">Security Deposit (₦)</label>
              <input type="number" className="input" value={form.security_deposit || ''} onChange={e => update('security_deposit', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city || ''} onChange={e => update('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Service Radius (km)</label>
              <input type="number" className="input" value={form.service_radius_km || ''} onChange={e => update('service_radius_km', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="ib" checked={!!form.instant_book} onChange={e => update('instant_book', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            <label htmlFor="ib" className="text-sm text-surface-800 cursor-pointer">Enable Instant Booking</label>
          </div>

          <Button onClick={handleSave} loading={saving} className="w-full">
            <CheckCircle size={16} />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
