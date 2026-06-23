import type * as React from 'react'
import { useState } from 'react'
import {
  Store,
  Scissors,
  CalendarClock,
  ShoppingBag,
  Plus,
  Pencil,
  ShieldCheck,
  Save,
  Check,
  X,
} from 'lucide-react'
import { useData, STORE, type ServiceCategory } from '@/stores/data'
import { fmtMoney } from '@/lib/date'
import '../feature.css'
import './settings.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const CATEGORIES: readonly ServiceCategory[] = ['미용', '목욕', '호텔', '데이케어']

const CATEGORY_TONE: Record<ServiceCategory, string> = {
  미용: 't-accent',
  목욕: 't-good',
  호텔: 't-warn',
  데이케어: 't-muted',
}

interface DummyProduct {
  id: string
  cat: string
  tone: string
  name: string
  desc: string
  price: number
  cycle: string
}

const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    id: 'd1',
    cat: '사료',
    tone: 't-good',
    name: '연령 맞춤 건식사료 2kg',
    desc: '나이·체중 기록을 바탕으로 추천하는 식품',
    price: 38000,
    cycle: '4주',
  },
  {
    id: 'd2',
    cat: '영양제',
    tone: 't-accent',
    name: '관절 케어 보조제',
    desc: '식품 유형 보조제 · 정기 배송',
    price: 24000,
    cycle: '4주',
  },
  {
    id: 'd3',
    cat: '간식',
    tone: 't-warn',
    name: '저알러지 트릿 세트',
    desc: '알러지 기록 반영 식품 간식',
    price: 16000,
    cycle: '6주',
  },
]

