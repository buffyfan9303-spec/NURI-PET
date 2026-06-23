import type * as React from 'react'
import { useMemo, useState } from 'react'
import { BedDouble, Sun, LayoutGrid, X, LogOut, Dog, User, CalendarDays, StickyNote } from 'lucide-react'
import {
  useData,
  DEMO_TODAY,
  petById,
  customerOfPet,
  type Cage,
  type Boarding,
} from '@/stores/data'
import '../feature.css'
import './boarding.css'

type ViewFilter = 'all' | 'stay' | 'daycare'

function occupies(b: Boarding): boolean {
  return b.checkIn <= DEMO_TODAY && DEMO_TODAY <= b.checkOut
}

/** YYYY-MM-DD → M.D (요일) */
const WD = ['일', '월', '화', '수', '목', '금', '토']
function fmtShort(d: string): string {
  const [, m, day] = d.split('-').map(Number)
  const wd = WD[new Date(d + 'T00:00:00').getDay()]
  return `${m}.${day}(${wd})`
}
function nights(b: Boarding): number {
  const a = new Date(b.checkIn + 'T00:00:00').getTime()
  const c = new Date(b.checkOut + 'T00:00:00').getTime()
  return Math.max(0, Math.round((c - a) / 86400000))
}

const SIZE_LABEL: Record<Cage['size'], string> = { S: '소형', M: '중형', L: '대형' }

