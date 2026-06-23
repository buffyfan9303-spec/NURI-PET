import type * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Store, Scissors, Bath, Stethoscope, Home, SearchX } from 'lucide-react'
import { listStores } from '@/lib/consumer/api'
import type { StoreDir } from '@/lib/consumer/api'
import './Discover.css'

const ALL = '전체'

/** Map a store type label to a placeholder icon (used when imageUrl is absent). */
function typeIcon(type: string): typeof Store {
  if (type.includes('미용') || type.includes('그루밍')) return Scissors
  if (type.includes('목욕') || type.includes('스파')) return Bath
  if (type.includes('병원') || type.includes('의료')) return Stethoscope
  if (type.includes('호텔') || type.includes('보딩') || type.includes('데이케어')) return Home
  return Store
}

function priceLine(s: StoreDir): string {
  const count = `서비스 ${s.serviceCount}개`
  if (s.fromPrice == null) return count
  return `${count} · ${s.fromPrice.toLocaleString('ko-KR')}원~`
}

export function Discover() {
  const [stores, setStores] = useState<StoreDir[] | null>(null)
  const [type, setType] = useState<string>(ALL)
  const [q, setQ] = useState('')

  useEffect(() => {
    let live = true
    listStores()
      .then((rows) => {
        if (live) setStores(rows)
      })
      .catch(() => {
        if (live) setStores([])
      })
    return () => {
      live = false
    }
  }, [])

  const types = useMemo(() => {
    if (!stores) return [ALL]
    const set: string[] = []
    for (const s of stores) if (s.type && !set.includes(s.type)) set.push(s.type)
    return [ALL, ...set]
  }, [stores])

  const filtered = useMemo(() => {
    if (!stores) return []
    const needle = q.trim().toLowerCase()
    return stores.filter((s) => {
      if (type !== ALL && s.type !== type) return false
      if (needle && !s.name.toLowerCase().includes(needle)) return false
      return true
    })
  }, [stores, type, q])

  const loading = stores === null

  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">탐색</div>
          <div className="pet-name">동네 펫 서비스</div>
          <div className="pet-meta">미용 · 목욕 · 호텔까지 한 곳에서</div>
        </div>
      </div>

      {/* search */}
      <div className="pet-disc-search np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        <Search size={17} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="매장 이름 검색"
          aria-label="매장 이름 검색"
        />
      </div>

      {/* type filter */}
      <div className="pet-disc-filter np-an" style={{ '--d': '110ms' } as React.CSSProperties}>
        {types.map((t) => (
          <button key={t} type="button" className={t === type ? 'on' : undefined} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="pet-disc-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="pet-disc-skel np-an" style={{ '--d': `${140 + i * 50}ms` } as React.CSSProperties} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="pet-disc-empty np-an" style={{ '--d': '140ms' } as React.CSSProperties}>
          <SearchX size={30} />
          <div>
            {stores && stores.length === 0
              ? '아직 등록된 매장이 없어요.'
              : '조건에 맞는 매장이 없어요.\n검색어나 업종을 바꿔보세요.'}
          </div>
        </div>
      ) : (
        <div className="pet-disc-list">
          {filtered.map((s, i) => {
            const Icon = typeIcon(s.type)
            return (
              <Link
                key={s.id}
                to={`/pet/store/${s.id}`}
                className="np-card pet-disc-card np-an"
                style={{ '--d': `${140 + Math.min(i, 6) * 45}ms` } as React.CSSProperties}
              >
                {s.imageUrl ? (
                  <img className="pet-disc-thumb" src={s.imageUrl} alt="" loading="lazy" />
                ) : (
                  <span className="pet-disc-thumb" aria-hidden>
                    <Icon size={24} />
                  </span>
                )}
                <div className="pet-disc-body">
                  <div className="pet-disc-row1">
                    <span className="pet-disc-name">{s.name}</span>
                    {s.type && <span className="np-badge t-accent">{s.type}</span>}
                  </div>
                  <span className="pet-disc-price">
                    <b>{priceLine(s)}</b>
                  </span>
                  {(s.intro || s.address) && <span className="pet-disc-sub">{s.intro || s.address}</span>}
                </div>
                <ChevronRight size={18} className="pet-disc-chev" />
              </Link>
            )
          })}
        </div>
      )}

      <p className="pet-legal np-an" style={{ '--d': '420ms' } as React.CSSProperties}>
        매장 정보는 각 업체가 제공해요 · 예약 요청은 로그인 후 가능해요
      </p>
    </div>
  )
}
