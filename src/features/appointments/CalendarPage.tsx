import type * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, CalendarCheck } from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  useData,
  STORE,
  STATUS_META,
  DEMO_TODAY,
  serviceById,
  staffById,
  petById,
  customerOfPet,
  endTime,
  type Appt,
  type ApptStatus,
  type StaffMember,
  type Service,
  type Pet,
} from '@/stores/data'
import '../feature.css'
import './appointments.css'

type ViewMode = 'day' | 'week'

const PX_PER_HOUR = 64
const PX_PER_MIN = PX_PER_HOUR / 60

/** 'HH:MM' -> minutes since midnight */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Date -> 'YYYY-MM-DD' (local, matches APPTS.date) */
function ymd(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** 'YYYY-MM-DD' -> Date at local midnight (no TZ drift) */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const OPEN_MIN = toMin(STORE.open) // 600
const CLOSE_MIN = toMin(STORE.close) // 1200
const HOURS: number[] = []
for (let h = OPEN_MIN / 60; h <= CLOSE_MIN / 60; h++) HOURS.push(h)
const GRID_HEIGHT = ((CLOSE_MIN - OPEN_MIN) / 60) * PX_PER_HOUR

/** Status transitions offered on a block, in workflow order. */
const STATUS_FLOW: ApptStatus[] = ['confirmed', 'checked_in', 'done']

export function CalendarPage() {
  // reactive data — derived lists re-render when these change
  const appts = useData((s) => s.appts)
  const staff = useData((s) => s.staff)
  const services = useData((s) => s.services)
  const pets = useData((s) => s.pets)
  // subscribe so no-show hint (owner score) re-renders after markNoShow
  useData((s) => s.customers)

  const addAppt = useData((s) => s.addAppt)
  const updateApptStatus = useData((s) => s.updateApptStatus)
  const markNoShow = useData((s) => s.markNoShow)
  const cancelAppt = useData((s) => s.cancelAppt)

  const [view, setView] = useState<ViewMode>('day')
  const [anchor, setAnchor] = useState<Date>(() => parseYmd(DEMO_TODAY))
  const [showForm, setShowForm] = useState(false)
  const [formSeed, setFormSeed] = useState<{ staffId: string; start: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // keyboard ← → navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') setAnchor((d) => addDays(d, view === 'day' ? -1 : -7))
      else if (e.key === 'ArrowRight') setAnchor((d) => addDays(d, view === 'day' ? 1 : 7))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const dayStr = ymd(anchor)
  const dayAppts = useMemo(
    () => appts.filter((a) => a.date === dayStr).sort((x, y) => x.start.localeCompare(y.start)),
    [appts, dayStr],
  )

  // Mon–Sat columns for week view
  const weekDays = useMemo(() => {
    const mon = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 6 }, (_, i) => addDays(mon, i))
  }, [anchor])

  function go(dir: -1 | 1) {
    setAnchor((d) => addDays(d, view === 'day' ? dir : dir * 7))
  }
  function goToday() {
    setAnchor(parseYmd(DEMO_TODAY))
  }

  function openForm(seed?: { staffId: string; start: string }) {
    setFormSeed(seed ?? null)
    setShowForm(true)
  }

  function handleSave(input: {
    petId: string
    staffId: string
    serviceId: string
    start: string
    durationMin: number
    deposit: number
  }) {
    addAppt({
      date: dayStr,
      start: input.start,
      durationMin: input.durationMin,
      petId: input.petId,
      staffId: input.staffId,
      serviceId: input.serviceId,
      deposit: input.deposit,
    })
    setShowForm(false)
    setFormSeed(null)
    setToast('새 예약이 추가되었습니다')
    if (view === 'week') setAnchor(parseYmd(dayStr))
  }

  const headLabel =
    view === 'day'
      ? format(anchor, 'M월 d일 (EEE)', { locale: ko })
      : `${format(weekDays[0], 'M월 d일', { locale: ko })} – ${format(weekDays[5], 'd일', { locale: ko })}`

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">예약 캘린더</div>
          <div className="feat-sub">
            {STORE.name} · 영업 {STORE.open}–{STORE.close} · 일요일 휴무
          </div>
        </div>
        <div className="feat-actions">
          <button type="button" className="np-btn np-btn-primary" onClick={() => openForm()}>
            <Plus size={16} /> 새 예약
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button
            type="button"
            className="np-iconbtn"
            aria-label={view === 'day' ? '이전 날' : '이전 주'}
            onClick={() => go(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="np-btn" onClick={goToday}>
            오늘
          </button>
          <button
            type="button"
            className="np-iconbtn"
            aria-label={view === 'day' ? '다음 날' : '다음 주'}
            onClick={() => go(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="cal-today-label">
          {headLabel}
          {view === 'day' && dayStr === DEMO_TODAY && <small>오늘</small>}
        </div>

        <div className="cal-seg" role="tablist" aria-label="보기 전환">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'day'}
            className={view === 'day' ? 'is-on' : ''}
            onClick={() => setView('day')}
          >
            일
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'week'}
            className={view === 'week' ? 'is-on' : ''}
            onClick={() => setView('week')}
          >
            주
          </button>
        </div>

        <div className="cal-legend">
          {staff.map((s) => (
            <span key={s.id}>
              <i style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* inline new-appt form */}
      {showForm && (
        <ApptForm
          seed={formSeed}
          pets={pets}
          staff={staff}
          services={services}
          onCancel={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      {view === 'day' ? (
        <DayView
          appts={dayAppts}
          staff={staff}
          onSlot={openForm}
          onStatus={updateApptStatus}
          onNoShow={markNoShow}
          onCancel={cancelAppt}
        />
      ) : (
        <WeekView days={weekDays} appts={appts} onCardClick={() => openForm()} />
      )}

      {toast && (
        <div className="cal-toast" role="status">
          <CalendarCheck size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------------- Day view ---------------- */

function DayView({
  appts,
  staff,
  onSlot,
  onStatus,
  onNoShow,
  onCancel,
}: {
  appts: Appt[]
  staff: StaffMember[]
  onSlot: (seed: { staffId: string; start: string }) => void
  onStatus: (id: string, status: ApptStatus) => void
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
}) {
  // id of the appointment whose status popover is open
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section
      className="np-card cal-day np-an"
      style={
        {
          '--cal-gutter': '56px',
          '--cal-lanes': staff.length,
        } as React.CSSProperties
      }
    >
      {/* lane headers */}
      <div className="cal-day-head">
        <div className="cal-day-head-gutter" />
        {staff.map((s) => {
          const n = appts.filter((a) => a.staffId === s.id && a.status !== 'cancelled').length
          return (
            <div className="cal-lane-head" key={s.id}>
              <span className="cal-lane-dot" style={{ background: s.color }} />
              {s.name}
              <small>{n}건</small>
            </div>
          )
        })}
      </div>

      {/* grid body */}
      <div className="cal-day-body" style={{ height: GRID_HEIGHT }}>
        {/* time gutter with hour labels */}
        <div className="cal-gutter">
          {HOURS.map((h, i) => (
            <span
              key={h}
              className="cal-hour-label"
              style={{ top: i * PX_PER_HOUR }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* one lane per staff */}
        {staff.map((s) => {
          const laneAppts = appts.filter((a) => a.staffId === s.id)
          return (
            <div className="cal-lane" key={s.id}>
              {/* hour grid + half lines + clickable slots */}
              {HOURS.slice(0, -1).map((h, i) => (
                <div key={h}>
                  <div className="cal-hourline" style={{ top: i * PX_PER_HOUR }} />
                  <div
                    className="cal-hourline half"
                    style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                  />
                  <button
                    type="button"
                    className="cal-slot"
                    style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}
                    aria-label={`${s.name} ${String(h).padStart(2, '0')}:00 새 예약`}
                    onClick={() =>
                      onSlot({ staffId: s.id, start: `${String(h).padStart(2, '0')}:00` })
                    }
                  />
                </div>
              ))}
              {/* final hour line at bottom */}
              <div className="cal-hourline" style={{ top: GRID_HEIGHT }} />

              {/* appointment blocks */}
              {laneAppts.map((a) => (
                <ApptBlock
                  key={a.id}
                  appt={a}
                  open={openId === a.id}
                  onToggle={() => setOpenId((cur) => (cur === a.id ? null : a.id))}
                  onClose={() => setOpenId(null)}
                  onStatus={onStatus}
                  onNoShow={onNoShow}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )
        })}

        {appts.length === 0 && (
          <div className="cal-empty" style={{ position: 'absolute', inset: 0 }}>
            <span>이 날짜에는 예약이 없습니다.</span>
            <span style={{ fontSize: 12 }}>빈 시간대를 클릭해 새 예약을 추가하세요.</span>
          </div>
        )}
      </div>
    </section>
  )
}

function ApptBlock({
  appt,
  open,
  onToggle,
  onClose,
  onStatus,
  onNoShow,
  onCancel,
}: {
  appt: Appt
  open: boolean
  onToggle: () => void
  onClose: () => void
  onStatus: (id: string, status: ApptStatus) => void
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
}) {
  const pet = petById(appt.petId)
  const owner = customerOfPet(appt.petId)
  const svc = serviceById(appt.serviceId)
  const meta = STATUS_META[appt.status]
  const start = toMin(appt.start)
  const top = (start - OPEN_MIN) * PX_PER_MIN
  const height = appt.durationMin * PX_PER_MIN
  const isShort = appt.durationMin <= 40
  const toneVar = `var(--${meta.tone === 'muted' ? 'tx3' : meta.tone})`
  const terminal = appt.status === 'cancelled' || appt.status === 'no_show'

  return (
    <div
      className={`cal-block${isShort ? ' is-short' : ''}${appt.status === 'cancelled' ? ' is-cancelled' : ''}${open ? ' is-open' : ''}`}
      style={
        {
          top,
          height: Math.max(height - 4, 22),
          '--block-tone': toneVar,
        } as React.CSSProperties
      }
      title={`${pet?.name ?? ''} · ${svc?.name ?? ''} · ${appt.start}~${endTime(appt.start, appt.durationMin)} · ${owner?.name ?? ''}`}
      onClick={onToggle}
    >
      <div className="cal-block-top">
        <span className="cal-block-pet">
          {pet?.name}
          {!isShort && <em>{pet?.breed}</em>}
        </span>
        <span className={`np-badge t-${meta.tone}`}>{meta.label}</span>
      </div>
      <span className="cal-block-svc">
        {svc?.name} · {owner?.name}
      </span>
      <span className="cal-block-time">
        {appt.start}~{endTime(appt.start, appt.durationMin)} · {appt.durationMin}분
      </span>

      {open && (
        <div className="cal-pop" role="menu" onClick={(e) => e.stopPropagation()}>
          <div className="cal-pop-head">
            <span>{pet?.name} · 상태 변경</span>
            <button type="button" className="np-iconbtn" aria-label="닫기" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
          <div className="cal-pop-body">
            {STATUS_FLOW.map((st) => (
              <button
                key={st}
                type="button"
                className={`cal-pop-item${appt.status === st ? ' is-on' : ''}`}
                disabled={terminal}
                onClick={() => {
                  onStatus(appt.id, st)
                  onClose()
                }}
              >
                {STATUS_META[st].label}
              </button>
            ))}
            <button
              type="button"
              className="cal-pop-item t-alert"
              disabled={terminal}
              onClick={() => {
                onNoShow(appt.id)
                onClose()
              }}
            >
              노쇼
            </button>
            <button
              type="button"
              className="cal-pop-item t-muted"
              disabled={appt.status === 'cancelled'}
              onClick={() => {
                onCancel(appt.id)
                onClose()
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Week view ---------------- */

function WeekView({
  days,
  appts,
  onCardClick,
}: {
  days: Date[]
  appts: Appt[]
  onCardClick: () => void
}) {
  return (
    <div className="cal-week">
      {days.map((d, i) => {
        const ds = ymd(d)
        const dayAppts = appts
          .filter((a) => a.date === ds)
          .sort((x, y) => x.start.localeCompare(y.start))
        const isToday = ds === DEMO_TODAY
        return (
          <section
            className="np-card cal-wcol np-an"
            key={ds}
            style={{ '--d': `${i * 40}ms` } as React.CSSProperties}
          >
            <div className={`cal-wcol-head${isToday ? ' is-today' : ''}`}>
              <div>
                <div className="cal-wcol-dow">{format(d, 'EEE', { locale: ko })}</div>
                <div className="cal-wcol-count">{dayAppts.length}건</div>
              </div>
              <div className="cal-wcol-date">{format(d, 'd')}</div>
            </div>
            <div className="cal-wcol-body">
              {dayAppts.length === 0 ? (
                <div className="cal-wcol-empty">예약 없음</div>
              ) : (
                dayAppts.map((a) => <WeekCard key={a.id} appt={a} onClick={onCardClick} />)
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function WeekCard({ appt, onClick }: { appt: Appt; onClick: () => void }) {
  const pet = petById(appt.petId)
  const svc = serviceById(appt.serviceId)
  const staff = staffById(appt.staffId)
  const meta = STATUS_META[appt.status]
  const toneVar = `var(--${meta.tone === 'muted' ? 'tx3' : meta.tone})`

  return (
    <button
      type="button"
      className="cal-wcard"
      style={{ '--block-tone': toneVar } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="cal-wcard-top">
        <span className="cal-wcard-time">{appt.start}</span>
        <span className={`np-badge t-${meta.tone}`}>{meta.label}</span>
      </div>
      <div className="cal-wcard-pet">
        {pet?.name} <span style={{ color: 'var(--tx3)', fontWeight: 500 }}>{pet?.breed}</span>
      </div>
      <div className="cal-wcard-meta">
        <span className="cal-wcard-dot" style={{ background: staff?.color }} />
        {staff?.name} · {svc?.name}
      </div>
    </button>
  )
}

/* ---------------- inline new-appt form ---------------- */

function ApptForm({
  seed,
  pets,
  staff,
  services,
  onCancel,
  onSave,
}: {
  seed: { staffId: string; start: string } | null
  pets: Pet[]
  staff: StaffMember[]
  services: Service[]
  onCancel: () => void
  onSave: (input: {
    petId: string
    staffId: string
    serviceId: string
    start: string
    durationMin: number
    deposit: number
  }) => void
}) {
  const [petId, setPetId] = useState(pets[0]?.id ?? '')
  const [staffId, setStaffId] = useState(seed?.staffId ?? staff[0]?.id ?? '')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [start, setStart] = useState(seed?.start ?? STORE.open)

  // owner risk → recommend a deposit
  const owner = customerOfPet(petId)
  const risky = (owner?.noShowScore ?? 0) >= 2
  const [deposit, setDeposit] = useState<number>(risky ? 20000 : 0)
  // when the selected pet changes to a risky owner, suggest a default deposit
  const [touchedDeposit, setTouchedDeposit] = useState(false)
  useEffect(() => {
    if (touchedDeposit) return
    setDeposit(risky ? 20000 : 0)
  }, [risky, touchedDeposit])

  const svc = services.find((s) => s.id === serviceId)
  const durationMin = svc?.durationMin ?? 60

  function submit() {
    if (!petId || !staffId || !serviceId) return
    onSave({ petId, staffId, serviceId, start, durationMin, deposit })
  }

  return (
    <section className="np-card cal-form" aria-label="새 예약 추가">
      <div className="cal-form-head">
        <span className="cal-form-title">새 예약</span>
        <button type="button" className="np-iconbtn" aria-label="닫기" onClick={onCancel}>
          <X size={16} />
        </button>
      </div>
      <div className="cal-form-grid">
        <div className="cal-field">
          <label htmlFor="cal-pet">반려동물</label>
          <select
            id="cal-pet"
            className="np-input"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
          >
            {pets.map((p) => {
              const o = customerOfPet(p.id)
              return (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.breed} ({o?.name})
                </option>
              )
            })}
          </select>
        </div>
        <div className="cal-field">
          <label htmlFor="cal-staff">담당 직원</label>
          <select
            id="cal-staff"
            className="np-input"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="cal-field">
          <label htmlFor="cal-svc">서비스</label>
          <select
            id="cal-svc"
            className="np-input"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((sv) => (
              <option key={sv.id} value={sv.id}>
                {sv.name} · {sv.durationMin}분
              </option>
            ))}
          </select>
        </div>
        <div className="cal-field">
          <label htmlFor="cal-start">시작 시간</label>
          <input
            id="cal-start"
            type="time"
            className="np-input"
            value={start}
            min={STORE.open}
            max={STORE.close}
            step={600}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="cal-field">
          <label htmlFor="cal-deposit">보증금 (원)</label>
          <input
            id="cal-deposit"
            type="number"
            className="np-input"
            value={deposit}
            min={0}
            step={5000}
            onChange={(e) => {
              setTouchedDeposit(true)
              setDeposit(Number(e.target.value) || 0)
            }}
          />
          {risky && (
            <span className="cal-hint">
              노쇼 이력 (점수 {owner?.noShowScore}) — 보증금 권장
            </span>
          )}
        </div>
      </div>
      <div className="cal-form-foot">
        <button type="button" className="np-btn" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="np-btn np-btn-primary" onClick={submit}>
          <Plus size={16} /> 예약 추가
        </button>
      </div>
    </section>
  )
}
