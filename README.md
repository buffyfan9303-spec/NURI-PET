# NURI PET

펫 서비스 사업자용 **통합 운영 OS(PC)** + 보호자용 **컨디션 기록 앱(모바일)**. 하나의 디자인 언어, 두 개의 경험. 벤치마크: MoeGo.

> SSOT는 저장소 루트 `CLAUDE.md`. 규제 가드레일(수의사법·동물용 의약품·금지어 진단/처방/치료)은 반드시 준수.

## 스택

Vite 8 · React 19 · TypeScript 6 · Tailwind v4(`@tailwindcss/vite`) · React Router · TanStack Query/Table · Zustand · RHF + Zod · date-fns(KST) · lucide-react

## 실행

```bash
npm install
npm run dev      # http://localhost:5182
npm run build    # tsc -b && vite build
```

## 라우트

| 경로 | 화면 | 타깃 |
|---|---|---|
| `/` | 제품 런처(운영자 OS / 보호자 앱) | — |
| `/app` | 운영자 OS — 3존 데스크톱 셸 | PC |
| `/app` (index) | 대시보드(예약 보드·KPI·알림) | PC |
| `/app/appointments` … `/settings` | 예약/고객·펫/결제·장부/호텔/직원/알림톡/설정 | PC |
| `/pet` | 보호자 앱 — 모바일 컨디션 대시보드 | 모바일 |
| `/pet/trend` | 30일 추이 차트 | 모바일 |

## 디자인 시스템

- **토큰**: `src/styles/tokens.css` — Linear 인디고 다크가 시그니처, 라이트 완전 지원. 다크/라이트는 `<html>`의 `.dark`/`.light` 클래스로 전환(FOUC 방지 인라인 스크립트 + Zustand 영속).
- **공용 프리미티브**: `src/styles/components.css`(`.np-card` `.np-btn` `.np-badge` `.np-chip` `.np-input` …).
- 색상은 모두 CSS 변수 → 두 테마에서 자동 적응. SVG는 `style`로 색을 주입해 테마 반응.

## 폴더 구조 (CLAUDE.md §8)

```
src/
  app/         라우팅 + 셸: Landing, operator/(Shell·Sidebar·TopBar), pet/(Shell)
  features/    도메인 화면: dashboard, operator(placeholder), pet(Home·Trend)
  components/  공용: Sparkline, ThemeToggle
  lib/         charts, cn, date(KST), platform/(print·file 어댑터), mock/
  stores/      zustand (ui: theme·sidebar)
  styles/      tokens.css, components.css
```

## 구현 상태

- ✅ STEP 1·4·9: 부트스트랩 + 3존 셸 + 다크/라이트 + 디자인 시스템 + ⌘K 명령 팔레트 + 대시보드
- ✅ STEP 5·6·7·8·10·12: 고객·펫(마스터-디테일) · 설정(서비스/가격/영업시간) · 예약 캘린더(일·주, 직원 레인) · 결제·장부(POS·정산·미수) · 알림톡(템플릿·이력·자동규칙) · 호텔·데이케어(케이지 보드) · 직원(커미션·스케줄)
- ✅ 보호자 앱: 홈 · 추이 · 추천(케어) · 더보기 + 퀵로그 시트
- ✅ 공유 도메인 목 데이터 `src/lib/mock/db.ts` (Supabase 스키마 미러 → 백엔드 연결 시 데이터 레이어만 교체)
- ⏳ STEP 2~3: Supabase 스키마·RLS·타입·시드 / Auth·멀티테넌트
- ⏳ 실제 결제 PG · Solapi 알림톡 연동 · STEP 11 노쇼 방지 로직 · STEP 14 PWA·배포
- 🔒 STEP 13: #3 커머스(사료·영양제) 피처 플래그 OFF (설정에서 토글 시 placeholder 노출)

> 운영자 OS는 PC 전용(데스크톱 우선, 1024 하한 시 아이콘 레일). 보호자 앱은 모바일 우선(데스크톱에서 440px 컬럼).