export function BoardingPage() {
  const cages = useData((s) => s.cages)
  const boardings = useData((s) => s.boardings)
  const checkOutBoarding = useData((s) => s.checkOutBoarding)

  const [view, setView] = useState<ViewFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // cageId → active boarding today (live)
  const occByCage = useMemo(() => {
    const map = new Map<string, Boarding>()
    for (const b of boardings) {
      if (occupies(b)) map.set(b.cageId, b)
    }
    return map
  }, [boardings])

  const stayCount = useMemo(
    () => boardings.filter((b) => occupies(b) && !b.daycare).length,
    [boardings],
  )
  const daycareCount = useMemo(
    () => boardings.filter((b) => occupies(b) && b.daycare).length,
    [boardings],
  )
  const occupiedTotal = occByCage.size
  const occRate = Math.round((occupiedTotal / cages.length) * 100)

  // Which cages to render (filter dims non-matching occupied; empty always shown unless filtering)
  const matchView = (b: Boarding): boolean => {
    if (view === 'all') return true
    if (view === 'stay') return !b.daycare
    return b.daycare
  }

  const selected = selectedId ? occByCage.get(selectedId) ?? null : null
  const selectedCage = selectedId ? cages.find((c) => c.id === selectedId) ?? null : null

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">호텔 · 데이케어 보드</div>
          <div className="feat-sub">
            {fmtShort(DEMO_TODAY)} 기준 · 케이지 {cages.length}칸 중 {occupiedTotal}칸 사용 · 점유율 {occRate}%
          </div>
        </div>
        <div className="feat-actions">
          <div className="brd-segs" role="tablist" aria-label="보기 필터">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'all'}
              className={`brd-seg ${view === 'all' ? 'on' : ''}`}
              onClick={() => setView('all')}
            >
              <LayoutGrid size={14} /> 전체
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'stay'}
              className={`brd-seg ${view === 'stay' ? 'on' : ''}`}
              onClick={() => setView('stay')}
            >
              <BedDouble size={14} /> 숙박
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'daycare'}
              className={`brd-seg ${view === 'daycare' ? 'on' : ''}`}
              onClick={() => setView('daycare')}
            >
              <Sun size={14} /> 데이케어
            </button>
          </div>
        </div>
      </div>

      {/* summary chips */}
      <div className="brd-summary np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="brd-sum-card">
          <span className="brd-sum-ic stay">
            <BedDouble size={17} />
          </span>
          <div className="brd-sum-txt">
            <span className="brd-sum-label">숙박 중</span>
            <span className="brd-sum-val">{stayCount}</span>
          </div>
        </div>
        <div className="brd-sum-card">
          <span className="brd-sum-ic day">
            <Sun size={17} />
          </span>
          <div className="brd-sum-txt">
            <span className="brd-sum-label">데이케어</span>
            <span className="brd-sum-val">{daycareCount}</span>
          </div>
        </div>
        <div className="brd-sum-card">
          <span className="brd-sum-ic free">
            <LayoutGrid size={17} />
          </span>
          <div className="brd-sum-txt">
            <span className="brd-sum-label">빈 케이지</span>
            <span className="brd-sum-val">{cages.length - occupiedTotal}</span>
          </div>
        </div>
        <div className="brd-sum-card brd-sum-rate">
          <div className="brd-sum-txt">
            <span className="brd-sum-label">점유율</span>
            <span className="brd-sum-val">{occRate}%</span>
          </div>
          <div className="brd-bar" aria-hidden="true">
            <div className="brd-bar-fill" style={{ width: `${occRate}%` }} />
          </div>
        </div>
      </div>

      <div className={`brd-layout ${selected ? 'with-side' : ''}`}>
        {/* cage grid */}
        <div className="brd-grid">
          {cages.map((cage, i) => {
            const b = occByCage.get(cage.id)
            const occupied = !!b
            const dimmed = occupied && b ? !matchView(b) : view !== 'all'
            const pet = b ? petById(b.petId) : undefined
            const owner = b ? customerOfPet(b.petId) : undefined
            const isSel = selectedId === cage.id

            return (
              <button
                type="button"
                key={cage.id}
                className={`brd-cage np-card np-an ${occupied ? 'occ' : 'empty'} ${
                  dimmed ? 'dim' : ''
                } ${isSel ? 'sel' : ''} ${b?.daycare ? 'is-day' : ''}`}
                style={{ '--d': `${40 + i * 35}ms` } as React.CSSProperties}
                onClick={() => occupied && setSelectedId(isSel ? null : cage.id)}
                aria-label={`케이지 ${cage.label} ${occupied ? '사용 중' : '비어있음'}`}
                disabled={!occupied}
              >
                <div className="brd-cage-top">
                  <span className="brd-cage-label">{cage.label}</span>
                  <span className="brd-cage-size">{SIZE_LABEL[cage.size]} · {cage.size}</span>
                </div>

                {occupied && b && pet ? (
                  <>
                    <div className="brd-cage-pet">
                      <span className="brd-cage-name">{pet.name}</span>
                      <span className="brd-cage-breed">{pet.breed}</span>
                    </div>
                    <div className="brd-cage-owner">{owner?.name ?? '—'}</div>
                    <div className="brd-cage-period">
                      {b.daycare ? (
                        <span>당일 · {fmtShort(b.checkIn)}</span>
                      ) : (
                        <span>
                          {fmtShort(b.checkIn)} → {fmtShort(b.checkOut)} · {nights(b)}박
                        </span>
                      )}
                    </div>
                    <div className="brd-cage-tags">
                      {b.daycare ? (
                        <span className="np-badge t-accent">데이케어</span>
                      ) : (
                        <span className="np-badge t-good">숙박</span>
                      )}
                    </div>
                    {b.memo && <div className="brd-cage-memo">{b.memo}</div>}
                  </>
                ) : (
                  <div className="brd-cage-free">
                    <span className="brd-cage-freeic">
                      <LayoutGrid size={18} />
                    </span>
                    비어있음
                    <small>예약 가능</small>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* detail panel */}
        {selected && selectedCage && (() => {
          const pet = petById(selected.petId)
          const owner = customerOfPet(selected.petId)
          return (
            <aside className="brd-detail np-card np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
              <div className="brd-detail-head">
                <div>
                  <div className="brd-detail-cage">{selectedCage.label}</div>
                  <div className="brd-detail-sub">
                    {SIZE_LABEL[selectedCage.size]} 케이지 · {selected.daycare ? '데이케어' : '숙박'}
                  </div>
                </div>
                <button
                  type="button"
                  className="np-iconbtn"
                  aria-label="상세 닫기"
                  onClick={() => setSelectedId(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="brd-detail-petname">
                {pet?.name}
                <span className={`np-badge ${selected.daycare ? 't-accent' : 't-good'}`}>
                  {selected.daycare ? '데이케어' : '숙박'}
                </span>
              </div>

              <div className="brd-detail-rows">
                <div className="brd-detail-row">
                  <span className="brd-detail-ic"><Dog size={15} /></span>
                  <span className="brd-detail-k">반려동물</span>
                  <span className="brd-detail-v">
                    {pet?.breed} · {pet?.species} · {pet?.ageY}살 · {pet?.weightKg}kg
                  </span>
                </div>
                <div className="brd-detail-row">
                  <span className="brd-detail-ic"><User size={15} /></span>
                  <span className="brd-detail-k">보호자</span>
                  <span className="brd-detail-v">{owner?.name} · {owner?.phone}</span>
                </div>
                <div className="brd-detail-row">
                  <span className="brd-detail-ic"><CalendarDays size={15} /></span>
                  <span className="brd-detail-k">기간</span>
                  <span className="brd-detail-v">
                    {selected.daycare ? (
                      <>당일 · {fmtShort(selected.checkIn)}</>
                    ) : (
                      <>
                        {fmtShort(selected.checkIn)} → {fmtShort(selected.checkOut)} · {nights(selected)}박
                      </>
                    )}
                  </span>
                </div>
                {selected.memo && (
                  <div className="brd-detail-row">
                    <span className="brd-detail-ic"><StickyNote size={15} /></span>
                    <span className="brd-detail-k">메모</span>
                    <span className="brd-detail-v">{selected.memo}</span>
                  </div>
                )}
                {pet && pet.allergies.length > 0 && (
                  <div className="brd-detail-row">
                    <span className="brd-detail-ic"><StickyNote size={15} /></span>
                    <span className="brd-detail-k">알레르기</span>
                    <span className="brd-detail-v">{pet.allergies.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="brd-detail-actions">
                <button
                  type="button"
                  className="np-btn np-btn-primary brd-co"
                  onClick={() => {
                    checkOutBoarding(selected.id)
                    setSelectedId(null)
                  }}
                >
                  <LogOut size={16} /> 체크아웃
                </button>
              </div>
            </aside>
          )
        })()}
      </div>
    </div>
  )
}
