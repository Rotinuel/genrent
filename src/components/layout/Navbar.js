'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Zap, Bell, Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { clsx } from 'clsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const dashboardLink = {
    renter: '/renter/dashboard',
    owner: '/owner/dashboard',
    driver: '/driver/dashboard',
    admin: '/admin/dashboard',
  }[user?.role] || '/'

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-surface-0/90 backdrop-blur-lg border-b border-surface-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-black" fill="black" />
          </div>
          <span className="font-display font-bold text-lg text-surface-900">GenRent</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/listings" className={clsx('text-surface-700 hover:text-surface-900 transition-colors', pathname === '/listings' && 'text-brand-500')}>
            Browse
          </Link>
          {!user && (
            <>
              <Link href="/auth/register?role=owner" className="text-surface-700 hover:text-surface-900 transition-colors">
                List Generator
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications */}
              <NotificationBell userId={user.id} />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-200 transition-colors"
                >
                  <Avatar src={user.avatar_url} name={user.full_name} size={30} />
                  <span className="hidden md:block text-sm text-surface-800 font-medium max-w-[120px] truncate">
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-surface-600" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 card shadow-card-hover z-20 py-1">
                      <div className="px-3 py-2 border-b border-surface-300 mb-1">
                        <p className="text-sm font-semibold text-surface-900">{user.full_name}</p>
                        <p className="text-xs text-surface-600 capitalize">{user.role}</p>
                      </div>
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-200 hover:text-surface-900 transition-colors rounded-lg mx-1">
                        <LayoutDashboard size={14} />
                        Dashboard
                      </Link>
                      <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-200 hover:text-surface-900 transition-colors rounded-lg mx-1">
                        <Settings size={14} />
                        Settings
                      </Link>
                      <div className="border-t border-surface-300 mt-1 pt-1">
                        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full rounded-lg mx-1">
                          <LogOut size={14} />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm hidden md:flex">Log in</Link>
              <Link href="/auth/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2 md:hidden">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-300 bg-surface-0 px-4 py-4 space-y-2">
          <Link href="/listings" onClick={() => setMenuOpen(false)} className="block py-2 text-surface-700">Browse Listings</Link>
          {user ? (
            <>
              <Link href={dashboardLink} onClick={() => setMenuOpen(false)} className="block py-2 text-surface-700">Dashboard</Link>
              <button onClick={() => { logout(); setMenuOpen(false) }} className="block py-2 text-red-400 w-full text-left">Log out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block py-2 text-surface-700">Log in</Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary block text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

// ─── Notification Bell ────────────────────────────────────────
function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const unread = notifications.filter(n => !n.read).length

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {}
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative btn-ghost p-2 rounded-xl"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-[9px] text-black font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 card shadow-card-hover z-20 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-surface-300">
              <span className="font-display font-semibold text-sm text-surface-900">Notifications</span>
              {unread > 0 && <span className="badge-orange">{unread} new</span>}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-surface-600 text-sm">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={clsx('px-3 py-3 border-b border-surface-300 last:border-0 text-sm', !n.read && 'bg-brand-500/5')}>
                  <p className="font-medium text-surface-900">{n.title}</p>
                  <p className="text-surface-600 text-xs mt-0.5">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
