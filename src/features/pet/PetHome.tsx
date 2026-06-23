import type * as React from 'react'
import { useOutletContext } from 'react-router-dom'
import { TrendingUp, ShoppingBag, Plus } from 'lucide-react'
import { Sparkline } from '@/components/Sparkline'
import { STRIP, SPARKS, PET_PROFILE } from '@/lib/mock/pet'
import { fmtDate, today } from '@/lib/date'
import type { PetOutletContext } from '@/app/pet/PetShell'

interface Metric {
  k: string
  v: string
  t: string
  rising: boolean
  spark: number[]
  color: string
}

const METRICS: Metric[] = [
  { k: '식욕', v: '좋음', t: '안정', rising: false, spark: SPARKS.appetite, color: 'var(--good)' },
  { k: '음수량', v: '+18%', t: '늘어남', rising: true, spark: SPARKS.water, color: 'var(--warn)' },
  { k: '활력', v: '보통', t: '안정', rising: false, spark: SPARKS.energy, color: 'var(--good)' },
  { k: '체중', v: `${PET_PROFILE.weightKg}kg`, t: '안정', rising: false, spark: SPARKS.weight, color: 'var(--tx2)' },
]

export function PetHome() {
  const { openLog } = useOutletContext<PetOutletContext>()
  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">{fmtDate(today())} · 오늘</div>
          <div className="pet-name">{PET_PROFILE.name}</div>
          <div className="pet-meta">
            {PET_PROFILE.breed} · {PET_PROFILE.age}살 · {PET_PROFILE.careTag}
          </div>
        </div>
        <div className="pet-avatar">
          <span>{PET_PROFILE.name.slice(0, 1)}</span>
          <i />
        </div>
      </div>

      {/* HERO — 14-day condition strip */}
      <section className="np-card pet-hero np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        <div className="pet-hero-head">
          <span className="pet-hero-cap">오늘 컨디션</span>
          <span className="np-chip">
            <b style={{ color: 'var(--good)' }}>●</b> 14일 안정 추세
          </span>
        </div>
        <div className="pet-hero-status">안정</div>
        <p className="pet-hero-note">전반적으로 안정적이에요. 음수량 하나만 지켜보면 돼요.</p>
        <div className="pet-strip">
          {STRIP.map((s, i) => (
            <i key={i} className={`pet-bar pet-${s}`} style={{ height: `${44 + (i % 5) * 7}%` }} />
          ))}
        </div>
        <div className="pet-strip-cap">
          <span>2주 전</span>
          <span>오늘</span>
        </div>
      </section>

      {/* metric grid */}
      <div className="pet-grid">
        {METRICS.map((m, i) => (
          <section
            className="np-card pet-metric np-an"
            key={m.k}
            style={{ '--d': `${120 + i * 50}ms` } as React.CSSProperties}
          >
            <div className="pet-m-head">
              <span className="pet-m-label">{m.k}</span>
              <span className={`pet-trend ${m.rising ? 't-w' : 't-g'}`}>
                {m.rising ? '▲' : '—'} {m.t}
              </span>
            </div>
            <div className="pet-m-val">{m.v}</div>
            <Sparkline data={m.spark} color={m.color} />
          </section>
        ))}
      </div>

      {/* insight — observation framing (non-diagnostic) */}
      <section className="np-card pet-insight np-an" style={{ '--d': '330ms' } as React.CSSProperties}>
        <div className="pet-ins-ic">
          <TrendingUp size={18} />
        </div>
        <div className="pet-ins-txt">
          <strong>음수량이 7일째 평소보다 많아요</strong>
          <span>기록을 이어가면 패턴이 더 또렷해져요. 변화가 크다면 수의사 상담을 권해요.</span>
        </div>
      </section>

      {/* commerce layer — restrained recommendation (food/supplies only) */}
      <section className="np-card pet-rec np-an" style={{ '--d': '390ms' } as React.CSSProperties}>
        <div className="pet-rec-thumb" aria-hidden>
          <ShoppingBag size={20} />
        </div>
        <div className="pet-rec-txt">
          <span className="pet-rec-tag">추천 케어</span>
          <strong>시니어견 자동 급수기</strong>
          <em>음수 패턴이 흔들릴 때 도움돼요</em>
        </div>
        <button type="button" className="pet-rec-go">
          보기
        </button>
      </section>

      <button type="button" className="pet-cta np-an" style={{ '--d': '450ms' } as React.CSSProperties} onClick={openLog}>
        <Plus size={18} />
        오늘 컨디션 기록
      </button>

      <p className="pet-legal np-an" style={{ '--d': '500ms' } as React.CSSProperties}>
        NURI PET는 컨디션 기록 도구예요 · 진단·처방을 대신하지 않아요
      </p>
    </div>
  )
}
