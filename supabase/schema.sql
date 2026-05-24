create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  email text,
  role text default 'customer' check (role in ('customer', 'manager', 'admin')),
  wallet_balance numeric not null default 0,
  favorites text[] not null default '{}',
  active_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bikes (
  id text primary key,
  name text not null,
  category text not null,
  lat double precision not null,
  lng double precision not null,
  battery integer not null default 0,
  status text not null default 'available',
  location text not null,
  image text not null,
  price_per_minute numeric not null,
  day_pass_price numeric not null,
  terrain text[] not null default '{}',
  range_km integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  reviews jsonb not null default '[]'::jsonb,
  featured boolean default false,
  retro boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  bike_id text not null,
  bike_name text not null,
  start text not null,
  "end" text not null,
  date text not null,
  duration_min integer not null,
  amount numeric not null,
  status text not null,
  pickup_point text not null,
  drop_point text not null,
  ride_mode text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  label text not null,
  amount numeric not null,
  method text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  title text not null,
  description text not null,
  discount_type text not null,
  value numeric not null,
  min_spend numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  name text not null,
  monthly_price numeric not null,
  perks text[] not null default '{}',
  recommended boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  time text not null,
  type text not null,
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bikes enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "bikes_read_all" on public.bikes;
create policy "bikes_read_all"
on public.bikes for select
to anon, authenticated
using (true);

drop policy if exists "bikes_write_authenticated" on public.bikes;
create policy "bikes_write_authenticated"
on public.bikes for all
to authenticated
using (true)
with check (true);

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
on public.bookings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
on public.bookings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own"
on public.bookings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
on public.payments for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
on public.payments for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "coupons_read_all" on public.coupons;
create policy "coupons_read_all"
on public.coupons for select
to anon, authenticated
using (true);

drop policy if exists "subscriptions_read_all" on public.subscriptions;
create policy "subscriptions_read_all"
on public.subscriptions for select
to anon, authenticated
using (true);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
on public.notifications for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into public.subscriptions (id, name, monthly_price, perks, recommended)
values
  ('plan-lite', 'Lite', 499, array['5 free unlocks', 'Basic support', '1 rain protection coupon'], false),
  ('plan-plus', 'Plus', 999, array['Unlimited unlocks', 'Priority support', 'Free weekend reschedule', '10% lower peak pricing'], true),
  ('plan-pro', 'Pro Explorer', 1599, array['Mountain bike priority', 'Manager hotline', 'Monthly guided route plan'], false)
on conflict (id) do update set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  perks = excluded.perks,
  recommended = excluded.recommended;

insert into public.coupons (id, code, title, description, discount_type, value, min_spend, active)
values
  ('C-501', 'WEEKEND20', 'Weekend Adventure', '20% off on mountain and sports bikes.', 'percent', 20, 500, true),
  ('C-502', 'CITY100', 'City Sprint', 'Flat Rs.100 off on any daily booking above Rs.700.', 'flat', 100, 700, true)
on conflict (id) do update set
  code = excluded.code,
  title = excluded.title,
  description = excluded.description,
  discount_type = excluded.discount_type,
  value = excluded.value,
  min_spend = excluded.min_spend,
  active = excluded.active;

insert into public.bikes (
  id, name, category, lat, lng, battery, status, location, image,
  price_per_minute, day_pass_price, terrain, range_km, rating, review_count, reviews, featured, retro
)
values
  (
    'B-201', 'TrailBlazer X1', 'mountain', 16.6946, 74.223, 88, 'available', 'Mahalaxmi Temple Hub',
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
    3.2, 940, array['mountain', 'trail', 'long-distance'], 74, 4.8, 132,
    '[{"id":"R1","userName":"Sneha","rating":5,"comment":"Very stable on broken roads and hill climbs.","createdAt":"2 days ago"},{"id":"R2","userName":"Aman","rating":4,"comment":"Great for weekend trails, brakes feel solid.","createdAt":"1 week ago"}]'::jsonb,
    true, false
  ),
  (
    'B-202', 'Metro Glide', 'electric', 16.69, 74.212, 64, 'in-use', 'Rankala Lake Hub',
    'https://images.unsplash.com/photo-1517846693594-1567da72af75?auto=format&fit=crop&w=800&q=80',
    2.2, 640, array['city', 'commute'], 58, 4.4, 88,
    '[{"id":"R3","userName":"Pooja","rating":4,"comment":"Smooth and practical for daily office runs.","createdAt":"3 days ago"}]'::jsonb,
    false, false
  ),
  (
    'B-203', 'Storm Sport 250', 'sports', 16.702, 74.24, 91, 'available', 'CBS Bus Stand Hub',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    4.1, 1450, array['highway', 'city'], 82, 4.7, 104,
    '[{"id":"R4","userName":"Tejas","rating":5,"comment":"Looks premium and handles really well.","createdAt":"4 days ago"}]'::jsonb,
    false, false
  ),
  (
    'B-204', 'RainRunner S', 'scooter', 16.7035, 74.2435, 54, 'available', 'Railway Station Hub',
    'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=800&q=80',
    1.9, 520, array['city', 'rain', 'short-trip'], 46, 4.5, 75,
    '[{"id":"R5","userName":"Mitali","rating":5,"comment":"Perfect when the roads are wet and traffic is messy.","createdAt":"5 days ago"}]'::jsonb,
    false, false
  ),
  (
    'B-205', 'Royal Retro', 'retro', 16.706, 74.245, 0, 'available', 'Shivaji University Hub',
    '/red-cruiser.jpg',
    1.6, 490, array['heritage', 'leisure'], 0, 4.6, 59,
    '[{"id":"R6","userName":"Ritu","rating":5,"comment":"The best bike for a chill heritage loop.","createdAt":"1 day ago"}]'::jsonb,
    false, true
  ),
  (
    'B-206', 'Campus Lite', 'commuter', 16.6915, 74.2155, 72, 'maintenance', 'Rankala Lake Hub',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    1.4, 420, array['city', 'student'], 51, 4.2, 43,
    '[{"id":"R7","userName":"Nikhil","rating":4,"comment":"Affordable and lightweight.","createdAt":"1 week ago"}]'::jsonb,
    false, false
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  lat = excluded.lat,
  lng = excluded.lng,
  battery = excluded.battery,
  status = excluded.status,
  location = excluded.location,
  image = excluded.image,
  price_per_minute = excluded.price_per_minute,
  day_pass_price = excluded.day_pass_price,
  terrain = excluded.terrain,
  range_km = excluded.range_km,
  rating = excluded.rating,
  review_count = excluded.review_count,
  reviews = excluded.reviews,
  featured = excluded.featured,
  retro = excluded.retro;
