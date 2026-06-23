-- ============================================================
-- NURI PET — store directory quality + consumer mirror read
-- Run AFTER 0002_marketplace.sql in the SQL Editor.
-- ============================================================

-- ---------- store profile fields (디렉토리 품질) ----------
alter table public.stores add column if not exists intro text;
alter table public.stores add column if not exists address text;
alter table public.stores add column if not exists image_url text;
alter table public.stores add column if not exists phone text;

-- refresh the public directory view to expose them
create or replace view public.store_directory as
  select s.id, s.name, s.type, s.open, s.close, s.intro, s.address, s.image_url,
         (select count(*) from public.services sv where sv.store_id = s.id) as service_count,
         (select min(price) from public.services sv where sv.store_id = s.id) as from_price
  from public.stores s;
grant select on public.store_directory to anon, authenticated;

-- ---------- consumers can read THEIR store-side mirror (for 내 예약 pet name) ----------
drop policy if exists customers_consumer_read on public.customers;
create policy customers_consumer_read on public.customers
  for select to authenticated
  using (consumer_id = (select auth.uid()));

drop policy if exists pets_consumer_read on public.pets;
create policy pets_consumer_read on public.pets
  for select to authenticated
  using (exists (
    select 1 from public.customers c
    where c.id = pets.customer_id and c.consumer_id = (select auth.uid())
  ));
