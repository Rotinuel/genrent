'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { clsx } from 'clsx'
import {
  Zap, LayoutDashboard, Calendar, Star, Settings, LogOut,
  PlusCircle, List, DollarSign, Truck, Users, ShieldAlert,
  BarChart2, Briefcase, MapPin,
} from 'lucide-react'
import { Avatar } from '@/components/ui'

const NAV = {
  renter: [
    { label: 'Dashboard', href: '/renter/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', href: '/renter/bookings', icon: Calendar },
    { label: 'Browse', href: '/listings', icon: MapPin },
  ],
  owner: [
    { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'My Listings', href: '/owner/listings', icon: List },
    { label: 'Add Generator', href: '/owner/listings/new', icon: PlusCircle },
    { label: 'Bookings', href: '/owner/bookings', icon: Calendar },
    { label: 'Earnings', href: '/owner/earnings', icon: DollarSign },
  ],
  driver: [
    { label: 'Dashboard', href: '/driver/dashboard', icon: LayoutDashboard },
    { label: 'Available Jobs', href: '/driver/jobs', icon: Briefcase },
    { label: 'My Deliveries', href: '/driver/deliveries', icon: Truck },
  ],
  admin: [
    { label: 'Overview', href: '/admin/dashboard', icon: BarChart2 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Listings', href: '/admin/listings', icon: List },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
    { label: 'Payouts', href: '/admin/payouts', icon: DollarSign },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const links = NAV[user?.role] || []

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-surface-100 border-r border-surface-300 flex flex-col z-30">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-300 shrink-0">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-black" fill="black" />
        </div>
        <span className="font-display font-bold text-lg text-surface-900">GenRent</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {links.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/listings' && pathname.startsWith(href + '/'))
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-surface-700 hover:bg-surface-200 hover:text-surface-900'
                )}
              >
                <Icon size={16} className={active ? 'text-brand-500' : ''} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-surface-300 mt-4 pt-4 space-y-0.5">
          <Link
            href="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname === '/settings'
                ? 'bg-brand-500/15 text-brand-400'
                : 'text-surface-700 hover:bg-surface-200 hover:text-surface-900'
            )}
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-surface-300">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <Avatar src={user?.avatar_url} name={user?.full_name} size={34} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-surface-600 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-surface-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
