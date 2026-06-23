import type * as React from 'react'
import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { PawPrint, Plus, CalendarHeart, TrendingUp, Droplet, Zap, Utensils, Flame } from 'lucide-react'
import { Sparkline } from '@/components/Sparkline'
import { useConsumer } from '@/stores/consumer'
import { listConditionLogs } from '@/lib/consumer/api'
import type { ConditionLog } from '@/lib/consumer/api'
import type { PetOutletContext } from '@/app/pet/PetShell'
import { fmtDate, today } from '@/lib/date'
import './ConsumerHome.css'

/* 건강 우선 홈 — 보호자 메인.
   규제(§2): 기록/관찰/요약 표현만. 진단·처방·치료 금지. */

/* 컨디션 라벨 → 0~10 수치 (스파크라인·상태 매핑용) */
const APPETITE_SCALE: Record<string, number> = { 좋음: 9, 보통: 6, 적음: 3 }
const WATER_SCALE: Record<string, number> = { 많음: 9, 보통: 6, 적음: 3 }
const ENERGY_SCALE: Record<string, number> = { 활발: 9, 보통: 6, 처짐: 3 }

function scoreOf(map: Record<string, number>, v: string | null): number | null {
  if (!v) return null
  return map[v] ?? null
}

/** 가장 최근 비어있지 않은 값을 반환 */
function latestNonNull<T>(logs: ConditionLog[], pick: (l: ConditionLog) => T | null): T | null {
  for (const l of logs) {
    const v = pick(l)
    if (v != null) return v
  }
  return null
}

/** 최근 n개를 오래된→최신 순서로 수치화 (빈 값은 직전 값/기본값으로 보정) */
function seriesOf(logs: ConditionLog[], map: Record<string, number>, pick: (l: ConditionLog) => string | null, n = 7): number[] {
  const recent = logs.slice(0, n).reverse() // 오래된→최신
  const out: number[] = []
  let prev = 6
  for (const l of recent) {
    const s = scoreOf(map, pick(l))
    const v = s ?? prev
    out.push(v)
    prev = v
  }
  while (out.length < 2) out.push(prev) // Sparkline은 2점 이상 필요
  return out
}

/** 기록 스트릭 — 오늘 또는 어제부터 연속된 기록 일수 */
function streakOf(logs: ConditionLog[]): number {
  if (logs.length === 0) return 0
  const dates = new Set(logs.map((l) => l.date))
  const day = new Date()
  // 오늘 기록이 없으면 어제부터 카운트 (오늘 아직 안 적었어도 스트릭 유지)
  const todayStr = day.toISOString().slice(0, 10)
  if (!dates.has(todayStr)) day.setDate(day.getDate() - 1)
  let count = 0
  for (;;) {
    const key = day.toISOString().slice(0, 10)
    if (!dates.has(key)) break
    count += 1
    day.setDate(day.getDate() - 1)
  }
  return count
}

interface Insight {
  text: string
  vetHint: boolean
}

/** 관찰 인사이트 1줄 — 진단 아님, 변화 크면 상담 권장 */
function insightOf(logs: ConditionLog[]): Insight {
  if (logs.length < 2) {
    return { text: '며칠 더 기록하면 컨디션 패턴이 또렷해져요.', vetHint: false }
  }
  const recent = logs.slice(0, 3)
  const waterLow = recent.length >= 2 && recent.every((l) => l.water === '적음')
  const waterHigh = recent.length >= 2 && recent.every((l) => l.water === '많음')
  const energyLow = recent.length >= 2 && recent.every((l) => l.energy === '처짐')
  const appetiteLow = recent.length >= 2 && recent.every((l) => l.appetite === '적음')
  if (waterHigh) return { text: '음수량이 며칠째 많아요 · 변화가 크면 수의사 상담을 권해요.', vetHint: true }
  if (waterLow) return { text: '음수량이 며칠째 적어요 · 변화가 크면 수의사 상담을 권해요.', vetHint: true }
  if (energyLow) return { text: '활력이 며칠째 처져 보여요 · 변화가 크면 수의사 상담을 권해요.', vetHint: true }
  if (appetiteLow) return { text: '식욕이 며칠째 적어요 · 변화가 크면 수의사 상담을 권해요.', vetHint: true }
  return { text: '최근 컨디션이 안정적이에요. 오늘도 가볍게 기록해 보세요.', vetHint: false }
}

