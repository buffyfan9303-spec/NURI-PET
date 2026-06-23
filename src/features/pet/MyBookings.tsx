import type * as React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarHeart, CalendarPlus, BellRing, LogIn } from 'lucide-react'
import { useConsumer } from '@/stores/consumer'
import { myBookings } from '@/lib/consumer/api'
import { fmtMoney } from '@/lib/date'
import type { Booking } from '@/lib/consumer/api'
import './bookings.css'

const STATUS: Record<string, { label: string; tone: string }> = {
  requested: { label: '요청됨', tone: 't-warn' },
  confirmed: { label: '확정', tone: 't-accent' },
  checked_in: { label: '입실', tone: 't-good' },
  done: { label: '완료', tone: 't-good' },
  no_show: { label: '노쇼', tone: 't-alert' },
  cancelled: { label: '취소', tone: 't-muted' },
}

function statusOf(s: string): { label: string; tone: string } {
  return STATUS[s] ?? { label: s, tone: 't-muted' }
}

export function MyBookings() {
  const consumer = useConsumer((s) => s.consumer)
  const initializing = useConsumer((s) => s.initializing)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!consumer) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    myBookings()
      .then((rows) => {
        if (alive) setBookings(rows)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [consumer])

  // 로딩(세션 초기화 중)
  if (initializing) {
    return (
      <div className="pet-scroll">
        <div className="pet-top">
          <div>
            <div className="pet-hello">예약</div>
            <div className="pet-name">내 예약</div>
          </div>
        </div>
        <p className="pet-bk-empty-sub">불러오는 중…</p>
      </div>
    )
  }

  // 비로그인 게이팅
  if (!consumer) {
    return (
      <div className="pet-scroll">
        <div className="pet-auth">
          <div className="pet-auth-logo">
            <CalendarHeart size={26} />
          </div>
          <h2 className="pet-auth-title">내 예약</h2>
          <p className="pet-auth-sub">로그인하면 매장 예약 현황을 한눈에 볼 수 있어요.</p>
          <Link to="/pet/login" className="pet-cta" style={{ maxWidth: 240 }}>
            <LogIn size={18} />
            로그인하고 시작
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">예약</div>
          <div className="pet-name">내 예약</div>
          <div className="pet-meta">예약 요청과 진행 상태를 모아봤어요</div>
        </div>
      </div>

      <div className="pet-bk-notice np-card np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        <span className="pet-bk-notice-ic" aria-hidden>
          <BellRing size={16} />
        </span>
        <p>매장이 확인하면 상태가 업데이트돼요</p>
      </div>

      {loading ? (
        <p className="pet-bk-empty-sub">불러오는 중…</p>
      ) : bookings.length === 0 ? (
        <div className="pet-bk-empty np-card np-an" style={{ '--d': '90ms' } as React.CSSProperties}>
          <span className="pet-bk-empty-ic" aria-hidden>
            <CalendarHeart size={24} />
          </span>
          <strong>아직 예약이 없어요</strong>
          <span className="pet-bk-empty-sub">마음에 드는 매장을 찾아 첫 예약을 남겨보세요.</span>
          <Link to="/pet/discover" className="pet-cta" style={{ maxWidth: 220 }}>
            <CalendarPlus size={18} />
            매장 둘러보기
          </Link>
        </div>
      ) : (
        <div className="pet-bk-list">
          {bookings.map((b, i) => {
            const st = statusOf(b.status)
            return (
              <section
                key={b.id}
                className="np-card pet-bk-card np-an"
                style={{ '--d': `${90 + i * 50}ms` } as React.CSSProperties}
              >
                <div className="pet-bk-head">
                  <div className="pet-bk-store">
                    <strong>{b.storeName}</strong>
                    {b.storeType && <span className="pet-bk-type">{b.storeType}</span>}
                  </div>
                  <span className={`np-badge ${st.tone}`}>{st.label}</span>
                </div>

                <div className="pet-bk-svc">{b.serviceName}</div>

                <div className="pet-bk-meta">
                  <span className="pet-bk-when">
                    {b.date} · {b.start}
                  </span>
                  <span className="pet-bk-price">{fmtMoney(b.servicePrice)}</span>
                </div>

                <div className="pet-bk-foot">
                  <span className="pet-bk-pet">{b.petName}</span>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="pet-legal np-an" style={{ '--d': '200ms' } as React.CSSProperties}>
        예약 상태는 매장 확인에 따라 바뀔 수 있어요
      </p>
    </div>
  )
}
