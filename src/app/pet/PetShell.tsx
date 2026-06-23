import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, TrendingUp, Sparkles, LayoutGrid, Plus } from 'lucide-react'
import { QUICK, PET_PROFILE } from '@/lib/mock/pet'
import '@/features/pet/pet.css'

export interface PetOutletContext {
  openLog: () => void
}

export function PetShell() {
  const [sheet, setSheet] = useState(false)
  const [pick, setPick] = useState<Record<string, string>>({ 식욕: '좋음', 음수: '많음', 활력: '보통' })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheet(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ctx: PetOutletContext = { openLog: () => setSheet(true) }

  return (
    <div className="pet-app">
      <div className={`pet-screen${sheet ? ' is-dim' : ''}`}>
        <Outlet context={ctx} />
      </div>

      <nav className="pet-nav">
        <NavLink to="/pet" end className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Home size={22} />
          <span>홈</span>
        </NavLink>
        <NavLink to="/pet/trend" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <TrendingUp size={22} />
          <span>추이</span>
        </NavLink>
        <button type="button" className="pet-fab" onClick={() => setSheet(true)} aria-label="컨디션 기록">
          <Plus size={24} />
        </button>
        <NavLink to="/pet/care" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Sparkles size={22} />
          <span>추천</span>
        </NavLink>
        <NavLink to="/pet/more" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <LayoutGrid size={22} />
          <span>더보기</span>
        </NavLink>
      </nav>

      <div className={`pet-backdrop${sheet ? ' show' : ''}`} onClick={() => setSheet(false)} />
      <div
        className={`pet-sheet${sheet ? ' show' : ''}`}
        role="dialog"
        aria-label="컨디션 기록"
        aria-modal="true"
      >
        <div className="pet-handle" />
        <h3 className="pet-sheet-title">오늘 {PET_PROFILE.name}는 어땠나요?</h3>
        <p className="pet-sheet-sub">탭 한 번으로 오늘 컨디션을 남겨요</p>
        {Object.keys(QUICK).map((k) => (
          <div className="pet-qrow" key={k}>
            <span className="pet-qlabel">{k}</span>
            <div className="pet-qchips">
              {QUICK[k].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={pick[k] === opt ? 'on' : undefined}
                  onClick={() => setPick({ ...pick, [k]: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="pet-memo">증상·메모 (선택)</div>
        <button type="button" className="pet-save" onClick={() => setSheet(false)}>
          기록 저장
        </button>
      </div>
    </div>
  )
}
