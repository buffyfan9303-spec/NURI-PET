import type * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Clock, MapPin, PawPrint, Check, CalendarHeart } from 'lucide-react'
import { useConsumer } from '@/stores/consumer'
import { getStore, bookAppointment } from '@/lib/consumer/api'
import type { StoreDir, StoreService } from '@/lib/consumer/api'
import './StoreDetail.css'

/* Public store detail + booking. Browsing is open to all;
   submitting a booking requires a logged-in consumer (otherwise routed to login). */

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Local YYYY-MM-DD for `today + offset` days (no UTC drift). */
function dayStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dayLabel(iso: string): { md: string; dow: string } {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return { md: `${m}.${d}`, dow: DOW[dt.getDay()] }
}

/** Hourly slots from open..close (exclusive of close), e.g. 09:00..18:00 → 09–17. */
function buildSlots(open: string, close: string): string[] {
  const oh = Number(open.slice(0, 2))
  const ch = Number(close.slice(0, 2))
  if (Number.isNaN(oh) || Number.isNaN(ch) || ch <= oh) return []
  const out: string[] = []
  for (let h = oh; h < ch; h++) out.push(`${pad(h)}:00`)
  return out
}

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export function StoreDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const consumer = useConsumer((s) => s.consumer)
  const pets = useConsumer((s) => s.pets)

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreDir | null>(null)
  const [services, setServices] = useState<StoreService[]>([])

  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(dayStr(1))
  const [start, setStart] = useState('')
  const [petId, setPetId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualBreed, setManualBreed] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getStore(id).then((res) => {
      if (!active) return
      setStore(res.store)
      setServices(res.services)
      if (res.services[0]) setServiceId(res.services[0].id)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  // default the pet selection to the first pet once pets load
  useEffect(() => {
    if (pets[0] && !petId) setPetId(pets[0].id)
  }, [pets, petId])

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => dayStr(i + 1)), [])
  const slots = useMemo(() => (store ? buildSlots(store.open, store.close) : []), [store])
  const selectedService = services.find((s) => s.id === serviceId) ?? null
  const selectedPet = pets.find((p) => p.id === petId) ?? null

  const submit = async () => {
    setErr(null)
    if (!consumer) {
      navigate('/pet/login')
      return
    }
    if (!serviceId) {
      setErr('서비스를 선택해 주세요.')
      return
    }
    if (!start) {
      setErr('예약 시간을 선택해 주세요.')
      return
    }
    const petName = selectedPet ? selectedPet.name : manualName.trim()
    if (!petName) {
      setErr('반려동물 이름을 입력해 주세요.')
      return
    }
    const species = selectedPet ? selectedPet.species : ''
    const breed = selectedPet ? selectedPet.breed : manualBreed.trim()

    setSubmitting(true)
    const { id: bookingId, error } = await bookAppointment({
      storeId: id,
      serviceId,
      date,
      start,
      petName,
      species,
      breed,
      ownerName: consumer.name,
      phone: consumer.phone,
    })
    setSubmitting(false)

    if (error || !bookingId) {
      setErr(error ?? '예약 요청에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    setDone(true)
    window.setTimeout(() => navigate('/pet/bookings'), 900)
  }

  if (loading) {
    return (
      <div className="pet-scroll">
        <div className="pet-sd-empty">불러오는 중…</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="pet-scroll">
        <button type="button" className="pet-sd-back" onClick={() => navigate('/pet/discover')}>
          <ChevronLeft size={16} />
          탐색으로
        </button>
        <div className="pet-sd-empty">
          매장을 찾을 수 없어요.
          <br />
          삭제되었거나 주소가 잘못되었을 수 있어요.
        </div>
      </div>
    )
  }

  return (
    <div className="pet-scroll">
      <button type="button" className="pet-sd-back np-an" style={{ '--d': '0ms' } as React.CSSProperties} onClick={() => navigate('/pet/discover')}>
        <ChevronLeft size={16} />
        탐색으로
      </button>

      {/* header */}
      <section className="np-card pet-sd-head np-an" style={{ '--d': '40ms' } as React.CSSProperties}>
        <span className="pet-sd-type">{store.type}</span>
        <h1 className="pet-sd-name">{store.name}</h1>
        <div className="pet-sd-rows">
          <div className="pet-sd-line">
            <Clock size={14} />
            <span>
              영업 {store.open} ~ {store.close}
            </span>
          </div>
          {store.address && (
            <div className="pet-sd-line">
              <MapPin size={14} />
              <span>{store.address}</span>
            </div>
          )}
          {store.intro && (
            <div className="pet-sd-line">
              <PawPrint size={14} />
              <span>{store.intro}</span>
            </div>
          )}
        </div>
      </section>

      {/* services */}
      <div className="pet-sec-title np-an" style={{ '--d': '90ms' } as React.CSSProperties}>
        서비스 선택
      </div>
      {services.length === 0 ? (
        <div className="np-card pet-sd-empty">등록된 서비스가 아직 없어요.</div>
      ) : (
        <div className="np-an" style={{ '--d': '120ms' } as React.CSSProperties}>
          {services.map((sv) => (
            <button
              key={sv.id}
              type="button"
              className={`pet-sd-svc${serviceId === sv.id ? ' on' : ''}`}
              onClick={() => setServiceId(sv.id)}
              aria-pressed={serviceId === sv.id}
            >
              <span className="pet-sd-radio">
                <i />
              </span>
              <span className="pet-sd-svc-txt">
                {sv.category && <span className="pet-sd-svc-cat">{sv.category}</span>}
                <span className="pet-sd-svc-name">{sv.name}</span>
                <span className="pet-sd-svc-meta">약 {sv.durationMin}분 소요</span>
              </span>
              <span className="pet-sd-svc-price">{won(sv.price)}</span>
            </button>
          ))}
        </div>
      )}

      {/* date */}
      <div className="pet-sec-title np-an" style={{ '--d': '150ms' } as React.CSSProperties}>
        날짜
      </div>
      <div className="pet-sd-grid np-an" style={{ '--d': '180ms' } as React.CSSProperties}>
        {dates.map((iso) => {
          const { md, dow } = dayLabel(iso)
          return (
            <button
              key={iso}
              type="button"
              className={`pet-sd-slot${date === iso ? ' on' : ''}`}
              onClick={() => setDate(iso)}
              aria-pressed={date === iso}
            >
              {md}
              <small>{dow}</small>
            </button>
          )
        })}
      </div>

      {/* time */}
      <div className="pet-sec-title np-an" style={{ '--d': '210ms' } as React.CSSProperties}>
        시간
      </div>
      {slots.length === 0 ? (
        <div className="np-card pet-sd-empty">예약 가능한 시간대가 없어요.</div>
      ) : (
        <div className="pet-sd-grid np-an" style={{ '--d': '240ms' } as React.CSSProperties}>
          {slots.map((t) => (
            <button
              key={t}
              type="button"
              className={`pet-sd-slot${start === t ? ' on' : ''}`}
              onClick={() => setStart(t)}
              aria-pressed={start === t}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* pet */}
      <div className="pet-sec-title np-an" style={{ '--d': '270ms' } as React.CSSProperties}>
        반려동물
      </div>
      {pets.length > 0 ? (
        <div className="pet-sd-petrow np-an" style={{ '--d': '300ms' } as React.CSSProperties}>
          {pets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pet-sd-pet${petId === p.id ? ' on' : ''}`}
              onClick={() => setPetId(p.id)}
              aria-pressed={petId === p.id}
            >
              {p.name}
              {p.breed && <small>{p.breed}</small>}
            </button>
          ))}
        </div>
      ) : (
        <div className="pet-sd-inputs np-an" style={{ '--d': '300ms' } as React.CSSProperties}>
          <input
            className="pet-auth-input"
            placeholder="반려동물 이름"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <input
            className="pet-auth-input"
            placeholder="품종 (선택)"
            value={manualBreed}
            onChange={(e) => setManualBreed(e.target.value)}
          />
        </div>
      )}

      {/* summary */}
      {selectedService && (
        <section className="np-card pet-sd-summary np-an" style={{ '--d': '330ms' } as React.CSSProperties}>
          <span>
            {dayLabel(date).md}({dayLabel(date).dow}) {start || '시간 미선택'} · {selectedService.name}
          </span>
          <strong>{won(selectedService.price)}</strong>
        </section>
      )}

      {err && <div className="pet-sd-err">{err}</div>}
      {done && (
        <div className="pet-sd-ok">
          <Check size={16} />
          예약을 요청했어요. 내 예약으로 이동할게요.
        </div>
      )}

      {!consumer ? (
        <Link to="/pet/login" className="pet-cta" style={{ textDecoration: 'none' }}>
          <CalendarHeart size={18} />
          로그인하고 예약하기
        </Link>
      ) : (
        <button
          type="button"
          className="pet-cta"
          onClick={submit}
          disabled={submitting || done || services.length === 0}
        >
          <CalendarHeart size={18} />
          {submitting ? '요청 중…' : done ? '요청 완료' : '예약 요청'}
        </button>
      )}

      <p className="pet-legal">
        예약 요청 후 매장 확인을 거쳐 확정돼요 · 방문 전 매장 사정으로 변동될 수 있어요
      </p>
    </div>
  )
}
