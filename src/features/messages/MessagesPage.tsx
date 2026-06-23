import type * as React from 'react'
import { useMemo, useState } from 'react'
import {
  MessageSquare,
  CheckCircle2,
  BellRing,
  PackageCheck,
  AlertTriangle,
  Pencil,
  Send,
  ShieldCheck,
  Search,
} from 'lucide-react'
import {
  useData,
  STORE,
  DEMO_TODAY,
  customerById,
  type MsgTemplate,
  type MsgStatus,
} from '@/stores/data'
import '../feature.css'
import './messages.css'

/* ---- template catalog (UI copy only; record/notify purpose) ---- */
interface TemplateDef {
  key: MsgTemplate
  Icon: typeof CheckCircle2
  tone: 'good' | 'warn' | 'alert' | 'accent'
  ruleLabel: string
  body: string
}

const TEMPLATES: TemplateDef[] = [
  {
    key: '예약확정',
    Icon: CheckCircle2,
    tone: 'accent',
    ruleLabel: '예약 확정 시 자동 발송',
    body: `[${STORE.name}] {고객명}님, {펫명}의 예약이 확정되었습니다.\n· 일시: {일시}\n· 서비스: {서비스}\n방문이 어려우시면 미리 알려주세요. 감사합니다.`,
  },
  {
    key: '리마인드',
    Icon: BellRing,
    tone: 'good',
    ruleLabel: '방문 전일 18시 자동 발송',
    body: `[${STORE.name}] {고객명}님, 내일 {펫명}의 예약을 잊지 않으셨죠?\n· 일시: {일시}\n· 매장: ${STORE.name}\n변경이 필요하시면 회신 부탁드립니다.`,
  },
  {
    key: '픽업알림',
    Icon: PackageCheck,
    tone: 'good',
    ruleLabel: '미용 완료(픽업 가능) 시 자동 발송',
    body: `[${STORE.name}] {고객명}님, {펫명}의 미용이 완료되었습니다.\n편하신 시간에 픽업해 주세요. 오늘도 함께해 주셔서 감사합니다.`,
  },
  {
    key: '노쇼경고',
    Icon: AlertTriangle,
    tone: 'warn',
    ruleLabel: '노쇼 처리 시 안내 발송',
    body: `[${STORE.name}] {고객명}님, {펫명}의 {일시} 예약에 방문 기록이 확인되지 않았습니다.\n다음 예약 시 보증금이 요청될 수 있습니다. 문의는 매장으로 연락 주세요.`,
  },
]

const STATUS_TONE: Record<MsgStatus, 'good' | 'warn' | 'alert'> = {
  발송: 'good',
  대기: 'warn',
  실패: 'alert',
}

