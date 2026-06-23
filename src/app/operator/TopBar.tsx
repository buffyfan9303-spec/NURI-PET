import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Smartphone } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { STORE } from '@/stores/data'
import { fmtDate, fmtWeekday, today } from '@/lib/date'

export function TopBar() {
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const d = today()

  return (
    <header className="op-top">
      <div className="op-top-store">
        <span className="op-store-name">{STORE.name}</span>
        <span className="np-badge t-muted">{STORE.type}</span>
      </div>
      <span className="op-top-date">
        {fmtDate(d)} · {fmtWeekday(d)}
      </span>

      <div className="op-search">
        <Search size={16} />
        <input
          ref={searchRef}
          className="np-input"
          placeholder="고객·펫·예약 검색"
          aria-label="전역 검색"
        />
        <kbd>F</kbd>
      </div>

      <div className="op-top-actions">
        <Link to="/pet" className="np-btn">
          <Smartphone size={16} /> 보호자 앱
        </Link>
        <button type="button" className="np-btn np-btn-primary">
          <Plus size={16} /> 새 예약
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
