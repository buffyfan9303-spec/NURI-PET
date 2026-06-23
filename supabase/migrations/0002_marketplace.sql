-- ============================================================
-- NURI PET — marketplace layer (consumer accounts + booking)
-- Run AFTER 0001_init.sql in the SQL Editor.
-- Adds: 보호자 계정/펫/건강기록, 공개 매장 디렉토리, 예약 RPC.
-- ============================================================

-- ---------- consumer (보호자) tables ----------
create table if not exists public.consumer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,  -- = auth.uid()
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.consumer_pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.consumer_profiles(id) on delete cascade,
  name text not null,
  species text not null default '강아지',
  breed text,
  age_y int,
  weight_kg numeric,
  care_tag text,
  created_at timestamptz not null default now()
);
create index if not exists consumer_pets_owner_idx on public.consumer_pets(owner_id);

-- pet health log (the "건강관리 우선 홍보" hook, now persisted per consumer)
create table if not exists public.pet_condition_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.consumer_pets(id) on delete cascade,
  date date not null default current_date,
  appetite text,    -- 좋음/보통/적음
  water text,       -- 많음/보통/적음
  energy text,      -- 활발/보통/처짐
  weight_kg numeric,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists condition_logs_pet_idx on public.pet_condition_logs(pet_id, date);

-- ---------- link store records back to the platform consumer ----------
alter table public.appointments add column if not exists consumer_id uuid references public.consumer_profiles(id) on delete set null;
alter table public.customers   add column if not exists consumer_id uuid references public.consumer_profiles(id) on delete set null;
create index if not exists appts_consumer_idx on public.appointments(consumer_id);

-- ---------- RLS: consumer self-owned ----------
alter table public.consumer_profiles enable row level security;
drop policy if exists consumer_profiles_self on public.consumer_profiles;
create policy consumer_profiles_self on public.consumer_profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.consumer_pets enable row level security;
drop policy if exists consumer_pets_self on public.consumer_pets;
create policy consumer_pets_self on public.consumer_pets
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table public.pet_condition_logs enable row level security;
drop policy if exists condition_logs_self on public.pet_condition_logs;
create policy condition_logs_self on public.pet_condition_logs
  for all to authenticated
  using (exists (select 1 from public.consumer_pets cp where cp.id = pet_id and cp.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.consumer_pets cp where cp.id = pet_id and cp.owner_id = (select auth.uid())));

-- ---------- public store directory (browse/compare) ----------
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores for select to anon, authenticated using (true);

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select to anon, authenticated using (true);

-- ---------- consumers can read their own bookings (any store) ----------
drop policy if exists appts_consumer_read on public.appointments;
create policy appts_consumer_read on public.appointments
  for select to authenticated using (consumer_id = (select auth.uid()));

-- ---------- booking RPC (cross-tenant write via SECURITY DEFINER) ----------
-- Consumer books at a store: mirror a customer+pet into that store, then
-- insert a 'requested' appointment that lands in the operator's calendar.
create or replace function public.book_appointment(
  p_store_id uuid,
  p_service_id uuid,
  p_date date,
  p_start_time time,
  p_pet_name text,
  p_species text,
  p_breed text,
  p_owner_name text,
  p_phone text,
  p_staff_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumer uuid := auth.uid();
  v_customer uuid;
  v_pet uuid;
  v_dur int;
  v_appt uuid;
begin
  if v_consumer is null then raise exception 'login required'; end if;
  if not exists (select 1 from public.services where id = p_service_id and store_id = p_store_id) then
    raise exception 'invalid service for store';
  end if;
  select duration_min into v_dur from public.services where id = p_service_id;

  select id into v_customer from public.customers
    where store_id = p_store_id and consumer_id = v_consumer limit 1;
  if v_customer is null then
    insert into public.customers (store_id, consumer_id, name, phone, notify_consent)
    values (p_store_id, v_consumer, coalesce(p_owner_name, '보호자'), p_phone, true)
    returning id into v_customer;
  end if;

  select id into v_pet from public.pets
    where store_id = p_store_id and customer_id = v_customer and name = p_pet_name limit 1;
  if v_pet is null then
    insert into public.pets (store_id, customer_id, name, species, breed)
    values (p_store_id, v_customer, p_pet_name, coalesce(p_species, '강아지'), p_breed)
    returning id into v_pet;
  end if;

  insert into public.appointments
    (store_id, pet_id, staff_id, service_id, date, start_time, duration_min, status, consumer_id)
  values
    (p_store_id, v_pet, p_staff_id, p_service_id, p_date, p_start_time, coalesce(v_dur, 60), 'requested', v_consumer)
  returning id into v_appt;

  return v_appt;
end$$;

grant execute on function public.book_appointment(uuid, uuid, date, time, text, text, text, text, text, uuid) to authenticated;

-- ---------- store directory view (public summary for the marketplace) ----------
create or replace view public.store_directory as
  select s.id, s.name, s.type, s.open, s.close,
         (select count(*) from public.services sv where sv.store_id = s.id) as service_count,
         (select min(price) from public.services sv where sv.store_id = s.id) as from_price
  from public.stores s;
grant select on public.store_directory to anon, authenticated;
