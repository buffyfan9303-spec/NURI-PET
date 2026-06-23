import type * as React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, FileText, ShieldCheck, LayoutDashboard, LogOut, ChevronRight, Plus, PawPrint, LogIn } from 'lucide-react'
import { useConsumer } from '@/stores/consumer'
import './pet.css'
import './ConsumerMore.css'

const SPECIES = ['강아지', '고양이'] as const

export function ConsumerMore() {
  const navigate = useNavigate()
  const consumer = useConsumer((s) => s.consumer)
  const pets = useConsumer((s) => s.pets)
  const initializing = useConsumer((s) => s.initializing)
  const addPet = useConsumer((s) => s.addPet)
  const logout = useConsumer((s) => s.logout)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<string>('강아지')
  const [breed, setBreed] = useState('')
  const [ageY, setAgeY] = useState('')
  const [weight, setWeight] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (initializing) {
    return (
      <div className="pet-scroll">
        <p className="pet-legal" style={{ marginTop: '20vh' }}>
          불러오는 중…
        </p>
      </div>
    )
  }

  if (!consumer) {
    return (
      <div className="pet-scroll">
        <div className="pet-auth">
          <div className="pet-auth-logo">
            <PawPrint size={26} />
          </div>
          <h1 className="pet-auth-title">더보기</h1>
          <p className="pet-auth-sub">로그인하면 내 프로필과 반려동물을 관리할 수 있어요.</p>
          <Link to="/pet/login" className="pet-cta" style={{ marginTop: 26 }}>
            <LogIn size={17} /> 로그인하고 시작
          </Link>
        </div>
      </div>
    )
  }

  const resetForm = () => {
    setName('')
    setSpecies('강아지')
    setBreed('')
    setAgeY('')
    setWeight('')
    setErr('')
  }

  const submitPet = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!name.trim()) {
      setErr('이름을 입력해 주세요.')
      return
    }
    setBusy(true)
    const id = await addPet({
      name: name.trim(),
      species,
      breed: breed.trim(),
      ageY: Number(ageY) || 0,
      weightKg: Number(weight) || 0,
    })
    setBusy(false)
    if (!id) {
      setErr('추가하지 못했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    resetForm()
    setAdding(false)
  }

  const doLogout = async () => {
    await logout()
    navigate('/pet/login')
  }

  const initial = consumer.name.slice(0, 1)

  return (
    <div className="pet-scroll">
      <div className="pet-top np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div>
          <div className="pet-hello">더보기</div>
          <div className="pet-name">{consumer.name}</div>
          <div className="pet-meta">{consumer.phone || '연락처 미등록'}</div>
        </div>
        <div className="pet-avatar">
          <span>{initial}</span>
          <i />
        </div>
      </div>

      <div className="pet-sec-title np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
        내 반려동물
      </div>
      <div className="pet-petlist np-an" style={{ '--d': '90ms' } as React.CSSProperties}>
        {pets.length === 0 && !adding && (
          <div className="np-card pet-petcard">
            <span className="pet-petcard-av">
              <PawPrint size={18} />
            </span>
            <div className="pet-petcard-tx">
              <strong>아직 등록된 반려동물이 없어요</strong>
              <span>아래에서 추가해 주세요</span>
            </div>
          </div>
        )}
        {pets.map((p) => (
          <div className="np-card pet-petcard" key={p.id}>
            <span className="pet-petcard-av">{p.name.slice(0, 1)}</span>
            <div className="pet-petcard-tx">
              <strong>{p.name}</strong>
              <span>
                {[p.species, p.breed || null, p.ageY ? `${p.ageY}살` : null, p.weightKg ? `${p.weightKg}kg` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        ))}

        {adding ? (
          <form className="np-card pet-addform" onSubmit={submitPet}>
            <div>
              <label className="pet-field-label">이름</label>
              <input
                className="pet-auth-input"
                placeholder="우리 아이 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="pet-field-label">종</label>
              <div className="pet-sp-toggle">
                {SPECIES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={species === s ? 'on' : undefined}
                    onClick={() => setSpecies(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="pet-field-label">품종</label>
              <input
                className="pet-auth-input"
                placeholder="예: 말티즈, 코리안숏헤어"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div className="pet-addform-row">
              <div>
                <label className="pet-field-label">나이 (살)</label>
                <input
                  className="pet-auth-input"
                  inputMode="numeric"
                  placeholder="0"
                  value={ageY}
                  onChange={(e) => setAgeY(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div>
                <label className="pet-field-label">체중 (kg)</label>
                <input
                  className="pet-auth-input"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                />
              </div>
            </div>
            {err && <div className="pet-auth-err">{err}</div>}
            <button type="submit" className="pet-save" style={{ marginTop: 4 }} disabled={busy}>
              {busy ? '추가 중…' : '반려동물 추가'}
            </button>
            <button
              type="button"
              className="pet-addtoggle"
              onClick={() => {
                resetForm()
                setAdding(false)
              }}
            >
              취소
            </button>
          </form>
        ) : (
          <button type="button" className="pet-addtoggle" onClick={() => setAdding(true)}>
            <Plus size={17} /> 반려동물 추가
          </button>
        )}
      </div>

      <div className="pet-sec-title np-an" style={{ '--d': '120ms' } as React.CSSProperties}>
        설정
      </div>
      <div className="pet-rowlist np-card np-an" style={{ '--d': '150ms' } as React.CSSProperties}>
        <button type="button" className="pet-row">
          <span className="pet-row-ic">
            <Bell size={17} />
          </span>
          <span className="pet-row-label">알림 설정</span>
          <span className="pet-row-hint">리마인드 · 케어 알림</span>
          <ChevronRight size={16} className="pet-row-chev" />
        </button>
        <button type="button" className="pet-row">
          <span className="pet-row-ic">
            <FileText size={17} />
          </span>
          <span className="pet-row-label">이용약관</span>
          <ChevronRight size={16} className="pet-row-chev" />
        </button>
        <button type="button" className="pet-row">
          <span className="pet-row-ic">
            <ShieldCheck size={17} />
          </span>
          <span className="pet-row-label">개인정보 처리방침</span>
          <ChevronRight size={16} className="pet-row-chev" />
        </button>
        <Link to="/app" className="pet-row">
          <span className="pet-row-ic">
            <LayoutDashboard size={17} />
          </span>
          <span className="pet-row-label">운영자 OS</span>
          <span className="pet-row-hint">매장 관리</span>
          <ChevronRight size={16} className="pet-row-chev" />
        </Link>
        <button type="button" className="pet-row" onClick={doLogout}>
          <span className="pet-row-ic">
            <LogOut size={17} />
          </span>
          <span className="pet-row-label">로그아웃</span>
          <ChevronRight size={16} className="pet-row-chev" />
        </button>
      </div>

      <p className="pet-legal np-an" style={{ '--d': '190ms' } as React.CSSProperties}>
        건강 기록은 참고용이에요 · 진단·처방을 대신하지 않아요
      </p>
    </div>
  )
}
