# Supabase 연결 가이드 — NURI PET

> 프로젝트 ref: **pothwgpmdltykjzzcyga** · region: **ap-southeast-1**
> URL: `https://pothwgpmdltykjzzcyga.supabase.co`

현재 앱은 **목 데이터 스토어**(`src/stores/data.ts`)로 완전히 동작합니다. 아래 단계를 끝내면 실 백엔드로 전환할 준비가 끝납니다. (이 프로젝트는 현재 MCP 토큰으로 접근이 안 되어 — 접근 가능한 건 NURI HOLDEM뿐 — 마이그레이션/키는 아래 두 단계를 **직접** 해주셔야 합니다.)

## 1단계 — 스키마 생성 (SQL Editor)
1. Supabase Dashboard → 프로젝트 `pothwgpmdltykjzzcyga` → **SQL Editor**.
2. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 전체를 붙여넣고 **Run**. (테이블 16종 + `current_store_id()`/`is_owner()` 헬퍼 + 매장 단위 RLS)
3. [`supabase/seed.sql`](supabase/seed.sql) 붙여넣고 **Run**. (매장·직원·서비스·케이지 시드)

## 2단계 — anon 키를 `.env`에 입력
1. Dashboard → **Project Settings → API** → `anon` / `publishable` 키 복사.
2. 프로젝트 루트에 `.env` 생성(`.env.example` 복사):
   ```
   VITE_SUPABASE_URL=https://pothwgpmdltykjzzcyga.supabase.co
   VITE_SUPABASE_ANON_KEY=<복사한 키>
   ```
   `.env`는 gitignore되어 커밋되지 않습니다.

## 3단계 — Auth 사용자 ↔ 직원 연결
1. Dashboard → **Authentication → Users** → 직원 이메일로 사용자 생성
   (`owner@dogwell.kr`, `staff@dogwell.kr`, `trim@dogwell.kr` / 비번 임의).
2. SQL Editor에서 연결:
   ```sql
   update public.staff s set user_id = u.id
   from auth.users u where u.email = s.email and s.user_id is null;
   ```
   이제 RLS가 매장 단위로 격리됩니다(`current_store_id()`).

## 이후(코드 작업)
위 3단계가 끝나면 데이터 레이어(`src/stores/data.ts`)의 읽기/쓰기를 Supabase로 전환하고,
목 세션(`src/stores/session.ts`)을 Supabase Auth로 교체합니다. UI/화면 코드는 그대로 둡니다.
`supabase gen types typescript --project-id pothwgpmdltykjzzcyga > src/lib/supabase/types.ts` 로 타입도 생성합니다.

## 규제 가드레일 (§2)
- 건강 데이터(예방접종·체중)는 기록/표시 목적만.
- `products`는 식품·보조제(사료·영양제)만 — 의약품 금지. `#3` 커머스는 `stores.commerce_enabled` 플래그로 게이팅(기본 OFF).
