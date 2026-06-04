-- ============================================================
-- GenRent Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ─── USERS ─────────────────────────────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT UNIQUE,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'renter' CHECK (role IN ('renter', 'owner', 'driver', 'admin')),
  password_hash TEXT NOT NULL,
  phone_verified    BOOLEAN DEFAULT FALSE,
  email_verified    BOOLEAN DEFAULT FALSE,
  id_verified       BOOLEAN DEFAULT FALSE,
  id_document_url   TEXT,
  bank_account      JSONB,
  paystack_subaccount_code TEXT,
  otp_code      TEXT,
  otp_expires_at TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GENERATORS ────────────────────────────────────────────
CREATE TABLE public.generators (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  brand             TEXT NOT NULL,
  model             TEXT,
  kva               NUMERIC(6,1) NOT NULL,
  fuel_type         TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'gas', 'hybrid')),
  photos            TEXT[] DEFAULT '{}',
  year_manufactured INT,
  last_serviced_at  DATE,
  condition_rating  INT CHECK (condition_rating BETWEEN 1 AND 5),
  price_daily       NUMERIC(12,2) NOT NULL,
  price_weekly      NUMERIC(12,2),
  price_monthly     NUMERIC(12,2),
  security_deposit  NUMERIC(12,2) NOT NULL DEFAULT 0,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  location          GEOGRAPHY(POINT, 4326),
  address           TEXT,
  city              TEXT,
  state             TEXT,
  service_radius_km INT DEFAULT 20,
  self_delivery     BOOLEAN DEFAULT FALSE,
  delivery_fee_base NUMERIC(12,2) DEFAULT 0,
  delivery_fee_per_km NUMERIC(12,2) DEFAULT 0,
  instant_book      BOOLEAN DEFAULT TRUE,
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'suspended')),
  rating_avg        NUMERIC(3,2) DEFAULT 0,
  rating_count      INT DEFAULT 0,
  view_count        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for geo queries
CREATE INDEX idx_generators_location ON public.generators USING GIST (location);

