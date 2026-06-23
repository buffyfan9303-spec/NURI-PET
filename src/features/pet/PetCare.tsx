import type * as React from 'react'
import { Droplets, Bone, Sparkles, Brush } from 'lucide-react'
import { PET_PROFILE } from '@/lib/mock/pet'

interface Rec {
  icon: typeof Droplets
  tag: string
  title: string
  desc: string
}

// Food / supplies only — no medication, no diagnosis (CLAUDE.md §2).
const RECS: Rec[] = [
  { icon: Droplets, tag: '음수 케어', title: '시니어견 자동 급수기', desc: '음수 패턴이 흔들릴 때 꾸준한 수분 섭취를 도와요.' },
  { icon: Bone, tag: '식품·보조제', title: '관절 건강 보조제(식품)', desc: '11살 시니어를 위한 관절 보조 식품. 일반 영양 보조제예요.' },
  { icon: Sparkles, tag: '식이', title: '시니어 전용 사료', desc: '소화가 편한 시니어 포뮬러로 천천히 전환해 보세요.' },
  { icon: Brush, tag: '관리', title: '주간 빗질 케어킷', desc: '비숑 곱슬모 엉킴 방지용 데일리 그루밍 도구.' },
]

export function PetCare() {
  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">{PET_PROFILE.name}를 위한</div>
          <div className="pet-name">케어 추천</div>
          <div className="pet-meta">컨디션 기록을 바탕으로 골랐어요</div>
        </div>
      </div>

      {RECS.map((r, i) => {
        const Icon = r.icon
        return (
          <section
            className="pet-rec np-card np-an"
            key={r.title}
            style={{ '--d': `${60 + i * 60}ms`, marginTop: i === 0 ? 0 : 12 } as React.CSSProperties}
          >
            <div className="pet-rec-thumb" aria-hidden>
              <Icon size={20} />
            </div>
            <div className="pet-rec-txt">
              <span className="pet-rec-tag">{r.tag}</span>
              <strong>{r.title}</strong>
              <em>{r.desc}</em>
            </div>
            <button type="button" className="pet-rec-go">
              보기
            </button>
          </section>
        )
      })}

      <p className="pet-legal np-an" style={{ '--d': '320ms' } as React.CSSProperties}>
        식품·보조제만 추천해요 · 의약품은 다루지 않아요 · 건강 변화는 수의사와 상담하세요
      </p>
    </div>
  )
}
