import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import ListingsClient from './ListingsClient'

export const metadata = {
  title: 'Browse Generators — GenRent',
  description: 'Find and rent generators near you in Nigeria.',
}

export default function ListingsPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <Navbar />
      <div className="pt-16">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <ListingsClient />
        </Suspense>
      </div>
    </div>
  )
}
