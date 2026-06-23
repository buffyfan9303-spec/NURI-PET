-- ============================================================
-- NURI PET — starter seed (store config). Run AFTER 0001_init.sql.
-- Transactional data (customers/pets/appointments) is added via the app;
-- this seeds the store, staff, service catalog, and cages.
-- ============================================================

insert into public.stores (id, name, type, open, close)
values ('11111111-1111-1111-1111-111111111111', '도그웰 살롱', '미용실', '10:00', '20:00')
on conflict (id) do nothing;

insert into public.staff (store_id, email, name, role, commission_rate, color) values
  ('11111111-1111-1111-1111-111111111111', 'owner@dogwell.kr', '김미용', 'owner', 0,    '#5e6ad2'),
  ('11111111-1111-1111-1111-111111111111', 'staff@dogwell.kr', '이그루', 'staff', 0.35, '#36b37e'),
  ('11111111-1111-1111-1111-111111111111', 'trim@dogwell.kr',  '박트림', 'staff', 0.30, '#d99a30');

insert into public.services (store_id, category, name, price, duration_min) values
  ('11111111-1111-1111-1111-111111111111', '미용', '전체미용',      55000, 90),
  ('11111111-1111-1111-1111-111111111111', '미용', '부분미용',      30000, 60),
  ('11111111-1111-1111-1111-111111111111', '목욕', '목욕+부분',     35000, 60),
  ('11111111-1111-1111-1111-111111111111', '미용', '위생미용',      20000, 40),
  ('11111111-1111-1111-1111-111111111111', '미용', '전체미용+스파', 75000, 120),
  ('11111111-1111-1111-1111-111111111111', '목욕', '고양이 목욕',   40000, 60);

insert into public.cages (store_id, label, size) values
  ('11111111-1111-1111-1111-111111111111', 'A-1', 'S'),
  ('11111111-1111-1111-1111-111111111111', 'A-2', 'S'),
  ('11111111-1111-1111-1111-111111111111', 'A-3', 'M'),
  ('11111111-1111-1111-1111-111111111111', 'A-4', 'M'),
  ('11111111-1111-1111-1111-111111111111', 'B-1', 'L'),
  ('11111111-1111-1111-1111-111111111111', 'B-2', 'L'),
  ('11111111-1111-1111-1111-111111111111', 'B-3', 'M'),
  ('11111111-1111-1111-1111-111111111111', 'B-4', 'S');

-- After creating Supabase Auth users with the emails above, link them:
--   update public.staff s
--   set user_id = u.id
--   from auth.users u
--   where u.email = s.email and s.user_id is null;
