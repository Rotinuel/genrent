import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import BookingForm from '@/components/bookings/BookingForm'
import { Stars, Price, StatusBadge, Avatar } from '@/components/ui'
import { MapPin, Zap, Fuel, Star, Shield, Calendar, CheckCircle, Wrench, Clock } from 'lucide-react'
import { format } from 'date-fns'

async function getListing(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/listings/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.listing
  } catch {
    return null
  }
}

export default async function ListingPage({ params }) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const photos = listing.photos?.filter(Boolean) || []

  return (
    <div className="min-h-screen bg-surface-0">
      <Navbar />
      <div className="pt-16 max-w-6xl mx-auto px-4 py-8">

        {/* Photo gallery */}
        <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden mb-8">
          {photos.length > 0 ? (
            <>
              <div className="col-span-2 row-span-2 relative">
                <Image src={photos[0]} alt={listing.title} fill className="object-cover" />
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="relative bg-surface-200">
                  {photos[i] ? (
                    <Image src={photos[i]} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap size={24} className="text-surface-500" />
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="col-span-3 row-span-2 bg-surface-200 flex flex-col items-center justify-center gap-3">
              <Zap size={48} className="text-brand-500" />
              <p className="text-surface-600">No photos yet</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title + overview */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display font-bold text-3xl text-surface-900">{listing.title}</h1>
                <span className="badge-orange shrink-0">{listing.fuel_type}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-surface-600 text-sm mb-4">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{listing.city}, {listing.state}</span>
                <span className="flex items-center gap-1.5"><Zap size={14} className="text-brand-500" />{listing.kva} KVA</span>
                {listing.rating_count > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Stars rating={Math.round(listing.rating_avg)} size={13} />
                    <span className="font-medium">{Number(listing.rating_avg).toFixed(1)}</span>
                    <span className="text-surface-500">({listing.rating_count} reviews)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Brand', value: listing.brand },
                { label: 'KVA', value: `${listing.kva} KVA` },
                { label: 'Fuel', value: listing.fuel_type },
                { label: 'Condition', value: listing.condition_rating ? `${listing.condition_rating}/5` : 'N/A' },
                listing.year_manufactured && { label: 'Year', value: listing.year_manufactured },
                listing.last_serviced_at && { label: 'Last Serviced', value: format(new Date(listing.last_serviced_at), 'MMM yyyy') },
                { label: 'Instant Book', value: listing.instant_book ? 'Yes' : 'Approval needed' },
                { label: 'Service Radius', value: `${listing.service_radius_km} km` },
              ].filter(Boolean).map((spec, i) => (
                <div key={i} className="card bg-surface-200 py-3">
                  <p className="text-xs text-surface-600 mb-0.5">{spec.label}</p>
                  <p className="font-display font-semibold text-surface-900 text-sm capitalize">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div>
              <h2 className="section-title">Pricing</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="card text-center">
                  <p className="text-xs text-surface-600 mb-1">Daily</p>
                  <Price amount={listing.price_daily} className="font-display font-bold text-xl text-brand-400" />
                </div>
                {listing.price_weekly && (
                  <div className="card text-center">
                    <p className="text-xs text-surface-600 mb-1">Weekly</p>
                    <Price amount={listing.price_weekly} className="font-display font-bold text-xl text-brand-400" />
                    <p className="text-xs text-surface-600 mt-0.5">
                      <Price amount={listing.price_weekly / 7} className="" />/day
                    </p>
                  </div>
                )}
                {listing.price_monthly && (
                  <div className="card text-center">
                    <p className="text-xs text-surface-600 mb-1">Monthly</p>
                    <Price amount={listing.price_monthly} className="font-display font-bold text-xl text-brand-400" />
                    <p className="text-xs text-surface-600 mt-0.5">
                      <Price amount={listing.price_monthly / 30} className="" />/day
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="section-title">About this Generator</h2>
                <p className="text-surface-700 leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Delivery info */}
            <div>
              <h2 className="section-title">Delivery & Logistics</h2>
              <div className="card space-y-3">
                {listing.self_delivery ? (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className="text-green-400 shrink-0" />
                      <span className="text-surface-700">Owner delivers within <strong>{listing.service_radius_km} km</strong></span>
                    </div>
                    {listing.delivery_fee_base > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <Wrench size={16} className="text-surface-600 shrink-0" />
                        <span className="text-surface-700">Base delivery fee: <Price amount={listing.delivery_fee_base} className="font-semibold" /></span>
                      </div>
                    )}
                    {listing.delivery_fee_per_km > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin size={16} className="text-surface-600 shrink-0" />
                        <span className="text-surface-700"><Price amount={listing.delivery_fee_per_km} className="font-semibold" /> per km</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={16} className="text-brand-500 shrink-0" />
                    <span className="text-surface-700">Platform driver assigned for delivery</span>
                  </div>
                )}
                {listing.security_deposit > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={16} className="text-surface-600 shrink-0" />
                    <span className="text-surface-700">Security deposit: <Price amount={listing.security_deposit} className="font-semibold" /> (refunded on return)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Owner */}
            {listing.owner && (
              <div>
                <h2 className="section-title">About the Owner</h2>
                <div className="card flex items-start gap-4">
                  <Avatar src={listing.owner.avatar_url} name={listing.owner.full_name} size={48} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display font-bold text-surface-900">{listing.owner.full_name}</p>
                      {listing.owner.phone_verified && (
                        <span className="badge-green text-xs">Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-surface-600">
                      Member since {format(new Date(listing.owner.created_at), 'MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {listing.reviews?.length > 0 && (
              <div>
                <h2 className="section-title">Reviews ({listing.reviews.length})</h2>
                <div className="space-y-4">
                  {listing.reviews.slice(0, 5).map(review => (
                    <div key={review.id} className="card">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={review.reviewer?.avatar_url} name={review.reviewer?.full_name} size={32} />
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{review.reviewer?.full_name}</p>
                          <Stars rating={review.rating} size={12} />
                        </div>
                      </div>
                      {review.body && <p className="text-sm text-surface-700">{review.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking form */}
          <div>
            <BookingForm listing={listing} />
          </div>
        </div>
      </div>
    </div>
  )
}