export function SettingsPage() {
  const [commerceOn, setCommerceOn] = useState(false)

  const services = useData((s) => s.services)
  const addService = useData((s) => s.addService)
  const updateService = useData((s) => s.updateService)

  // inline add-service form
  const [adding, setAdding] = useState(false)
  const [draftCat, setDraftCat] = useState<ServiceCategory>('미용')
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftDur, setDraftDur] = useState('')

  const resetDraft = () => {
    setDraftCat('미용')
    setDraftName('')
    setDraftPrice('')
    setDraftDur('')
  }
  const submitAdd = () => {
    const name = draftName.trim()
    const price = Number(draftPrice)
    const durationMin = Number(draftDur)
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(durationMin) || durationMin <= 0) return
    addService({ category: draftCat, name, price, durationMin })
    resetDraft()
    setAdding(false)
  }

  // inline row edit (name + price)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const startEdit = (id: string, name: string, price: number) => {
    setEditId(id)
    setEditName(name)
    setEditPrice(String(price))
  }
  const submitEdit = () => {
    if (!editId) return
    const name = editName.trim()
    const price = Number(editPrice)
    if (!name || !Number.isFinite(price) || price < 0) return
    updateService(editId, { name, price })
    setEditId(null)
  }

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">설정</div>
          <div className="feat-sub">매장 정보 · 서비스 카탈로그 · 영업시간 · 커머스 베타</div>
        </div>
        <div className="feat-actions">
          <button type="button" className="np-btn np-btn-primary">
            <Save size={16} /> 변경사항 저장
          </button>
        </div>
      </div>

      <div className="set-wrap">
        {/* 1) 매장 정보 */}
        <section className="np-card set-sec np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
          <div className="set-sec-head">
            <span className="set-sec-ic">
              <Store size={18} />
            </span>
            <div>
              <div className="set-sec-tt">매장 정보</div>
              <div className="set-sec-sub">고객 안내·알림에 표시되는 기본 정보</div>
            </div>
          </div>
          <div className="set-sec-body">
            <div className="set-fields">
              <div className="set-field set-col-2">
                <label className="set-label" htmlFor="set-name">
                  매장명
                </label>
                <input id="set-name" className="np-input" defaultValue={STORE.name} />
              </div>
              <div className="set-field">
                <label className="set-label" htmlFor="set-type">
                  업종
                </label>
                <input id="set-type" className="np-input" defaultValue={STORE.type} />
              </div>
              <div className="set-field">
                <span className="set-label">정기 휴무</span>
                <div className="set-time-row">
                  {STORE.closedWeekdays.map((wd) => (
                    <span key={wd} className="np-chip">
                      매주 {WEEKDAYS[wd]}요일
                    </span>
                  ))}
                </div>
              </div>
              <div className="set-field set-col-2">
                <span className="set-label">영업시간</span>
                <div className="set-time-row">
                  <input className="np-input" defaultValue={STORE.open} aria-label="영업 시작 시간" />
                  <span className="set-time-sep">~</span>
                  <input className="np-input" defaultValue={STORE.close} aria-label="영업 종료 시간" />
                  <span className="set-hint">상세 요일별 시간은 아래에서 관리합니다.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2) 서비스 카탈로그 */}
        <section className="np-card set-sec np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
          <div className="set-sec-head">
            <span className="set-sec-ic">
              <Scissors size={18} />
            </span>
            <div>
              <div className="set-sec-tt">서비스 카탈로그</div>
              <div className="set-sec-sub">예약·결제에 쓰이는 서비스 {services.length}종</div>
            </div>
            <div className="set-sec-act">
              <button
                type="button"
                className="np-btn"
                onClick={() => {
                  resetDraft()
                  setAdding((v) => !v)
                }}
              >
                <Plus size={15} /> 서비스 추가
              </button>
            </div>
          </div>
          <div className="set-sec-body">
            <table className="set-table">
              <thead>
                <tr>
                  <th>분류</th>
                  <th>이름</th>
                  <th className="set-num">가격</th>
                  <th className="set-num">소요시간</th>
                  <th aria-label="작업" />
                </tr>
              </thead>
              <tbody>
                {adding && (
                  <tr className="set-add-row">
                    <td>
                      <select
                        className="np-input set-add-cat"
                        value={draftCat}
                        onChange={(e) => setDraftCat(e.target.value as ServiceCategory)}
                        aria-label="새 서비스 분류"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="np-input"
                        placeholder="서비스 이름"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        aria-label="새 서비스 이름"
                      />
                    </td>
                    <td className="set-num">
                      <input
                        className="np-input set-add-num"
                        type="number"
                        min={0}
                        placeholder="가격"
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        aria-label="새 서비스 가격"
                      />
                    </td>
                    <td className="set-num">
                      <input
                        className="np-input set-add-num"
                        type="number"
                        min={1}
                        placeholder="분"
                        value={draftDur}
                        onChange={(e) => setDraftDur(e.target.value)}
                        aria-label="새 서비스 소요시간(분)"
                      />
                    </td>
                    <td className="set-row-act">
                      <button
                        type="button"
                        className="np-iconbtn"
                        aria-label="새 서비스 저장"
                        onClick={submitAdd}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        className="np-iconbtn"
                        aria-label="추가 취소"
                        onClick={() => {
                          resetDraft()
                          setAdding(false)
                        }}
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                )}
                {services.map((sv) => {
                  const editing = editId === sv.id
                  return (
                    <tr key={sv.id}>
                      <td>
                        <span className={`np-badge ${CATEGORY_TONE[sv.category]}`}>{sv.category}</span>
                      </td>
                      {editing ? (
                        <>
                          <td>
                            <input
                              className="np-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              aria-label={`${sv.name} 이름`}
                            />
                          </td>
                          <td className="set-num">
                            <input
                              className="np-input set-add-num"
                              type="number"
                              min={0}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              aria-label={`${sv.name} 가격`}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="set-sv-name">{sv.name}</td>
                          <td className="set-num">{fmtMoney(sv.price)}</td>
                        </>
                      )}
                      <td className="set-num">{sv.durationMin}분</td>
                      <td className="set-row-act">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="np-iconbtn"
                              aria-label={`${sv.name} 저장`}
                              onClick={submitEdit}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              className="np-iconbtn"
                              aria-label="수정 취소"
                              onClick={() => setEditId(null)}
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="np-iconbtn"
                            aria-label={`${sv.name} 수정`}
                            onClick={() => startEdit(sv.id, sv.name, sv.price)}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3) 영업시간 / 휴무 */}
        <section className="np-card set-sec np-an" style={{ '--d': '120ms' } as React.CSSProperties}>
          <div className="set-sec-head">
            <span className="set-sec-ic">
              <CalendarClock size={18} />
            </span>
            <div>
              <div className="set-sec-tt">영업시간 · 휴무</div>
              <div className="set-sec-sub">요일별 영업 여부와 운영 시간</div>
            </div>
          </div>
          <div className="set-sec-body">
            <div className="set-days">
              {WEEKDAYS.map((label, wd) => {
                const closed = (STORE.closedWeekdays as readonly number[]).includes(wd)
                return (
                  <div
                    key={wd}
                    className={`set-day-row${closed ? ' set-closed' : ''}`}
                  >
                    <div className="set-day-name">
                      {label}요일
                      {(wd === 0 || wd === 6) && <small>주말</small>}
                    </div>
                    <div className={`set-day-hours${closed ? ' set-off' : ''}`}>
                      {closed ? '휴무' : `${STORE.open} ~ ${STORE.close}`}
                    </div>
                    <DayToggle defaultOpen={!closed} weekday={label} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 4) #3 커머스 피처 플래그 */}
        <section className="np-card set-sec np-an" style={{ '--d': '180ms' } as React.CSSProperties}>
          <div className="set-sec-head">
            <span className="set-sec-ic">
              <ShoppingBag size={18} />
            </span>
            <div>
              <div className="set-sec-tt">커머스 (베타)</div>
              <div className="set-sec-sub">사료·영양제 정기구독 레이어</div>
            </div>
            <div className="set-sec-act">
              <span className={`np-badge ${commerceOn ? 't-good' : 't-muted'}`}>
                {commerceOn ? '활성' : '비활성'}
              </span>
            </div>
          </div>
          <div className="set-sec-body">
            <div className="set-flag-head">
              <div className="set-flag-txt">
                <div className="set-flag-title">사료·영양제 정기구독 레이어 — 베타</div>
                <p className="set-flag-desc">
                  컨디션 기반 사료·영양제 정기구독 기능입니다. 식품·보조제만 취급하며, 기본값은 꺼짐
                  상태입니다. 켜면 아래에 상품·구독 구성이 나타납니다.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={commerceOn}
                aria-label="커머스 베타 기능 켜기/끄기"
                className="set-switch"
                onClick={() => setCommerceOn((v) => !v)}
              />
            </div>

            {commerceOn && (
              <div className="set-commerce">
                <div className="set-commerce-lead">
                  컨디션 기반 사료·영양제 정기구독 (식품·보조제만)
                </div>
                <p className="set-flag-desc" style={{ marginTop: 6 }}>
                  나이·체중·알러지 기록을 바탕으로 식품과 보조제를 추천·정기 배송하는 구성입니다.
                  아래 카드는 구성 예시 placeholder 입니다.
                </p>
                <div className="set-commerce-note">
                  <ShieldCheck size={15} /> 의약품은 취급하지 않습니다. 식품(사료·간식)과
                  보조제(영양제)만 노출됩니다.
                </div>

                <div className="set-prod-grid">
                  {DUMMY_PRODUCTS.map((p) => (
                    <div className="set-prod" key={p.id}>
                      <span className={`np-badge ${p.tone} set-prod-cat`}>{p.cat}</span>
                      <div className="set-prod-name">{p.name}</div>
                      <div className="set-prod-desc">{p.desc}</div>
                      <div className="set-prod-foot">
                        <span className="set-prod-price">
                          {fmtMoney(p.price)} <small>/ {p.cycle}</small>
                        </span>
                        <button type="button" className="np-btn" disabled>
                          구성 예시
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function DayToggle({ defaultOpen, weekday }: { defaultOpen: boolean; weekday: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={`${weekday}요일 영업 여부`}
      className="set-switch"
      onClick={() => setOpen((v) => !v)}
    />
  )
}
