"use client"
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Zap, Search, Shield, Star, ArrowRight, CheckCircle, MapPin, Clock, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-0 overflow-x-hidden">
      {/* ─── Shared Navbar (auth-aware) ───────────────────── */}
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-100" />
        {/* Orange glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
            Nigeria's #1 Generator Rental Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-surface-900 leading-[1.0] mb-6 animate-fade-up" style={{ '--delay': '0.1s' }}>
            Power When You<br />
            <span className="text-brand-500">Need It Most</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-700 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ '--delay': '0.2s' }}>
            Rent generators from trusted owners near you. List yours and earn.
            Fast delivery. Flexible pricing. Fully insured.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto animate-fade-up" style={{ '--delay': '0.3s' }}>
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600" />
              <input
                type="text"
                placeholder="Enter your city…"
                className="input pl-10 h-12"
                readOnly
                onClick={() => window.location.href = '/listings'}
              />
            </div>
            <Link href="/listings" className="btn-primary h-12 px-8 text-base whitespace-nowrap">
              Find Generator
              <ArrowRight size={16} />
            </Link>
          </div>

          <p className="text-surface-600 text-sm mt-4 animate-fade-up" style={{ '--delay': '0.4s' }}>
            Available in Lagos, Abuja, Port Harcourt &amp; 30+ cities
          </p>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {[
            { label: 'Generators Listed', value: '2,400+' },
            { label: 'Cities Covered', value: '34' },
            { label: 'Happy Renters', value: '18K+' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-extrabold text-3xl md:text-4xl text-brand-500">{stat.value}</div>
              <div className="text-surface-600 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-2 font-display">How It Works</p>
            <h2 className="text-4xl font-display font-bold text-surface-900">Power in 3 Steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: '01', title: 'Find', desc: 'Search generators by location, KVA, and availability. Filter by fuel type and price.' },
              { icon: Shield, step: '02', title: 'Book & Pay', desc: 'Select your dates. Pay securely with Paystack. Get instant confirmation.' },
              { icon: Zap, step: '03', title: 'Power On', desc: 'Generator delivered and installed by a certified technician. Start immediately.' },
            ].map((item, i) => (
              <div key={i} className="relative card group hover:border-brand-500/40 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <item.icon size={20} className="text-brand-500" />
                  </div>
                  <span className="font-display font-extrabold text-4xl text-surface-300 group-hover:text-brand-500/30 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-surface-900 mb-2">{item.title}</h3>
                <p className="text-surface-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Owners ───────────────────────────────────── */}
      <section className="px-6 py-20 bg-surface-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3 font-display">For Owners</p>
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
              Your Generator,<br />Your Income
            </h2>
            <p className="text-surface-600 mb-8 leading-relaxed">
              Turn idle power into steady cash. List in minutes,
              set your own price, choose your renters. GenRent
              handles payments, scheduling, and logistics.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Keep 85% of every booking',
                'Flexible availability calendar',
                'Secure payments, fast payouts',
                'Insurance protection included',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-surface-800">
                  <CheckCircle size={16} className="text-brand-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=owner" className="btn-primary">
              Start Earning <ArrowRight size={16} />
            </Link>
          </div>

          <div className="card bg-surface-200 border-surface-300">
            <p className="text-surface-600 text-sm mb-1">Monthly Earnings Estimate</p>
            <p className="font-display font-extrabold text-5xl text-brand-500 mb-6">₦480K</p>
            <div className="space-y-3">
              {[
                { label: '7.5 KVA Generator', rate: '₦18,000/day', days: 'x 26 days' },
                { label: 'Platform fee (15%)', rate: '-₦70,200', days: '' },
                { label: 'Net Payout', rate: '₦397,800', days: '/month', highlight: true },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-2 border-b border-surface-300 last:border-0 ${row.highlight ? 'text-brand-500 font-semibold' : 'text-surface-700'}`}>
                  <span className="text-sm">{row.label}</span>
                  <span className="text-sm font-mono">{row.rate} <span className="text-surface-600">{row.days}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Drivers ──────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3 font-display">For Drivers</p>
          <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
            Deliver. Earn. Repeat.
          </h2>
          <p className="text-surface-600 max-w-xl mx-auto mb-10">
            Join our logistics network. Accept delivery jobs near you,
            earn per trip, and build a steady income on your schedule.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
            {[
              { icon: Clock, title: 'Flexible Hours', desc: 'Work when you want. Accept or reject jobs freely.' },
              { icon: TrendingUp, title: 'Earn More', desc: '₦3,000–₦15,000 per delivery depending on distance.' },
              { icon: Star, title: 'Build Reputation', desc: 'Top-rated drivers get priority job assignments.' },
            ].map((item, i) => (
              <div key={i} className="card text-center">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon size={20} className="text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-surface-900 mb-1">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/auth/register?role=driver" className="btn-primary">
            Apply as Driver <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center card bg-surface-100 border-brand-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-500/5" />
          <div className="relative">
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
              Ready to Power Up?
            </h2>
            <p className="text-surface-600 mb-8">
              Join 18,000+ Nigerians who trust GenRent for their power needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/listings" className="btn-primary text-base px-8 py-3">
                Find a Generator
              </Link>
              <Link href="/auth/register?role=owner" className="btn-secondary text-base px-8 py-3">
                List My Generator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t border-surface-300">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
                <Zap size={13} className="text-black" fill="black" />
              </div>
              <span className="font-display font-bold text-surface-900">GenRent</span>
            </div>
            <p className="text-surface-600 text-sm">Nigeria's generator rental marketplace.</p>
          </div>
          {[
            { title: 'Platform', links: ['Browse Listings', 'How It Works', 'Pricing'] },
            { title: 'Owners', links: ['List Generator', 'Owner Dashboard', 'Payouts'] },
            { title: 'Company', links: ['About', 'Support', 'Terms', 'Privacy'] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-display font-semibold text-surface-900 text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-surface-600 text-sm hover:text-surface-900 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-surface-300 text-center text-surface-600 text-xs">
          © {new Date().getFullYear()} GenRent. Built with ⚡ in Nigeria.
        </div>
      </footer>
    </main>
  )
}
