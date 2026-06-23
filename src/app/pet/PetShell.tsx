import { Suspense, useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, CalendarHeart, LayoutGrid, Plus } from 'lucide-react'
import { useConsumer } from '@/stores/consumer'
import { addConditionLog } from '@/lib/consumer/api'
import { PageFade } from '@/components/PageFade'
import { QUICK } from '@/lib/mock/pet'
import '@/features/pet/pet.css'

export interface PetOutletContext {
  openLog: (petId?: string) => void
}

export function PetShell() {
  const pets = useConsumer((s) => s.pets)
  const consumer = useConsumer((s) => s.consumer)
  const bumpLog = useConsumer((s) => s.bumpLog)
  const [sheet, setSheet] = useState(false)
  const [logPetId, setLogPetId] = useState<string>('')
  const [pick, setPick] = useState<Record<string, string>>({ 식욕: '좋음', 음수: '많음', 활력: '보통' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheet(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openLog = (petId?: string) => {
    setLogPetId(petId ?? pets[0]?.id ?? '')
    setSheet(true)
  }
  const ctx: PetOutletContext = { openLog }

  const save = async () => {
    if (!logPetId) {
      setSheet(false)
      return
    }
    setSaving(true)
    await addConditionLog(logPetId, { appetite: pick.식욕, water: pick.음수, energy: pick.활력 })
    setSaving(false)
    bumpLog()
    setSheet(false)
  }

  const logPet = pets.find((p) => p.id === logPetId)

  return (
    <div className="pet-app">
      <div className={`pet-screen${sheet ? ' is-dim' : ''}`}>
        <Suspense fallback={null}>
          <PageFade>
            <Outlet context={ctx} />
          </PageFade>
        </Suspense>
      </div>

      <nav className="pet-nav">
        <NavLink to="/pet" end className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Home size={22} />
          <span>홈</span>
        </NavLink>
        <NavLink to="/pet/discover" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Search size={22} />
          <span>탐색</span>
        </NavLink>
        <button
          type="button"
          className="pet-fab"
          onClick={() => openLog()}
          aria-label="컨디션 기록"
          disabled={!consumer || pets.length === 0}
        >
          <Plus size={24} />
        </button>
        <NavLink to="/pet/bookings" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <CalendarHeart size={22} />
          <span>예약</span>
        </NavLink>
        <NavLink to="/pet/more" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <LayoutGrid size={22} />
          <span>더보기</span>
        </NavLink>
      </nav>

      <div className={`pet-backdrop${sheet ? ' show' : ''}`} onClick={() => setSheet(false)} />
      <div className={`pet-sheet${sheet ? ' show' : ''}`} role="dialog" aria-modal="true" aria-label="컨디션 기록">
        <div className="pet-handle" />
        <h3 className="pet-sheet-title">{logPet ? `${logPet.name} 오늘 컨디션` : '컨디션 기록'}</h3>
        <p className="pet-sheet-sub">탭 한 번으로 오늘 건강을 남겨요</p>
        {pets.length > 1 && (
          <div className="pet-qrow">
            <span className="pet-qlabel">반려동물</span>
            <div className="pet-qchips">
              {pets.map((p) => (
                <button key={p.id} type="button" className={logPetId === p.id ? 'on' : undefined} onClick={() => setLogPetId(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {Object.keys(QUICK).map((k) => (
          <div className="pet-qrow" key={k}>
            <span className="pet-qlabel">{k}</span>
            <div className="pet-qchips">
              {QUICK[k].map((opt) => (
                <button key={opt} type="button" className={pick[k] === opt ? 'on' : undefined} onClick={() => setPick({ ...pick, [k]: opt })}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button type="button" className="pet-save" onClick={save} disabled={saving}>
          {saving ? '저장 중…' : '기록 저장'}
        </button>
      </div>
    </div>
  )
}
