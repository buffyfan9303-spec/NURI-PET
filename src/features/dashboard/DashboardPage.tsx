import type * as React from 'react'
import { AlertTriangle, Receipt, Clock, Plus, UserPlus, CalendarCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useData,
  petById,
  customerOfPet,
  serviceById,
  staffById,
  STATUS_META,
  DEMO_TODAY,
  type Appt,
} from '@/stores/data'
import { fmtMoney, fmtDate, fmtWeekday, today } from '@/lib/date'
import { Sparkline } from '@/components/Sparkline'
import '../feature.css'
import './dashboard.css'

function endTimeOf(a: Appt): string {
  const [h, m] = a.start.split(':').map(Number)
  const t = h * 60 + m + a.durationMin
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const appts = useData((s) => s.appts)
  const payments = useData((s) => s.payments)
  const customers = useData((s) => s.customers)
  const waitlist = useData((s) => s.waitlist)
  const staff = useData((s) => s.staff)
  const fillFromWaitlist = useData((s) => s.fillFromWaitlist)

  const todayAppts = appts
    .filter((a) => a.date === DEMO_TODAY)
    .sort((x, y) => x.start.localeCompare(y.start))
  const doneCount = todayAppts.filter((a) => a.status === 'done').length

  // revenue
  const paid = payments.filter((p) => !p.unpaid)
  const todayRevenue = paid.filter((p) => p.at.startsWith(DEMO_TODAY)).reduce((s, p) => s + p.amount, 0)
  const weekRevenue = paid
    .filter((p) => {
      const d = p.at.slice(0, 10)
      return d >= '2026-06-22' && d <= '2026-06-27'
    })
    .reduce((s, p) => s + p.amount, 0)
  const monthRevenue = paid.filter((p) => p.at.startsWith('2026-06')).reduce((s, p) => s + p.amount, 0)

  // no-show rate
  const considered = appts.filter((a) => a.status !== 'cancelled')
  const noShowRate = considered.length ? appts.filter((a) => a.status === 'no_show').length / considered.length : 0

  // alerts (live)
  const scoreOf = (a: Appt) => customers.find((c) => c.id === petById(a.petId)?.customerId)?.noShowScore ?? 0
  const noShowRisk = todayAppts.filter((a) => (a.status === 'requested' || a.status === 'confirmed') && scoreOf(a) >= 2)
  const unpaid = todayAppts.filter((a) => (a.status === 'checked_in' || a.status === 'done') && !a.paid)
  const pickup = todayAppts.filter((a) => a.status === 'done')

  // no-show prevention: freed slots today that a waiting pet could take
  const freedSlots = todayAppts.filter((a) => a.status === 'no_show' || a.status === 'cancelled')

  const offerSlot = (waitId: string) => {
    const slot = freedSlots[0]
    if (!slot) return
    fillFromWaitlist(waitId, { date: slot.date, start: slot.start, staffId: slot.staffId, serviceId: slot.serviceId })
  }

  const d = today()
  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">대시보드</div>
          <div className="feat-sub">
            {fmtDate(d)} {fmtWeekday(d)} · 오늘 예약 {todayAppts.length}건 · 완료 {doneCount}건
          </div>
        </div>
        <div className="feat-actions">
          <button type="button" className="np-btn np-btn-primary" onClick={() => navigate('/app/appointments')}>
            <Plus size={16} /> 새 예약
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpis">
        <section className="np-card kpi np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
          <div className="kpi-top">
            <span className="kpi-label">오늘 매출</span>
            <Sparkline data={[60, 80, 70, 95, 90, 120, 145]} color="var(--good)" />
          </div>
          <div className="kpi-val">{fmtMoney(todayRevenue)}</div>
          <div className="kpi-delta up">▲ 12% · 어제 대비</div>
        </section>

        <section className="np-card kpi np-an" style={{ '--d': '50ms' } as React.CSSProperties}>
          <div className="kpi-top">
            <span className="kpi-label">이번 주 매출</span>
            <Sparkline data={[1.2, 1.4, 1.3, 1.5, 1.6, 1.7, 1.82]} color="var(--accent)" />
          </div>
          <div className="kpi-val">{fmtMoney(weekRevenue)}</div>
          <div className="kpi-delta up">▲ 8% · 지난주 대비</div>
        </section>

        <section className="np-card kpi np-an" style={{ '--d': '100ms' } as React.CSSProperties}>
          <div className="kpi-top">
            <span className="kpi-label">오늘 예약</span>
          </div>
          <div className="kpi-val">{todayAppts.length}건</div>
          <div className="kpi-delta flat">
            완료 {doneCount} · 진행·예정 {todayAppts.length - doneCount}
          </div>
        </section>

        <section className="np-card kpi np-an" style={{ '--d': '150ms' } as React.CSSProperties}>
          <div className="kpi-top">
            <span className="kpi-label">노쇼율 (이번 주)</span>
          </div>
          <div className="kpi-val">{Math.round(noShowRate * 100)}%</div>
          <div className="kpi-delta flat">월 매출 {fmtMoney(monthRevenue)}</div>
        </section>
      </div>

      <div className="dash-grid">
        {/* Today board */}
        <section className="np-card np-an" style={{ '--d': '180ms' } as React.CSSProperties}>
          <div className="dash-card-head">
            <span className="dash-card-title">오늘 예약 보드</span>
            <div className="dash-legend">
              {staff.map((s) => (
                <span key={s.id}>
                  <i style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <div className="appt-list">
            {todayAppts.length === 0 && <div className="dash-empty">오늘 예약이 없습니다.</div>}
            {todayAppts.map((a) => {
              const st = STATUS_META[a.status]
              const sf = staffById(a.staffId)
              const pet = petById(a.petId)
              const owner = customerOfPet(a.petId)
              const sv = serviceById(a.serviceId)
              return (
                <div className="appt-row" key={a.id}>
                  <div className="appt-time">
                    {a.start}
                    <small>~ {endTimeOf(a)}</small>
                  </div>
                  <div className="appt-main">
                    <div className="appt-pet">
                      {pet?.name}
                      <em>{pet?.breed}</em>
                    </div>
                    <div className="appt-meta">
                      <span className="appt-staffdot" style={{ background: sf?.color }} />
                      {sf?.name} · {sv?.name} · {owner?.name}
                    </div>
                  </div>
                  <div className="appt-right">
                    <span className={`np-badge t-${st.tone}`}>{st.label}</span>
                    <span className="appt-price">{fmtMoney(sv?.price ?? 0)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Alerts + waitlist */}
        <div className="dash-side">
          <section className="np-card np-an" style={{ '--d': '220ms' } as React.CSSProperties}>
            <div className="dash-card-head">
              <span className="dash-card-title">알림</span>
              <span className="np-badge t-alert">{noShowRisk.length + unpaid.length + pickup.length}</span>
            </div>
            <div className="alert-list">
              {noShowRisk.map((a) => {
                const pet = petById(a.petId)
                const owner = customerOfPet(a.petId)
                return (
                  <div className="alert-row" key={`ns-${a.id}`}>
                    <div className="alert-ic t-alert">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="alert-txt">
                      <strong>노쇼 위험 · {pet?.name}</strong>
                      <span>
                        {a.start} · {owner?.name} — 노쇼 점수 {owner?.noShowScore}, 보증금 권장
                      </span>
                    </div>
                  </div>
                )
              })}
              {unpaid.map((a) => {
                const pet = petById(a.petId)
                const sv = serviceById(a.serviceId)
                return (
                  <div className="alert-row" key={`up-${a.id}`}>
                    <div className="alert-ic t-warn">
                      <Receipt size={16} />
                    </div>
                    <div className="alert-txt">
                      <strong>미수금 {fmtMoney(sv?.price ?? 0)}</strong>
                      <span>
                        {pet?.name} · {a.start} — 결제 대기
                      </span>
                    </div>
                  </div>
                )
              })}
              {pickup.map((a) => {
                const pet = petById(a.petId)
                return (
                  <div className="alert-row" key={`pk-${a.id}`}>
                    <div className="alert-ic t-accent">
                      <Clock size={16} />
                    </div>
                    <div className="alert-txt">
                      <strong>픽업 임박 · {pet?.name}</strong>
                      <span>미용 완료 — 보호자 픽업 안내</span>
                    </div>
                  </div>
                )
              })}
              {noShowRisk.length + unpaid.length + pickup.length === 0 && (
                <div className="dash-empty">처리할 알림이 없습니다.</div>
              )}
            </div>
          </section>

          {/* Waitlist — no-show / cancellation slot fill */}
          <section className="np-card np-an" style={{ '--d': '260ms' } as React.CSSProperties}>
            <div className="dash-card-head">
              <span className="dash-card-title">대기열</span>
              <span className={`np-badge ${freedSlots.length ? 't-good' : 't-muted'}`}>
                {freedSlots.length ? `빈 자리 ${freedSlots.length}` : '대기 ' + waitlist.length}
              </span>
            </div>
            <div className="alert-list">
              {waitlist.length === 0 && <div className="dash-empty">대기 중인 고객이 없습니다.</div>}
              {waitlist.map((w) => {
                const pet = petById(w.petId)
                const owner = customerOfPet(w.petId)
                return (
                  <div className="alert-row" key={w.id}>
                    <div className="alert-ic t-accent">
                      <UserPlus size={16} />
                    </div>
                    <div className="alert-txt" style={{ flex: 1 }}>
                      <strong>
                        {pet?.name} <em style={{ fontWeight: 400, color: 'var(--tx3)' }}>{owner?.name}</em>
                      </strong>
                      <span>희망: {w.desired}</span>
                    </div>
                    <button
                      type="button"
                      className="np-btn dash-fill-btn"
                      disabled={freedSlots.length === 0}
                      onClick={() => offerSlot(w.id)}
                      title={freedSlots.length ? '빈 자리에 배정' : '빈 자리가 없습니다'}
                    >
                      <CalendarCheck size={14} /> 자리 제안
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
