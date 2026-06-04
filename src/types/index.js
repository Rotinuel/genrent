// ─── User ────────────────────────────────────────────────────────────────────

export const USER_ROLES = ['renter', 'owner', 'driver', 'admin']

export const BOOKING_STATUS = [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'disputed',
]

export const PAYMENT_STATUS = ['pending', 'success', 'failed', 'refunded']

export const LISTING_STATUS = ['draft', 'active', 'paused', 'suspended']

export const FUEL_TYPES = ['petrol', 'diesel', 'gas', 'hybrid']

export const DELIVERY_STATUS = [
  'unassigned',
  'assigned',
  'en_route_pickup',
  'picked_up',
  'en_route_delivery',
  'delivered',
  'en_route_return',
  'returned',
]

// ─── JSDoc type definitions (used as comments for IDE hints) ─────────────────

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} phone
 * @property {string} full_name
 * @property {string} avatar_url
 * @property {'renter'|'owner'|'driver'|'admin'} role
 * @property {boolean} phone_verified
 * @property {boolean} email_verified
 * @property {boolean} id_verified
 * @property {string} created_at
 */

/**
 * @typedef {Object} Generator
 * @property {string} id
 * @property {string} owner_id
 * @property {string} title
 * @property {string} description
 * @property {string} brand
 * @property {number} kva
 * @property {'petrol'|'diesel'|'gas'|'hybrid'} fuel_type
 * @property {string[]} photos
 * @property {number} price_daily
 * @property {number} price_weekly
 * @property {number} price_monthly
 * @property {number} security_deposit
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {number} service_radius_km
 * @property {boolean} self_delivery
 * @property {'draft'|'active'|'paused'|'suspended'} status
 * @property {number} rating_avg
 * @property {number} rating_count
 * @property {string} created_at
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} generator_id
 * @property {string} renter_id
 * @property {string|null} driver_id
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} delivery_address
 * @property {number} delivery_lat
 * @property {number} delivery_lng
 * @property {number} days
 * @property {number} subtotal
 * @property {number} delivery_fee
 * @property {number} platform_fee
 * @property {number} security_deposit
 * @property {number} total_amount
 * @property {'pending'|'confirmed'|'active'|'completed'|'cancelled'|'disputed'} status
 * @property {string} paystack_ref
 * @property {string} created_at
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} booking_id
 * @property {string} user_id
 * @property {string} paystack_ref
 * @property {number} amount
 * @property {'charge'|'refund'|'payout'} type
 * @property {'pending'|'success'|'failed'|'refunded'} status
 * @property {Object} metadata
 * @property {string} created_at
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} booking_id
 * @property {string} reviewer_id
 * @property {string} reviewee_id
 * @property {string} generator_id
 * @property {number} rating
 * @property {string} body
 * @property {string} created_at
 */

/**
 * @typedef {Object} Dispute
 * @property {string} id
 * @property {string} booking_id
 * @property {string} raised_by
 * @property {string} reason
 * @property {string} description
 * @property {'open'|'investigating'|'resolved'|'closed'} status
 * @property {string} resolution
 * @property {string} created_at
 */