-- ─── AVAILABILITY ───────────────────────────────────────────
CREATE TABLE public.availability_blocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generator_id  UUID NOT NULL REFERENCES public.generators(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT DEFAULT 'booking' CHECK (reason IN ('booking', 'maintenance', 'manual')),
  booking_id    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_generator ON public.availability_blocks(generator_id);
CREATE INDEX idx_availability_dates ON public.availability_blocks(start_date, end_date);

-- ─── BOOKINGS ───────────────────────────────────────────────
CREATE TABLE public.bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generator_id      UUID NOT NULL REFERENCES public.generators(id),
  renter_id         UUID NOT NULL REFERENCES public.users(id),
  owner_id          UUID NOT NULL REFERENCES public.users(id),
  driver_id         UUID REFERENCES public.users(id),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  days              INT NOT NULL,
  delivery_address  TEXT NOT NULL,
  delivery_lat      NUMERIC(10,7),
  delivery_lng      NUMERIC(10,7),
  subtotal          NUMERIC(12,2) NOT NULL,
  delivery_fee      NUMERIC(12,2) DEFAULT 0,
  platform_fee      NUMERIC(12,2) NOT NULL,
  security_deposit  NUMERIC(12,2) DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL,
  owner_payout      NUMERIC(12,2),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','active','completed','cancelled','disputed')),
  delivery_status   TEXT DEFAULT 'unassigned',
  cancellation_reason TEXT,
  cancelled_by      UUID REFERENCES public.users(id),
  paystack_ref      TEXT,
  payment_status    TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','success','failed','refunded')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_generator ON public.bookings(generator_id);
CREATE INDEX idx_bookings_renter ON public.bookings(renter_id);
CREATE INDEX idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE public.payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  paystack_ref  TEXT UNIQUE NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  type          TEXT CHECK (type IN ('charge', 'refund', 'payout')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVIEWS ────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  reviewer_id   UUID NOT NULL REFERENCES public.users(id),
  reviewee_id   UUID REFERENCES public.users(id),
  generator_id  UUID REFERENCES public.generators(id),
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT,
  type          TEXT CHECK (type IN ('generator', 'owner', 'renter')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id, type)
);

-- ─── DISPUTES ───────────────────────────────────────────────
CREATE TABLE public.disputes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  raised_by     UUID NOT NULL REFERENCES public.users(id),
  reason        TEXT NOT NULL,
  description   TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  resolution    TEXT,
  resolved_by   UUID REFERENCES public.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVER JOBS ────────────────────────────────────────────
CREATE TABLE public.driver_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  driver_id     UUID REFERENCES public.users(id),
  status        TEXT DEFAULT 'unassigned' CHECK (status IN ('unassigned','assigned','accepted','en_route_pickup','picked_up','en_route_delivery','delivered','en_route_return','returned','cancelled')),
  pickup_address TEXT,
  delivery_address TEXT,
  pickup_lat    NUMERIC(10,7),
  pickup_lng    NUMERIC(10,7),
  delivery_lat  NUMERIC(10,7),
  delivery_lng  NUMERIC(10,7),
  driver_lat    NUMERIC(10,7),
  driver_lng    NUMERIC(10,7),
  fee           NUMERIC(12,2),
  accepted_at   TIMESTAMPTZ,
  picked_up_at  TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  returned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  type          TEXT,
  link          TEXT,
  read          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- ─── RLS POLICIES ───────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_jobs ENABLE ROW LEVEL SECURITY;

-- Users: can read own row
CREATE POLICY "users_own_row" ON public.users FOR ALL USING (id::text = current_setting('app.current_user_id', TRUE));
-- Public profiles
CREATE POLICY "users_public_read" ON public.users FOR SELECT USING (TRUE);

-- Generators: owners manage theirs, public can read active
CREATE POLICY "generators_owner_all" ON public.generators FOR ALL USING (owner_id::text = current_setting('app.current_user_id', TRUE));
CREATE POLICY "generators_public_read" ON public.generators FOR SELECT USING (status = 'active');

-- Bookings: involved parties can read
CREATE POLICY "bookings_involved_read" ON public.bookings FOR SELECT USING (
  renter_id::text = current_setting('app.current_user_id', TRUE) OR
  owner_id::text = current_setting('app.current_user_id', TRUE) OR
  driver_id::text = current_setting('app.current_user_id', TRUE)
);
CREATE POLICY "bookings_renter_insert" ON public.bookings FOR INSERT WITH CHECK (
  renter_id::text = current_setting('app.current_user_id', TRUE)
);

-- Notifications: own only
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (
  user_id::text = current_setting('app.current_user_id', TRUE)
);

-- Reviews: public read, reviewer writes
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_reviewer_insert" ON public.reviews FOR INSERT WITH CHECK (
  reviewer_id::text = current_setting('app.current_user_id', TRUE)
);

-- ─── TRIGGERS ───────────────────────────────────────────────

-- Auto-update location geography from lat/lng
CREATE OR REPLACE FUNCTION sync_generator_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generator_location
  BEFORE INSERT OR UPDATE ON public.generators
  FOR EACH ROW EXECUTE FUNCTION sync_generator_location();

-- Auto-update ratings on generators after review insert
CREATE OR REPLACE FUNCTION update_generator_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.generators
  SET
    rating_avg = (SELECT AVG(rating) FROM public.reviews WHERE generator_id = NEW.generator_id AND type = 'generator'),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE generator_id = NEW.generator_id AND type = 'generator')
  WHERE id = NEW.generator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
  AFTER INSERT ON public.reviews
  FOR EACH ROW WHEN (NEW.type = 'generator')
  EXECUTE FUNCTION update_generator_rating();

-- ─── VIEWS ──────────────────────────────────────────────────

-- Active listings with owner info
CREATE OR REPLACE VIEW public.v_listings AS
SELECT
  g.*,
  u.full_name AS owner_name,
  u.avatar_url AS owner_avatar,
  u.phone_verified AS owner_verified
FROM public.generators g
JOIN public.users u ON g.owner_id = u.id
WHERE g.status = 'active';

-- Booking details with all parties
CREATE OR REPLACE VIEW public.v_bookings AS
SELECT
  b.*,
  g.title AS generator_title,
  g.kva AS generator_kva,
  g.brand AS generator_brand,
  g.photos AS generator_photos,
  r.full_name AS renter_name,
  r.phone AS renter_phone,
  o.full_name AS owner_name,
  o.phone AS owner_phone,
  d.full_name AS driver_name,
  d.phone AS driver_phone
FROM public.bookings b
JOIN public.generators g ON b.generator_id = g.id
JOIN public.users r ON b.renter_id = r.id
JOIN public.users o ON b.owner_id = o.id
LEFT JOIN public.users d ON b.driver_id = d.id;