export function MessagesPage() {
  const messages = useData((s) => s.messages)
  const customers = useData((s) => s.customers)
  const sendMessage = useData((s) => s.sendMessage)

  const consentCount = customers.filter((c) => c.notifyConsent).length

  // per-template auto-send rule on/off
  const [rules, setRules] = useState<Record<MsgTemplate, boolean>>({
    예약확정: true,
    리마인드: true,
    픽업알림: true,
    노쇼경고: false,
  })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'전체' | MsgStatus>('전체')

  const rows = useMemo(() => {
    const q = query.trim()
    return messages.filter((m) => {
      if (statusFilter !== '전체' && m.status !== statusFilter) return false
      if (!q) return true
      const cust = customerById(m.customerId)
      return (
        (cust?.name ?? '').includes(q) ||
        (cust?.phone ?? '').includes(q) ||
        m.template.includes(q)
      )
    }).sort((a, b) => b.at.localeCompare(a.at))
  }, [messages, query, statusFilter])

  const sentCount = messages.filter((m) => m.status === '발송').length

  // "테스트 발송": send the first selected template to the first consenting customer
  const onTestSend = () => {
    const target = customers.find((c) => c.notifyConsent)
    if (!target) return
    const d = new Date()
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    sendMessage({ customerId: target.id, template: TEMPLATES[0].key, at: `${DEMO_TODAY} ${hm}` })
  }

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">알림톡</div>
          <div className="feat-sub">
            템플릿 {TEMPLATES.length}종 · 발송 동의 고객 {consentCount}명 · 오늘까지 발송 {sentCount}건
          </div>
        </div>
        <div className="feat-actions">
          <span className="np-chip msg-mock-chip">
            <ShieldCheck size={13} /> Solapi 미설정 · mock 발송
          </span>
          <button
            type="button"
            className="np-btn np-btn-primary"
            onClick={onTestSend}
            disabled={consentCount === 0}
          >
            <Send size={16} /> 테스트 발송
          </button>
        </div>
      </div>

      {/* consent notice */}
      <div className="msg-notice np-an">
        <ShieldCheck size={15} />
        <span>
          발송 동의 고객에게만 전송됩니다. 미동의 고객({customers.length - consentCount}명)은 자동·수동
          발송 대상에서 자동 제외됩니다.
        </span>
      </div>

      {/* template cards */}
      <div className="msg-tpl-grid">
        {TEMPLATES.map((t, i) => {
          const on = rules[t.key]
          return (
            <section
              key={t.key}
              className="np-card msg-tpl np-an"
              style={{ '--d': `${i * 60}ms` } as React.CSSProperties}
            >
              <div className="msg-tpl-head">
                <span className={`msg-tpl-ic t-${t.tone}`}>
                  <t.Icon size={17} />
                </span>
                <div className="msg-tpl-title">
                  <strong>{t.key}</strong>
                  <span className={`np-badge t-${t.tone}`}>알림톡</span>
                </div>
                <button
                  type="button"
                  className="np-iconbtn msg-edit"
                  aria-label={`${t.key} 템플릿 수정`}
                  title="수정"
                >
                  <Pencil size={15} />
                </button>
              </div>

              <pre className="msg-tpl-body">{t.body}</pre>

              <div className="msg-tpl-foot">
                <span className="msg-rule-label">{t.ruleLabel}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${t.key} 자동 발송`}
                  className={`msg-toggle${on ? ' is-on' : ''}`}
                  onClick={() =>
                    setRules((r) => ({ ...r, [t.key]: !r[t.key] }))
                  }
                >
                  <span className="msg-toggle-knob" />
                  <em>{on ? '자동 ON' : '수동'}</em>
                </button>
              </div>
            </section>
          )
        })}
      </div>

      {/* history */}
      <section className="np-card msg-log np-an" style={{ '--d': '260ms' } as React.CSSProperties}>
        <div className="msg-log-head">
          <div className="msg-log-title">
            <MessageSquare size={16} />
            발송 이력
            <span className="np-chip">{rows.length}건</span>
          </div>
          <div className="msg-log-tools">
            <div className="msg-search">
              <Search size={15} />
              <input
                className="np-input"
                placeholder="고객명·연락처·템플릿 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="발송 이력 검색"
              />
            </div>
            <div className="msg-filters" role="tablist" aria-label="상태 필터">
              {(['전체', '발송', '대기', '실패'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === s}
                  className={`msg-filter${statusFilter === s ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="msg-table" role="table" aria-label="알림톡 발송 이력">
          <div className="msg-tr msg-thead" role="row">
            <span role="columnheader">고객</span>
            <span role="columnheader">연락처</span>
            <span role="columnheader">템플릿</span>
            <span role="columnheader">발송 시각</span>
            <span role="columnheader">상태</span>
          </div>
          {rows.map((m) => {
            const cust = customerById(m.customerId)
            const tpl = TEMPLATES.find((t) => t.key === m.template)
            return (
              <div className="msg-tr msg-row" role="row" key={m.id}>
                <span className="msg-cust" role="cell">
                  {cust?.name ?? '—'}
                </span>
                <span className="msg-phone" role="cell">
                  {cust?.phone ?? '—'}
                </span>
                <span role="cell">
                  <span className={`np-badge t-${tpl?.tone ?? 'muted'}`}>{m.template}</span>
                </span>
                <span className="msg-at" role="cell">
                  {m.at}
                </span>
                <span role="cell">
                  <span className={`np-badge t-${STATUS_TONE[m.status]}`}>{m.status}</span>
                </span>
              </div>
            )
          })}
          {rows.length === 0 && (
            <div className="msg-empty">조건에 맞는 발송 이력이 없습니다.</div>
          )}
        </div>
      </section>
    </div>
  )
}
