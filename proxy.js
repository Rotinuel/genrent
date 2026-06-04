import { verifyToken } from './src/lib/auth.js'
import { cookies } from 'next/headers'

// Routes that require auth, mapped to allowed roles
const PROTECTED_ROUTES = [
  { prefix: '/renter',  roles: ['renter', 'admin'] },
  { prefix: '/owner',   roles: ['owner', 'admin'] },
  { prefix: '/driver',  roles: ['driver', 'admin'] },
  { prefix: '/admin',   roles: ['admin'] },
  { prefix: '/settings', roles: null }, // any authenticated user
]

// Auth pages — redirect away if already logged in
const AUTH_PAGES = ['/auth/login', '/auth/register']

const ROLE_HOME = {
  renter: '/renter/dashboard',
  owner:  '/owner/dashboard',
  driver: '/driver/dashboard',
  admin:  '/admin/dashboard',
}

export async function proxy(request, next) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Read JWT from cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const tokenMatch = cookieHeader.match(/genrent_token=([^;]+)/)
  const token = tokenMatch ? tokenMatch[1] : null

  let user = null
  if (token) {
    user = await verifyToken(token)
  }

  // ── If on auth page and already logged in → redirect to dashboard ──
  if (AUTH_PAGES.some(p => pathname.startsWith(p))) {
    if (user) {
      const dest = ROLE_HOME[user.role] || '/'
      return Response.redirect(new URL(dest, request.url), 302)
    }
    return next(request)
  }

  // ── Check protected routes ─────────────────────────────────────────
  for (const { prefix, roles } of PROTECTED_ROUTES) {
    if (pathname.startsWith(prefix)) {
      // Not logged in → send to login
      if (!user) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return Response.redirect(loginUrl, 302)
      }

      // Wrong role → send to their own dashboard
      if (roles && !roles.includes(user.role)) {
        const dest = ROLE_HOME[user.role] || '/'
        return Response.redirect(new URL(dest, request.url), 302)
      }

      break
    }
  }

  return next(request)
}
