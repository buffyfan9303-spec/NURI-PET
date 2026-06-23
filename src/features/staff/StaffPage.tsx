import type * as React from 'react'
import { useEffect, useState } from 'react'
import { UserPlus, ShieldCheck, Crown, User, Info } from 'lucide-react'
import {
  useData,
  STATUS_META,
  serviceById,
  petById,
  customerOfPet,
  endTime,
  DEMO_TODAY,
  type StaffMember,
  type Appt,
} from '@/stores/data'
import { fmtMoney } from '@/lib/date'
import './staff.css'

/* The seeded operator week — Mon 06-22 … Sat 06-27. 06-24 is "today". */
const WEEK_DAYS = [
  { date: '2026-06-22', label: '월', dom: 22 },
  { date: '2026-06-23', label: '화', dom: 23 },
  { date: '2026-06-24', label: '수', dom: 24 },
  { date: '2026-06-25', label: '목', dom: 25 },
  { date: '2026-06-26', label: '금', dom: 26 },
  { date: '2026-06-27', label: '토', dom: 27 },
]

const ROLE_META: Record<
  StaffMember['role'],
  { label: string; tone: 'accent' | 'muted'; Icon: typeof Crown }
> = {
  owner: { label: '대표 (owner)', tone: 'accent', Icon: Crown },
  staff: { label: '직원 (staff)', tone: 'muted', Icon: User },
}

interface StaffStats {
  weekCount: number
  doneCount: number
  commission: number
  revenue: number
}

function statsFor(appts: Appt[], member: StaffMember): StaffStats {
  const week = appts.filter(
    (a) => a.staffId === member.id && a.date >= WEEK_DAYS[0].date && a.date <= WEEK_DAYS[5].date,
  )
  const rate = member.commissionRate ?? 0
  let commission = 0
  let revenue = 0
  let doneCount = 0
  for (const a of week) {
    if (a.status === 'done') {
      const price = serviceById(a.serviceId)?.price ?? 0
      revenue += price
      commission += Math.round(price * rate)
      doneCount += 1
    }
  }
  return { weekCount: week.length, doneCount, commission, revenue }
}

function countOn(appts: Appt[], staffId: string, date: string): Appt[] {
  return appts.filter((a) => a.staffId === staffId && a.date === date).sort((x, y) =>
    x.start.localeCompare(y.start),
  )
}

function initial(name: string): string {
  return name.slice(0, 1)
}