interface PetMetric {
  label: string
  value: string
  icon: typeof Droplet
  series: number[]
  color: string
}

export function ConsumerHome() {
  const consumer = useConsumer((s) => s.consumer)
  const pets = useConsumer((s) => s.pets)
  const initializing = useConsumer((s) => s.initializing)
  const logVersion = useConsumer((s) => s.logVersion)
  const { openLog } = useOutletContext<PetOutletContext>()

  const [petId, setPetId] = useState<string>('')
  const [logs, setLogs] = useState<ConditionLog[]>([])
  const [loading, setLoading] = useState(false)

  // 펫 목록이 준비되면 첫 펫 선택 (선택 유지)
  useEffect(() => {
    if (pets.length === 0) {
      setPetId('')
      return
    }
    setPetId((cur) => (pets.some((p) => p.id === cur) ? cur : pets[0].id))
  }, [pets])

  // 선택 펫의 컨디션 로그 조회 (logVersion 바뀌면 시트 저장 반영 위해 재조회)
  useEffect(() => {
    if (!petId) {
      setLogs([])
      return
    }
    let alive = true
    setLoading(true)
    listConditionLogs(petId)
      .then((rows) => {
        if (alive) setLogs(rows)
      })
      .catch(() => {
        if (alive) setLogs([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [petId, logVersion])

  /* ---- 초기화 중 ---- */
  if (initializing) {
    return (
      <div className="pet-scroll">
        <div className="pet-ch-loading">불러오는 중…</div>
      </div>
    )
  }

  /* ---- 비로그인 ---- */
  if (!consumer) {
    return (
      <div className="pet-scroll">
        <div className="pet-auth">
          <div className="pet-auth-logo">
            <PawPrint size={26} />
          </div>
          <h2 className="pet-auth-title">반려동물 건강, 매일 기록</h2>
          <p className="pet-auth-sub">
            식욕·음수·활력을 탭 한 번으로 남기고, 컨디션 변화를 한눈에 살펴보세요. 기록은 진단이 아니라 더 좋은 보살핌을 위한 메모예요.
          </p>
          <Link to="/pet/login" className="pet-cta pet-ch-ctalink">
            <PawPrint size={18} />
            NURI PET 시작하기
          </Link>
          <p className="pet-legal">NURI PET는 컨디션 기록 도구예요 · 진단·처방을 대신하지 않아요</p>
        </div>
      </div>
    )
  }

  const pet = pets.find((p) => p.id === petId) ?? null

  /* ---- 로그인 · 펫 없음 ---- */
  if (pets.length === 0) {
    return (
      <div className="pet-scroll">
        <Header name={consumer.name} />
        <section className="np-card pet-ch-empty np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
          <div className="pet-ch-empty-ic">
            <PawPrint size={28} />
          </div>
          <strong>아직 등록된 반려동물이 없어요</strong>
          <span>반려동물을 추가하면 오늘부터 컨디션을 기록할 수 있어요.</span>
          <Link to="/pet/more" className="pet-cta pet-ch-ctalink">
            <Plus size={18} />
            반려동물 추가
          </Link>
        </section>
        <p className="pet-legal np-an" style={{ '--d': '120ms' } as React.CSSProperties}>
          NURI PET는 컨디션 기록 도구예요 · 진단·처방을 대신하지 않아요
        </p>
      </div>
    )
  }

  /* ---- 로그인 · 펫 있음 ---- */
  const latestAppetite = latestNonNull(logs, (l) => l.appetite)
  const latestWater = latestNonNull(logs, (l) => l.water)
  const latestEnergy = latestNonNull(logs, (l) => l.energy)
  const streak = streakOf(logs)
  const insight = insightOf(logs)

  // 종합 상태: 최신값 중 주의 신호가 있으면 '관찰', 아니면 '안정'
  const hasWatch =
    latestAppetite === '적음' || latestWater === '적음' || latestWater === '많음' || latestEnergy === '처짐'
  const heroStatus = logs.length === 0 ? '기록 전' : hasWatch ? '관찰' : '안정'
  const heroNote =
    logs.length === 0
      ? '오늘 컨디션을 남기면 추세를 보여드릴게요.'
      : hasWatch
        ? '평소와 다른 신호가 보여요. 며칠 더 지켜봐 주세요.'
        : '최근 컨디션이 안정적이에요. 오늘도 가볍게 남겨보세요.'

  const metrics: PetMetric[] = [
    {
      label: '식욕',
      value: latestAppetite ?? '—',
      icon: Utensils,
      series: seriesOf(logs, APPETITE_SCALE, (l) => l.appetite),
      color: 'var(--good)',
    },
    {
      label: '음수',
      value: latestWater ?? '—',
      icon: Droplet,
      series: seriesOf(logs, WATER_SCALE, (l) => l.water),
      color: 'var(--accent)',
    },
    {
      label: '활력',
      value: latestEnergy ?? '—',
      icon: Zap,
      series: seriesOf(logs, ENERGY_SCALE, (l) => l.energy),
      color: 'var(--warn)',
    },
  ]

  return (
    <div className="pet-scroll">
      <Header name={consumer.name} />

      {/* 펫 선택 (여러 마리) */}
      {pets.length > 1 && (
        <div className="pet-chips np-an" style={{ '--d': '40ms' } as React.CSSProperties}>
          {pets.map((p) => (
            <button key={p.id} type="button" className={p.id === petId ? 'on' : undefined} onClick={() => setPetId(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* HERO — 최신 종합 컨디션 */}
      <section className="np-card pet-hero np-an" style={{ '--d': '70ms' } as React.CSSProperties}>
        <div className="pet-hero-head">
          <span className="pet-hero-cap">{pet ? `${pet.name} · 오늘 컨디션` : '오늘 컨디션'}</span>
          {streak > 0 && (
            <span className="np-chip pet-ch-streak">
              <Flame size={12} /> {streak}일째 기록 중
            </span>
          )}
        </div>
        <div className="pet-hero-status">{heroStatus}</div>
        <p className="pet-hero-note">{heroNote}</p>
        {loading && logs.length === 0 && <p className="pet-ch-mini">불러오는 중…</p>}
      </section>

      {/* metric grid — 식욕/음수/활력 */}
      <div className="pet-ch-grid">
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <section
              className="np-card pet-metric pet-ch-metric np-an"
              key={m.label}
              style={{ '--d': `${120 + i * 50}ms` } as React.CSSProperties}
            >
              <div className="pet-m-head">
                <span className="pet-ch-mlabel">
                  <Icon size={13} /> {m.label}
                </span>
              </div>
              <div className="pet-m-val">{m.value}</div>
              <Sparkline data={m.series} color={m.color} w={88} h={28} />
            </section>
          )
        })}
      </div>

      {/* 관찰 인사이트 (비진단) */}
      <section className="np-card pet-insight np-an" style={{ '--d': '300ms' } as React.CSSProperties}>
        <div className="pet-ins-ic">
          <TrendingUp size={18} />
        </div>
        <div className="pet-ins-txt">
          <strong>최근 관찰</strong>
          <span>{insight.text}</span>
        </div>
      </section>

      {/* CTA — 오늘 컨디션 기록 */}
      <button
        type="button"
        className="pet-cta np-an"
        style={{ '--d': '360ms' } as React.CSSProperties}
        onClick={() => openLog(petId || undefined)}
      >
        <Plus size={18} />
        오늘 컨디션 기록
      </button>

      {/* 보조 CTA — 예약 */}
      <Link to="/pet/discover" className="pet-ch-sub np-an" style={{ '--d': '410ms' } as React.CSSProperties}>
        <span className="pet-ch-sub-ic">
          <CalendarHeart size={17} />
        </span>
        <span className="pet-ch-sub-txt">
          <strong>가까운 펫 서비스 예약</strong>
          <em>미용 · 호텔 · 병원을 둘러보고 예약해요</em>
        </span>
      </Link>

      <p className="pet-legal np-an" style={{ '--d': '460ms' } as React.CSSProperties}>
        NURI PET는 컨디션 기록 도구예요 · 진단·처방을 대신하지 않아요
      </p>
    </div>
  )
}

function Header({ name }: { name: string }) {
  return (
    <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
      <div>
        <div className="pet-hello">{fmtDate(today())} · 오늘</div>
        <div className="pet-name">{name}님</div>
        <div className="pet-meta">반려동물의 오늘을 기록해요</div>
      </div>
      <div className="pet-avatar">
        <span>{name.slice(0, 1)}</span>
        <i />
      </div>
    </div>
  )
}
