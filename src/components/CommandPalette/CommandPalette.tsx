import type * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Wallet,
  BedDouble,
  Users,
  MessageSquare,
  Settings,
  Smartphone,
  LayoutGrid,
  SunMoon,
  Plus,
  Search,
} from 'lucide-react'
import { useUI } from '@/stores/ui'
import './command.css'

type Run = { to: string } | { theme: true }

interface Cmd {
  id: string
  label: string
  group: string
  hint?: string
  icon: typeof LayoutDashboard
  keywords: string
  run: Run
}

const COMMANDS: Cmd[] = [
  { id: 'new', label: '새 예약 만들기', group: '액션', hint: 'N', icon: Plus, keywords: 'new appointment 예약 추가', run: { to: '/app/appointments' } },
  { id: 'theme', label: '테마 전환 (다크/라이트/시스템)', group: '액션', icon: SunMoon, keywords: 'theme dark light 다크 라이트 테마', run: { theme: true } },
  { id: 'dashboard', label: '대시보드', group: '이동', icon: LayoutDashboard, keywords: 'dashboard home 홈', run: { to: '/app' } },
  { id: 'appointments', label: '예약 캘린더', group: '이동', icon: CalendarDays, keywords: 'calendar 캘린더 일정', run: { to: '/app/appointments' } },
  { id: 'customers', label: '고객·펫', group: '이동', icon: PawPrint, keywords: 'customer pet 고객 반려 강아지', run: { to: '/app/customers' } },
  { id: 'payments', label: '결제·장부', group: '이동', icon: Wallet, keywords: 'payment pos 정산 결제 미수금', run: { to: '/app/payments' } },
  { id: 'boarding', label: '호텔·데이케어', group: '이동', icon: BedDouble, keywords: 'hotel boarding 케이지 숙박', run: { to: '/app/boarding' } },
  { id: 'staff', label: '직원', group: '이동', icon: Users, keywords: 'staff 커미션 스케줄', run: { to: '/app/staff' } },
  { id: 'messages', label: '알림톡', group: '이동', icon: MessageSquare, keywords: 'kakao message 알림 발송', run: { to: '/app/messages' } },
  { id: 'settings', label: '설정', group: '이동', icon: Settings, keywords: 'settings 서비스 가격 영업시간', run: { to: '/app/settings' } },
  { id: 'pet', label: '보호자 앱 열기', group: '이동', icon: Smartphone, keywords: 'owner mobile 보호자 컨디션', run: { to: '/pet' } },
  { id: 'launcher', label: '제품 런처', group: '이동', icon: LayoutGrid, keywords: 'launcher home 시작', run: { to: '/' } },
]

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen)
  const setOpen = useUI((s) => s.setCommandOpen)
  const cycleTheme = useUI((s) => s.cycleTheme)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUI.getState().commandOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q),
    )
  }, [query])

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  if (!open) return null

  const execute = (cmd: Cmd) => {
    if ('theme' in cmd.run) {
      cycleTheme()
      return
    }
    navigate(cmd.run.to)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) execute(cmd)
    }
  }

  let lastGroup = ''
  return (
    <div className="cmdk-backdrop" onClick={() => setOpen(false)}>
      <div
        className="cmdk"
        role="dialog"
        aria-label="명령 팔레트"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmdk-search">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="명령 또는 화면 검색…"
            aria-label="명령 검색"
          />
          <span className="cmdk-esc">ESC</span>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {filtered.length === 0 && <div className="cmdk-empty">결과 없음</div>}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            return (
              <div key={cmd.id}>
                {showGroup && <div className="cmdk-group">{cmd.group}</div>}
                <div
                  className="cmdk-item"
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => execute(cmd)}
                >
                  <span className="cmdk-item-ic">
                    <Icon size={17} />
                  </span>
                  <span className="cmdk-item-label">{cmd.label}</span>
                  {cmd.hint && <span className="cmdk-item-hint">{cmd.hint}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