export function StaffPage() {
  // Reactive subscriptions — week counts & commission recompute when appts change.
  const staffList = useData((s) => s.staff)
  const appts = useData((s) => s.appts)
  const services = useData((s) => s.services)

  const [selected, setSelected] = useState<string>('')
  useEffect(() => {
    if (staffList.length > 0 && !staffList.some((s) => s.id === selected)) setSelected(staffList[0].id)
  }, [staffList, selected])
  const selectedStaff = staffList.find((s) => s.id === selected) ?? staffList[0]

  // grid totals per day across all staff
  const dayTotals = WEEK_DAYS.map((d) => appts.filter((a) => a.date === d.date).length)
  const todayTimeline = countOn(appts, selected, DEMO_TODAY)

  if (staffList.length === 0) {
    return (
      <div className="feat-ph">
        <p>직원 정보를 불러오는 중…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">직원</div>
          <div className="feat-sub">
            팀원 {staffList.length}명 · 이번 주 (6월 22일~27일) 담당 예약 {appts.filter((a) => a.date >= WEEK_DAYS[0].date && a.date <= WEEK_DAYS[5].date).length}건
          </div>
        </div>
        <div className="feat-actions">
          <button type="button" className="np-btn">
            <ShieldCheck size={16} /> 권한 설정
          </button>
          <button type="button" className="np-btn np-btn-primary">
            <UserPlus size={16} /> 직원 추가
          </button>
        </div>
      </div>

      {/* Staff cards */}
      <div className="stf-cards">
        {staffList.map((s, i) => {
          const st = statsFor(appts, s)
          const role = ROLE_META[s.role]
          const active = s.id === selected
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => setSelected(s.id)}
              aria-pressed={active}
              aria-label={`${s.name} 선택`}
              className={`np-card stf-card np-an${active ? ' is-active' : ''}`}
              style={{ '--d': `${i * 50}ms` } as React.CSSProperties}
            >
              <div className="stf-card-top">
                <span className="stf-avatar" style={{ background: s.color }} aria-hidden>
                  {initial(s.name)}
                </span>
                <div className="stf-id">
                  <div className="stf-name">{s.name}</div>
                  <span className={`np-badge t-${role.tone}`}>
                    <role.Icon size={11} /> {role.label}
                  </span>
                </div>
              </div>

              <div className="stf-metrics">
                <div className="stf-metric">
                  <span className="stf-metric-l">이번 주 담당</span>
                  <span className="stf-metric-v">{st.weekCount}건</span>
                </div>
                <div className="stf-metric">
                  <span className="stf-metric-l">커미션율</span>
                  <span className="stf-metric-v">
                    {s.role === 'owner' ? '—' : `${Math.round(s.commissionRate * 100)}%`}
                  </span>
                </div>
                <div className="stf-metric">
                  <span className="stf-metric-l">추정 커미션</span>
                  <span className="stf-metric-v accent">
                    {s.role === 'owner' ? '—' : fmtMoney(st.commission)}
                  </span>
                </div>
              </div>

              <div className="stf-card-foot">
                완료 {st.doneCount}건 · 매출 {fmtMoney(st.revenue)}
                {s.role === 'owner' && <span className="stf-foot-note">대표 — 커미션 미적용</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="stf-grid">
        {/* Weekly schedule matrix */}
        <section className="np-card np-an" style={{ '--d': '180ms' } as React.CSSProperties}>
          <div className="stf-sec-head">
            <span className="stf-sec-title">주간 스케줄</span>
            <span className="stf-sec-sub">셀 숫자 = 담당 예약 수</span>
          </div>
          <div className="stf-matrix" role="table" aria-label="직원별 주간 담당 예약 수">
            <div className="stf-mrow stf-mhead" role="row">
              <span className="stf-mcell stf-mname" role="columnheader">
                직원
              </span>
              {WEEK_DAYS.map((d) => (
                <span
                  key={d.date}
                  role="columnheader"
                  className={`stf-mcell stf-mday${d.date === DEMO_TODAY ? ' is-today' : ''}`}
                >
                  {d.label}
                  <small>{d.dom}</small>
                </span>
              ))}
              <span className="stf-mcell stf-mtot" role="columnheader">
                합계
              </span>
            </div>
            {staffList.map((s) => {
              const rowCounts = WEEK_DAYS.map((d) => countOn(appts, s.id, d.date).length)
              const rowTotal = rowCounts.reduce((a, b) => a + b, 0)
              return (
                <div className="stf-mrow" role="row" key={s.id}>
                  <span className="stf-mcell stf-mname" role="cell">
                    <i className="stf-dot" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  {rowCounts.map((n, idx) => (
                    <span
                      key={WEEK_DAYS[idx].date}
                      role="cell"
                      className={`stf-mcell stf-mnum${n === 0 ? ' is-empty' : ''}${
                        WEEK_DAYS[idx].date === DEMO_TODAY ? ' is-today' : ''
                      }`}
                    >
                      {n > 0 ? (
                        <span
                          className="stf-load"
                          style={{ background: s.color, opacity: 0.18 + Math.min(n, 4) * 0.16 }}
                          aria-hidden
                        />
                      ) : null}
                      <em>{n > 0 ? n : ''}</em>
                    </span>
                  ))}
                  <span className="stf-mcell stf-mtot" role="cell">
                    {rowTotal}
                  </span>
                </div>
              )
            })}
            <div className="stf-mrow stf-mfoot" role="row">
              <span className="stf-mcell stf-mname" role="cell">
                일별 합계
              </span>
              {dayTotals.map((n, idx) => (
                <span
                  key={WEEK_DAYS[idx].date}
                  role="cell"
                  className={`stf-mcell stf-mnum${WEEK_DAYS[idx].date === DEMO_TODAY ? ' is-today' : ''}`}
                >
                  <em>{n}</em>
                </span>
              ))}
              <span className="stf-mcell stf-mtot" role="cell">
                {dayTotals.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
        </section>

        {/* Today timeline for selected staff */}
        <section className="np-card np-an" style={{ '--d': '220ms' } as React.CSSProperties}>
          <div className="stf-sec-head">
            <span className="stf-sec-title">
              <span className="stf-mini-dot" style={{ background: selectedStaff.color }} />
              {selectedStaff.name} · 오늘 담당
            </span>
            <span className="stf-sec-sub">{todayTimeline.length}건</span>
          </div>
          {todayTimeline.length === 0 ? (
            <div className="stf-empty">오늘 담당 예약이 없습니다.</div>
          ) : (
            <div className="stf-tl">
              {todayTimeline.map((a) => {
                const pet = petById(a.petId)
                const owner = customerOfPet(a.petId)
                const svc = serviceById(a.serviceId)
                const meta = STATUS_META[a.status]
                return (
                  <div className="stf-tl-row" key={a.id}>
                    <div className="stf-tl-time">
                      {a.start}
                      <small>~ {endTime(a.start, a.durationMin)}</small>
                    </div>
                    <div className="stf-tl-main">
                      <div className="stf-tl-pet">
                        {pet?.name}
                        <em>{pet?.breed}</em>
                      </div>
                      <div className="stf-tl-meta">
                        {svc?.name} · {owner?.name}
                      </div>
                    </div>
                    <span className={`np-badge t-${meta.tone}`}>{meta.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Permission explainer */}
      <section className="np-card stf-perm np-an" style={{ '--d': '260ms' } as React.CSSProperties}>
        <div className="stf-perm-head">
          <span className="stf-sec-title">
            <Info size={15} /> 권한 안내
          </span>
        </div>
        <div className="stf-perm-grid">
          <div className="stf-perm-col">
            <div className="stf-perm-role">
              <span className="np-badge t-accent">
                <Crown size={11} /> 대표 (owner)
              </span>
            </div>
            <ul className="stf-perm-list">
              <li>매출·정산·커미션 등 모든 데이터 열람</li>
              <li>직원 추가·삭제 및 권한 설정</li>
              <li>서비스 가격·영업시간 등 매장 설정 변경</li>
              <li>고객 메모·노쇼 점수 관리</li>
            </ul>
          </div>
          <div className="stf-perm-col">
            <div className="stf-perm-role">
              <span className="np-badge t-muted">
                <User size={11} /> 직원 (staff)
              </span>
            </div>
            <ul className="stf-perm-list">
              <li>예약 보드·고객·반려동물 정보 열람</li>
              <li>본인 담당 예약의 상태 변경·기록 작성</li>
              <li>본인 담당분 커미션 현황 확인</li>
              <li className="is-off">매장 전체 매출·설정은 열람 불가</li>
            </ul>
          </div>
        </div>
        <div className="stf-perm-foot">
          서비스 {services.length}종 · 커미션은 담당 직원의 완료(done) 예약에 한해 서비스 정가 기준으로 자동 집계됩니다.
        </div>
      </section>
    </div>
  )
}
