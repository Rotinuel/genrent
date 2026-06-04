import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'genrent-dev-secret-change-in-production'
)

const COOKIE_NAME = 'genrent_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
}

// ─── Sign JWT ──────────────────────────────────────────────────
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

// ─── Verify JWT (used by both proxy.js and API routes) ────────
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

// ─── Get current user from Next.js cookie store ───────────────
// Use this inside Server Components and API Routes only.
// proxy.js reads the cookie itself from raw request headers.
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await verifyToken(token)
  } catch {
    return null
  }
}

// ─── Set auth cookie (API routes) ─────────────────────────────
export async function setAuthCookie(payload) {
  const token = await signToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return token
}

// ─── Clear auth cookie ─────────────────────────────────────────
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

// ─── Require auth (for API route handlers) ────────────────────
export async function requireAuth(allowedRoles = []) {
  const user = await getCurrentUser()
  if (!user) {
    const error = new Error('Unauthorized')
    error.status = 401
    throw error
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const error = new Error('Forbidden')
    error.status = 403
    throw error
  }
  return user
}
