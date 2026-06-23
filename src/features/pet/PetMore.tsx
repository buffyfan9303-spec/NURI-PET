import type * as React from 'react'
import { Bell, Users, Download, FileText, ShieldCheck, ChevronRight } from 'lucide-react'
import { PET_PROFILE } from '@/lib/mock/pet'

interface Row {
  icon: typeof Bell
  label: string
  hint?: string
}

const SETTINGS: Row[] = [
  { icon: Bell, label: '알림 설정', hint: '리마인드 · 케어 알림' },
  { icon: Users, label: '가족과 공유', hint: '2명' },
  { icon: Download, label: '기록 내보내기', hint: 'CSV' },
  { icon: FileText, label: '이용약관' },
  { icon: ShieldCheck, label: '개인정보 처리방침' },
]

export function PetMore() {
  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">더보기</div>
          <div className="pet-name">{PET_PROFILE.name}</div>
          <div className="pet-meta">
            {PET_PROFILE.breed} · {PET_PROFILE.age}살 · {PET_PROFILE.weightKg}kg
          </div>
        </div>
        <div className="pet-avatar">
          <span>{PET_PROFILE.name.slice(0, 1)}</span>
          <i />
        </div>
      </div>

      <div className="pet-sec-title np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        설정
      </div>
      <div className="pet-rowlist np-card np-an" style={{ '--d': '90ms' } as React.CSSProperties}>
        {SETTINGS.map((r) => {
          const Icon = r.icon
          return (
            <button type="button" className="pet-row" key={r.label}>
              <span className="pet-row-ic">
                <Icon size={17} />
              </span>
              <span className="pet-row-label">{r.label}</span>
              {r.hint && <span className="pet-row-hint">{r.hint}</span>}
              <ChevronRight size={16} className="pet-row-chev" />
            </button>
          )
        })}
      </div>

      <p className="pet-legal np-an" style={{ '--d': '160ms' } as React.CSSProperties}>
        NURI PET v0.1 · 컨디션 기록 도구예요 · 진단·처방을 대신하지 않아요
      </p>
    </div>
  )
}
