-- ============================================================
-- NURI PET — initial schema + RLS  (CLAUDE.md §5)
-- Run in: Supabase Dashboard → SQL Editor (project pothwgpmdltykjzzcyga)
-- Multitenancy: every row is scoped by store_id; RLS isolates per store.
-- Regulatory (§2): health fields are record/display only — no diagnosis.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- tables ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default '미용실',
  open time not null default '10:00',
  close time not null default '20:00',
  closed_weekdays int[] not null default '{0}',     -- 0 = Sunday
  commerce_enabled boolean not null default false,   -- #3 feature flag (OFF)
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,  -- link to Supabase Auth
  email text,                                                 -- match to an auth user for linking
  name text not null,
  role text not null default 'staff' check (role in ('owner','staff')),
  commission_rate numeric not null default 0,
  color text not null default '#5e6ad2',
  created_at timestamptz not null default now()
);
create index if not exists staff_store_idx on public.staff(store_id);
create index if not exists staff_user_idx on public.staff(user_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  notify_consent boolean not null default false,
  no_show_score int not null default 0,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists customers_store_idx on public.customers(store_id);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  species text not null default '강아지',
  breed text,
  age_y int,
  weight_kg numeric,
  vaccinations jsonb not null default '[]',
  allergies text[] not null default '{}',
  grooming_note text default '',
  temperament text default '온순',
  created_at timestamptz not null default now()
);
create index if not exists pets_store_idx on public.pets(store_id);
create index if not exists pets_customer_idx on public.pets(customer_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category text not null,
  name text not null,
  price int not null default 0,
  duration_min int not null default 60
);
create index if not exists services_store_idx on public.services(store_id);

create table if not exists public.cages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  label text not null,
  size text not null default 'M' check (size in ('S','M','L'))
);
create index if not exists cages_store_idx on public.cages(store_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  date date not null,
  start_time time not null,
  duration_min int not null default 60,
  status text not null default 'requested'
    check (status in ('requested','confirmed','checked_in','done','no_show','cancelled')),
  deposit int not null default 0,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists appts_store_date_idx on public.appointments(store_id, date);

create table if not exists public.boarding (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  cage_id uuid references public.cages(id) on delete set null,
  check_in date not null,
  check_out date not null,
  daycare boolean not null default false,
  memo text default '',
  created_at timestamptz not null default now()
);
create index if not exists boarding_store_idx on public.boarding(store_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount int not null default 0,
  method text not null default '카드' check (method in ('카드','현금','계좌이체')),
  discount int not null default 0,
  unpaid boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists payments_store_idx on public.payments(store_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  template text not null check (template in ('예약확정','리마인드','픽업알림','노쇼경고')),
  status text not null default '대기' check (status in ('발송','대기','실패')),
  sent_at timestamptz not null default now()
);
create index if not exists messages_store_idx on public.messages(store_id);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  desired text,
  priority int not null default 1
);
create index if not exists waitlist_store_idx on public.waitlist(store_id);

-- ---------- #3 commerce seed tables (food / supplements only) ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category text not null,                 -- 사료 / 영양제 (식품·보조제만; 의약품 금지)
  name text not null,
  price int not null default 0,
  unit text,
  cycle_days int                          -- 권장 소비 주기
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  cycle_days int not null default 30,
  status text not null default 'active'
);

create table if not exists public.consumption_estimates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  est_depletion_date date
);

-- ---------- tenant helper (RLS analogue) ----------
-- Returns the store_id of the staff row linked to the current auth user.
create or replace function public.current_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.staff where user_id = auth.uid() limit 1
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff where user_id = auth.uid() and role = 'owner'
  )
$$;

-- ---------- RLS: every table scoped to the caller's store ----------
do $$
declare t text;
begin
  foreach t in array array[
    'staff','customers','pets','services','cages','appointments',
    'boarding','payments','messages','waitlist',
    'products','subscriptions','consumption_estimates'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      create policy %1$s_rw on public.%1$I
        for all to authenticated
        using (store_id = (select public.current_store_id()))
        with check (store_id = (select public.current_store_id()));
    $f$, t);
  end loop;
end$$;

-- stores: a user can see/manage only their own store
alter table public.stores enable row level security;
create policy stores_rw on public.stores
  for all to authenticated
  using (id = (select public.current_store_id()))
  with check (id = (select public.current_store_id()));
