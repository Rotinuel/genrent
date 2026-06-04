import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Zap size={36} className="text-brand-500" />
        </div>
        <h1 className="font-display font-extrabold text-7xl text-surface-300 mb-2">404</h1>
        <h2 className="font-display font-bold text-2xl text-surface-900 mb-3">Page Not Found</h2>
        <p className="text-surface-600 mb-8">
          This page doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/listings" className="btn-secondary">Browse Generators</Link>
        </div>
      </div>
    </div>
  )
}
