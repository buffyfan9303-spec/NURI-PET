import type * as React from 'react'
import { useMemo, useState } from 'react'
import {
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Delete,
  Receipt,
  Wallet,
  Tag,
} from 'lucide-react'
import {
  useData,
  STATUS_META,
  DEMO_TODAY,
  serviceById,
  staffById,
  petById,
  customerOfPet,
  type Appt,
  type PayMethod,
} from '@/stores/data'
import { fmtMoney } from '@/lib/date'
import './payments.css'

/* ---------- date helpers (KST string compare on DEMO_TODAY) ---------- */
const weekStart = (() => {
  // Monday of the week containing DEMO_TODAY (2026-06-24 Wed → 2026-06-22)
  const d = new Date(DEMO_TODAY + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
})()
const monthPrefix = DEMO_TODAY.slice(0, 7) // '2026-06'

const PAY_METHODS: { id: PayMethod; label: string; Icon: typeof CreditCard }[] = [
  { id: '카드', label: '카드', Icon: CreditCard },
  { id: '현금', label: '현금', Icon: Banknote },
  { id: '계좌이체', label: '계좌이체', Icon: ArrowLeftRight },
]

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', 'back'] as const

function apptNet(a: Appt): number {
  return serviceById(a.serviceId)?.price ?? 0
}

export function PaymentsPage() {
  // live store subscriptions — derived lists recompute on every mutation
  const appts = useData((s) => s.appts)
  const payments = useData((s) => s.payments)
  const staff = useData((s) => s.staff)
  const payAppt = useData((s) => s.payAppt)
  const updateApptStatus = useData((s) => s.updateApptStatus)

  // today's payable appts: checked in and not yet paid (awaiting the cashier).
  // 결제 → paid/done, 미수 처리 → done (unpaid); both drop the row from here.
  const payable = useMemo(
    () =>
      appts
        .filter((a) => a.date === DEMO_TODAY && a.status === 'checked_in' && !a.paid)
        .sort((x, y) => x.start.localeCompare(y.start)),
    [appts],
  )

  const [selectedId, setSelectedId] = useState<string | null>(payable[0]?.id ?? null)
  const [amount, setAmount] = useState<string>(
    payable[0] ? String(apptNet(payable[0])) : '',
  )
  const [method, setMethod] = useState<PayMethod>('카드')
  const [discount, setDiscount] = useState<string>('')

  const selected = payable.find((a) => a.id === selectedId) ?? null

  function selectAppt(a: Appt) {
    setSelectedId(a.id)
    setAmount(String(apptNet(a)))
    setDiscount('')
  }

  function pressKey(k: (typeof KEYS)[number]) {
    setAmount((prev) => {
      if (k === 'back') return prev.slice(0, -1)
      const next = (prev + k).replace(/^0+(?=\d)/, '')
      if (next.length > 9) return prev
      return next
    })
  }

  const amountNum = Number(amount) || 0
  const discountNum = Number(discount) || 0
  const finalDue = Math.max(0, amountNum - discountNum)

  // after a payable row leaves the list (paid/settled), move selection to the next one
  function advanceSelection(closedId: string) {
    const next = payable.find((a) => a.id !== closedId) ?? null
    setSelectedId(next?.id ?? null)
    setAmount(next ? String(apptNet(next)) : '')
    setDiscount('')
  }

  // "결제": settle the selected appt → paid/done, recorded in payments
  function handlePay() {
    if (!selected || finalDue <= 0) return
    payAppt(selected.id, { amount: finalDue, method, discount: discountNum })
    advanceSelection(selected.id)
  }

  // "미수 처리": mark done but leave unpaid → stays in 미수금 list
  function handleUnpaid() {
    if (!selected) return
    updateApptStatus(selected.id, 'done')
    advanceSelection(selected.id)
  }

  /* ---------- ledger summary ---------- */
  const totals = useMemo(() => {
    let day = 0
    let week = 0
    let month = 0
    const byMethod: Record<PayMethod, number> = { 카드: 0, 현금: 0, 계좌이체: 0 }
    for (const p of payments) {
      if (p.unpaid) continue
      const date = p.at.slice(0, 10)
      if (date === DEMO_TODAY) day += p.amount
      if (date >= weekStart) week += p.amount
      if (date.slice(0, 7) === monthPrefix) month += p.amount
      byMethod[p.method] += p.amount
    }
    return { day, week, month, byMethod }
  }, [payments])

  // staff commission estimate: done appts × service price × commissionRate
  const commissions = useMemo(() => {
    return staff
      .map((st) => {
        const doneToday = appts.filter(
          (a) => a.date === DEMO_TODAY && a.status === 'done' && a.staffId === st.id,
        )
        const sales = doneToday.reduce((sum, a) => sum + apptNet(a), 0)
        const commission = Math.round(sales * st.commissionRate)
        return { st, sales, commission, count: doneToday.length }
      })
      .filter((r) => r.count > 0 || r.st.role === 'owner')
  }, [appts, staff])

  // unpaid: payments flagged unpaid + done/checked_in appts without a settled payment
  const unpaidList = useMemo(() => {
    const settledAppt = new Set(
      payments.filter((p) => !p.unpaid).map((p) => p.apptId),
    )
    const flaggedAppt = new Set(payments.filter((p) => p.unpaid).map((p) => p.apptId))
    const rows: { appt: Appt; amount: number }[] = []
    for (const a of appts) {
      if (a.date !== DEMO_TODAY) continue
      if (a.status !== 'done' && a.status !== 'checked_in') continue
      if (settledAppt.has(a.id)) continue
      if (a.paid && !flaggedAppt.has(a.id)) continue
      rows.push({ appt: a, amount: apptNet(a) })
    }
    return rows
  }, [appts, payments])

  const KPIS = [
    { label: '오늘 매출', value: totals.day, accent: 'good' as const },
    { label: '이번 주', value: totals.week, accent: 'accent' as const },
    { label: '이번 달', value: totals.month, accent: 'muted' as const },
  ]

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">결제 · 장부</div>
          <div className="feat-sub">
            오늘 결제 대상 {payable.length}건 · 미수 {unpaidList.length}건 · KST
          </div>
        </div>
        <div className="feat-actions">
          <span className="np-badge t-good">
            오늘 {fmtMoney(totals.day)}
          </span>
        </div>
      </div>

      <div className="pay-grid">
        {/* ===================== LEFT : POS ===================== */}
        <section className="np-card pay-pos np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
          <div className="pay-pos-body">
            {/* payable picker */}
            <div className="pay-picker">
              <div className="pay-sec-label">결제 대상 예약</div>
              <div className="pay-picker-list">
                {payable.length === 0 && (
                  <div className="pay-empty">오늘 결제할 예약이 없습니다.</div>
                )}
                {payable.map((a) => {
                  const pet = petById(a.petId)
                  const cust = customerOfPet(a.petId)
                  const sv = serviceById(a.serviceId)
                  const st = STATUS_META[a.status]
                  const active = a.id === selectedId
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`pay-pick ${active ? 'is-active' : ''}`}
                      onClick={() => selectAppt(a)}
                      aria-pressed={active}
                    >
                      <span className="pay-pick-time">{a.start}</span>
                      <span className="pay-pick-main">
                        <span className="pay-pick-pet">
                          {pet?.name}
                          <em>{pet?.breed}</em>
                        </span>
                        <span className="pay-pick-meta">
                          {sv?.name} · {cust?.name}
                        </span>
                      </span>
                      <span className="pay-pick-right">
                        <span className={`np-badge t-${st.tone}`}>{st.label}</span>
                        <span className="pay-pick-price">{fmtMoney(sv?.price ?? 0)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* amount + keypad */}
            <div className="pay-entry">
              <div className="pay-display">
                <div className="pay-display-top">
                  <span className="pay-sec-label">결제 금액</span>
                  {selected && (
                    <span className="pay-display-ctx">
                      {petById(selected.petId)?.name} · {serviceById(selected.serviceId)?.name}
                    </span>
                  )}
                </div>
                <div className="pay-amount">{fmtMoney(amountNum)}</div>
                {discountNum > 0 && (
                  <div className="pay-display-foot">
                    할인 −{fmtMoney(discountNum)} · 받을 금액{' '}
                    <strong>{fmtMoney(finalDue)}</strong>
                  </div>
                )}
              </div>

              <div className="pay-pad">
                {KEYS.map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={`pay-key ${k === 'back' ? 'is-back' : ''}`}
                    onClick={() => pressKey(k)}
                    aria-label={k === 'back' ? '한 자리 지우기' : `숫자 ${k}`}
                  >
                    {k === 'back' ? <Delete size={18} /> : k}
                  </button>
                ))}
              </div>

              {/* method */}
              <div className="pay-field">
                <span className="pay-sec-label">결제 수단</span>
                <div className="pay-methods">
                  {PAY_METHODS.map(({ id, label, Icon }) => (
                    <button
                      type="button"
                      key={id}
                      className={`pay-method ${method === id ? 'is-active' : ''}`}
                      onClick={() => setMethod(id)}
                      aria-pressed={method === id}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* discount */}
              <div className="pay-field">
                <span className="pay-sec-label">할인</span>
                <div className="pay-discount">
                  <Tag size={15} className="pay-discount-ic" />
                  <input
                    className="np-input pay-discount-in"
                    inputMode="numeric"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                    aria-label="할인 금액"
                  />
                  <span className="pay-discount-won">원</span>
                </div>
              </div>

              {/* actions */}
              <div className="pay-actions">
                <button
                  type="button"
                  className="np-btn pay-unpaid"
                  disabled={!selected}
                  onClick={handleUnpaid}
                >
                  <Receipt size={16} /> 미수 처리
                </button>
                <button
                  type="button"
                  className="np-btn np-btn-primary pay-pay"
                  disabled={!selected || finalDue <= 0}
                  onClick={handlePay}
                >
                  <Wallet size={16} /> {fmtMoney(finalDue)} 결제
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== RIGHT : LEDGER ===================== */}
        <div className="pay-side">
          {/* KPI row */}
          <div className="pay-kpis np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
            {KPIS.map((k) => (
              <section className="np-card pay-kpi" key={k.label}>
                <span className="pay-kpi-label">{k.label}</span>
                <span className={`pay-kpi-val tone-${k.accent}`}>{fmtMoney(k.value)}</span>
              </section>
            ))}
          </div>

          {/* method breakdown */}
          <section
            className="np-card pay-block np-an"
            style={{ '--d': '110ms' } as React.CSSProperties}
          >
            <div className="pay-block-head">
              <span className="pay-block-title">결제수단별 합계</span>
              <span className="np-chip">전체 누계</span>
            </div>
            <div className="pay-method-rows">
              {PAY_METHODS.map(({ id, label, Icon }) => {
                const v = totals.byMethod[id]
                const grand =
                  totals.byMethod.카드 + totals.byMethod.현금 + totals.byMethod.계좌이체
                const pct = grand > 0 ? Math.round((v / grand) * 100) : 0
                return (
                  <div className="pay-mrow" key={id}>
                    <span className="pay-mrow-l">
                      <Icon size={15} />
                      {label}
                    </span>
                    <span className="pay-mbar">
                      <span className="pay-mbar-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="pay-mrow-v">{fmtMoney(v)}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* commission */}
          <section
            className="np-card pay-block np-an"
            style={{ '--d': '150ms' } as React.CSSProperties}
          >
            <div className="pay-block-head">
              <span className="pay-block-title">직원별 커미션 (오늘 완료 기준)</span>
            </div>
            <div className="pay-comm-rows">
              {commissions.map(({ st, sales, commission, count }) => (
                <div className="pay-comm" key={st.id}>
                  <span className="pay-comm-dot" style={{ background: st.color }} />
                  <span className="pay-comm-name">
                    {st.name}
                    <em>
                      {st.role === 'owner'
                        ? '대표'
                        : `요율 ${Math.round(st.commissionRate * 100)}%`}{' '}
                      · {count}건
                    </em>
                  </span>
                  <span className="pay-comm-vals">
                    <span className="pay-comm-sales">{fmtMoney(sales)}</span>
                    <span className="pay-comm-comm">
                      {st.role === 'owner' ? '—' : fmtMoney(commission)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* unpaid list */}
          <section
            className="np-card pay-block np-an"
            style={{ '--d': '190ms' } as React.CSSProperties}
          >
            <div className="pay-block-head">
              <span className="pay-block-title">미수금</span>
              {unpaidList.length > 0 ? (
                <span className="np-badge t-warn">{unpaidList.length}건</span>
              ) : (
                <span className="np-badge t-good">없음</span>
              )}
            </div>
            <div className="pay-unpaid-rows">
              {unpaidList.length === 0 && (
                <div className="pay-empty">미수금이 없습니다.</div>
              )}
              {unpaidList.map(({ appt, amount: amt }) => {
                const pet = petById(appt.petId)
                const cust = customerOfPet(appt.petId)
                const stf = staffById(appt.staffId)
                return (
                  <div className="pay-urow" key={appt.id}>
                    <span className="pay-urow-time">{appt.start}</span>
                    <span className="pay-urow-main">
                      <span className="pay-urow-pet">
                        {pet?.name}
                        <em>{cust?.name}</em>
                      </span>
                      <span className="pay-urow-meta">
                        {serviceById(appt.serviceId)?.name} · {stf?.name}
                      </span>
                    </span>
                    <span className="pay-urow-amt">{fmtMoney(amt)}</span>
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
