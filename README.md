# ⚡ GenRent — Generator Marketplace

Nigeria's Airbnb/Uber for generators. Rent generators near you. List yours. Earn money.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.1 (App Router, Turbopack) |
| Styling | Tailwind CSS (custom dark design system) |
| Database | Supabase (PostgreSQL + PostGIS + RLS) |
| Auth | Custom JWT via httpOnly cookies |
| Payments | Paystack (charges, splits, transfers) |
| SMS | Termii (OTP verification) |
| Email | SendGrid |
| Storage | Supabase Storage (generator photos) |
| Maps | Google Maps API |
| Edge Functions | Supabase Functions (scheduled jobs) |

---

## Project Structure

```
genrent/
├── src/
│   ├── app/
│   │   ├── page.js                     # Public homepage
│   │   ├── layout.js                   # Root layout + AuthProvider
│   │   ├── globals.css                 # Design system + global styles
│   │   ├── not-found.js
│   │   ├── error.js
│   │   ├── loading.js
│   │   ├── listings/                   # Browse generators
│   │   ├── listing/[id]/               # Generator detail + booking
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── renter/
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   └── booking/[id]/
│   │   ├── owner/
│   │   │   ├── dashboard/
│   │   │   ├── listings/
│   │   │   ├── listings/new/
│   │   │   ├── listings/[id]/
│   │   │   ├── bookings/
│   │   │   └── earnings/
│   │   ├── driver/
│   │   │   ├── dashboard/
│   │   │   └── jobs/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── listings/
│   │   │   └── payouts/
│   │   ├── settings/
│   │   └── api/
│   │       ├── auth/          (login, register, me, logout, otp/)
│   │       ├── listings/      (CRUD, mine, photos)
│   │       ├── bookings/      (CRUD, reviews)
│   │       ├── payments/      (verify, banks)
│   │       ├── drivers/       (jobs, status)
│   │       ├── notifications/
│   │       ├── owner/bank/
│   │       ├── user/profile/
│   │       ├── admin/         (stats, users, listings, payouts)
│   │       └── webhooks/paystack/
│   ├── components/
│   │   ├── ui/                # Button, Input, Modal, Badge, Stars…
│   │   ├── layout/            # Navbar, Sidebar, DashboardLayout
│   │   ├── listings/          # ListingCard, SearchFilters
│   │   └── bookings/          # BookingForm, BookingCard
│   ├── context/
│   │   └── AuthContext.js
│   ├── lib/
│   │   ├── supabase.js        # Browser + server + admin clients
│   │   ├── auth.js            # JWT sign/verify, cookie helpers
│   │   ├── paystack.js        # Payments, transfers, subaccounts
│   │   ├── notifications.js   # Email + SMS helpers + templates
│   │   └── geo.js             # Haversine distance, geocoding
│   ├── types/
│   │   └── index.js           # JSDoc typedefs
│   └── middleware.js          # Route protection
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── scheduled-payouts/     # Auto-payout cron job
│       └── booking-reminders/     # Daily email reminders
├── .env.local                 # Environment variables (fill in)
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo>
cd genrent
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → create a bucket named `genrent-media` (set to public)
4. Copy your project URL and keys

### 3. Environment Variables

Copy `.env.local` and fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT (generate a random 32+ char string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Paystack (from dashboard.paystack.com)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# SendGrid (from app.sendgrid.com)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=GenRent

# Termii (from termii.com)
TERMII_API_KEY=your_key
TERMII_SENDER_ID=GenRent

# Google Maps (from console.cloud.google.com)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_FEE_PERCENT=15
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Roles

| Role | Access | Default Redirect |
|------|--------|-----------------|
| `renter` | Browse & book generators | `/renter/dashboard` |
| `owner` | List generators, manage bookings, earnings | `/owner/dashboard` |
| `driver` | Accept & manage deliveries | `/driver/dashboard` |
| `admin` | Full platform access | `/admin/dashboard` |

### Create Admin User

After registering a normal account, update the role via Supabase SQL:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Key Flows

### Booking Flow
```
Renter finds generator → selects dates → checkout
→ Paystack payment → webhook confirms → availability blocked
→ Owner notified → driver assigned → delivery
→ Active rental → return → completed → review → payout
```

### Payout Flow
```
Booking completed → admin triggers payout (or auto-cron 48h later)
→ Paystack transfer to owner's bank account
→ Owner notified via SMS + email + in-app
```

### Driver Assignment
```
Booking confirmed → driver_job created (unassigned)
→ Available drivers see job → accept
→ Status: accepted → picked_up → delivered → returned
```

---

## Paystack Integration Notes

- **Payments**: `POST /api/bookings` initializes a Paystack transaction, returns `payment_url` to redirect
- **Verification**: `/api/payments/verify` handles Paystack redirect callback
- **Webhooks**: `/api/webhooks/paystack` handles async events (charge, transfer, refund)
- **Payouts**: Requires owner to add bank account first (creates Paystack transfer recipient)
- **Webhook Secret**: Add your Paystack secret key to verify webhook signatures

### Register Webhook in Paystack Dashboard
```
URL: https://yourdomain.com/api/webhooks/paystack
Events: charge.success, transfer.success, transfer.failed, refund.processed
```

---

## Supabase Edge Functions (Cron Jobs)

Deploy the scheduled functions:

```bash
supabase functions deploy scheduled-payouts
supabase functions deploy booking-reminders
```

Schedule via Supabase Dashboard → Database → Scheduled Jobs:
- `scheduled-payouts`: `0 9 * * *` (daily at 9 AM)  
- `booking-reminders`: `0 8 * * *` (daily at 8 AM)

---

## PostGIS Geo Search

The schema uses PostGIS for efficient radius-based search. The `location` column on `generators` is automatically populated from `latitude`/`longitude` via a trigger.

To search within 50km of Lagos:
```sql
SELECT * FROM generators
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)::geography,
  50000  -- meters
)
AND status = 'active';
```

---

## Deployment (Vercel)

```bash
npm run build   # verify build passes
vercel          # deploy
```

Set all env vars in Vercel dashboard. Set `NEXT_PUBLIC_APP_URL` to your production URL.

---

## License

MIT — Built with ⚡ in Nigeria.
# genrent
