// ─── Haversine distance (km) ──────────────────────────────────
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

// ─── Calculate delivery fee ───────────────────────────────────
export function calculateDeliveryFee(generator, deliveryLat, deliveryLng) {
  if (!generator.self_delivery) return 0
  const dist = getDistance(
    generator.latitude, generator.longitude,
    deliveryLat, deliveryLng
  )
  const fee = generator.delivery_fee_base + (dist * generator.delivery_fee_per_km)
  return Math.round(fee * 100) / 100
}

// ─── Geocode address via Google Maps ─────────────────────────
export async function geocodeAddress(address) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return null
  
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.status === 'OK' && data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng, formatted: data.results[0].formatted_address }
  }
  return null
}

// ─── Nigerian states list ─────────────────────────────────────
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]
