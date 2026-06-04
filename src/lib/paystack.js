import axios from 'axios'

const PAYSTACK_BASE = 'https://api.paystack.co'
const SECRET = process.env.PAYSTACK_SECRET_KEY

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${SECRET}`,
    'Content-Type': 'application/json',
  },
})

// ─── Initialize transaction ───────────────────────────────────
export async function initializePayment({ email, amount, reference, metadata, callback_url }) {
  const { data } = await paystackApi.post('/transaction/initialize', {
    email,
    amount: Math.round(amount * 100), // kobo
    reference,
    metadata,
    callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
  })
  return data.data
}

// ─── Verify transaction ───────────────────────────────────────
export async function verifyPayment(reference) {
  const { data } = await paystackApi.get(`/transaction/verify/${reference}`)
  return data.data
}

// ─── Create subaccount (for owners) ──────────────────────────
export async function createSubaccount({ business_name, bank_code, account_number, percentage_charge }) {
  const { data } = await paystackApi.post('/subaccount', {
    business_name,
    bank_code,
    account_number,
    percentage_charge: percentage_charge || (100 - Number(process.env.PLATFORM_FEE_PERCENT || 15)),
    settlement_bank: bank_code,
  })
  return data.data
}

// ─── Transfer to owner ────────────────────────────────────────
export async function transferToOwner({ amount, recipient_code, reason, reference }) {
  // First create a transfer recipient if not exists
  const { data } = await paystackApi.post('/transfer', {
    source: 'balance',
    amount: Math.round(amount * 100),
    recipient: recipient_code,
    reason,
    reference,
  })
  return data.data
}

// ─── Create transfer recipient ────────────────────────────────
export async function createTransferRecipient({ name, account_number, bank_code }) {
  const { data } = await paystackApi.post('/transferrecipient', {
    type: 'nuban',
    name,
    account_number,
    bank_code,
    currency: 'NGN',
  })
  return data.data
}

// ─── Refund ───────────────────────────────────────────────────
export async function refundPayment({ transaction_id, amount }) {
  const { data } = await paystackApi.post('/refund', {
    transaction: transaction_id,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
  return data.data
}

// ─── List banks ───────────────────────────────────────────────
export async function listBanks() {
  const { data } = await paystackApi.get('/bank?currency=NGN&perPage=100')
  return data.data
}

// ─── Verify account number ────────────────────────────────────
export async function verifyAccountNumber({ account_number, bank_code }) {
  const { data } = await paystackApi.get(
    `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
  )
  return data.data
}

// ─── Calculate fees ──────────────────────────────────────────
export function calculateFees({ subtotal, delivery_fee = 0, security_deposit = 0 }) {
  const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15)
  const platform_fee = Math.round((subtotal * platformFeePercent) / 100 * 100) / 100
  const total = subtotal + delivery_fee + platform_fee + security_deposit
  const owner_payout = subtotal - platform_fee

  return {
    subtotal,
    delivery_fee,
    platform_fee,
    security_deposit,
    total,
    owner_payout,
    platform_fee_percent: platformFeePercent,
  }
}

// ─── Generate unique reference ────────────────────────────────
export function generateReference(prefix = 'GR') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}
