import type * as React from 'react'
import { useState } from 'react'
import { SERIES, DIM } from '@/lib/mock/pet'
import { scaleY, smoothPath, type Pt } from '@/lib/charts'
import { PET_PROFILE } from '@/lib/mock/pet'

const CW = 320
const CH = 150
const CPAD = 16

export function PetTrend() {
  const [dim, setDim] = useState<string>('water')
  const meta = DIM[dim]
  const vals = SERIES[dim]
  const yf = scaleY(vals, CH, CPAD + 6)
  const step = (CW - CPAD * 2) / (vals.length - 1)
  const cpts: Pt[] = vals.map((v, i) => ({ x: CPAD + i * step, y: yf(v) }))
  const line = smoothPath(cpts)
  const last = cpts[cpts.length - 1]
  const area = `${line} L ${last.x.toFixed(1)} ${CH - CPAD} L ${cpts[0].x.toFixed(1)} ${CH - CPAD} Z`

  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">최근 30일</div>
          <div className="pet-name">추이</div>
          <div className="pet-meta">{PET_PROFILE.name} · 컨디션 흐름</div>
        </div>
      </div>

      <div className="pet-chips np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        {Object.keys(DIM).map((k) => (
          <button
            key={k}
            type="button"
            className={dim === k ? 'on' : undefined}
            onClick={() => setDim(k)}
          >
            {DIM[k].label}
          </button>
        ))}
      </div>

      <section className="np-card pet-chartcard np-an" style={{ '--d': '120ms' } as React.CSSProperties}>
        <div className="pet-chart-head">
          <div>
            <span className="pet-chart-label">{meta.label}</span>
            <span className="pet-chart-unit">{meta.unit}</span>
          </div>
          <span className="np-chip">
            <b style={{ color: meta.color }}>●</b> {meta.rising ? '상승 추세' : '안정'}
          </span>
        </div>
        <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} className="pet-chart" preserveAspectRatio="none">
          <defs>
            <linearGradient id="petfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: meta.color, stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: meta.color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={CPAD}
              x2={CW - CPAD}
              y1={CH * g}
              y2={CH * g}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}
          <path d={area} fill="url(#petfill)" />
          <path
            d={line}
            fill="none"
            style={{ stroke: meta.color }}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={last.x} cy={last.y} r="4" style={{ fill: meta.color }} />
          <circle cx={last.x} cy={last.y} r="8" style={{ fill: meta.color, opacity: 0.16 }} />
        </svg>
        <div className="pet-chart-x">
          <span>30일 전</span>
          <span>오늘</span>
        </div>
      </section>

      <section className="np-card pet-pattern np-an" style={{ '--d': '200ms' } as React.CSSProperties}>
        <div className="pet-pat-row">
          <span className="pet-dot g" />
          <p>
            <strong>식욕·활력은 안정 범위예요</strong>최근 4주간 큰 변동 없이 유지됐어요
          </p>
        </div>
        <div className="pet-pat-line" />
        <div className="pet-pat-row">
          <span className="pet-dot w" />
          <p>
            <strong>음수량은 완만히 늘고 있어요</strong>지난주 대비 평균 약 11% 증가 흐름
          </p>
        </div>
      </section>

      <p className="pet-legal np-an" style={{ '--d': '260ms' } as React.CSSProperties}>
        흐름 관찰용 데이터예요 · 의학적 판단은 수의사와 함께하세요
      </p>
    </div>
  )
}
