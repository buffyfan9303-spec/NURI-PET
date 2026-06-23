import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Wallet,
  BedDouble,
  Users,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react'
import { useUI } from '@/stores/ui'
import { useSession } from '@/stores/session'
import { staffById } from '@/stores/data'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  ownerOnly?: boolean
}

const PRIMARY: NavItem[] = [
  { to: '/app', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/app/appointments', label: '예약', icon: CalendarDays },
  { to: '/app/customers', label: '고객·펫', icon: PawPrint },
  { to: '/app/payments', label: '결제·장부', icon: Wallet },
  { to: '/app/boarding', label: '호텔·데이케어', icon: BedDouble },
]

const SECONDARY: NavItem[] = [
  { to: '/app/staff', label: '직원', icon: Users, ownerOnly: true },
  { to: '/app/messages', label: '알림톡', icon: MessageSquare },
  { to: '/app/settings', label: '설정', icon: Settings, ownerOnly: true },
]

function Item({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => (isActive ? 'active' : undefined)}
      title={item.label}
    >
      <span className="op-nav-ic">
        <Icon size={18} />
      </span>
      <span className="op-nav-label op-label">{item.label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggle = useUI((s) => s.toggleSidebar)
  const user = useSession((s) => s.user)
  const logout = useSession((s) => s.logout)

  const isOwner = user?.role === 'owner'
  const secondary = SECONDARY.filter((it) => !it.ownerOnly || isOwner)
  const avatarColor = user ? staffById(user.staffId)?.color ?? 'var(--accent)' : 'var(--accent)'

  return (
    <aside className="op-sb">
      <div className="op-sb-brand">
        <div className="op-sb-mark">N</div>
        <div className="op-sb-brandname op-label">
          <strong>NURI PET</strong>
          <span>운영자 OS</span>
        </div>
      </div>

      <nav className="op-nav">
        {PRIMARY.map((it) => (
          <Item key={it.to} item={it} />
        ))}
        <div className="op-nav-group op-label">관리</div>
        {secondary.map((it) => (
          <Item key={it.to} item={it} />
        ))}
      </nav>

      <div className="op-sb-foot">
        <div className="op-sb-user">
          <div className="op-sb-avatar" style={{ background: avatarColor }}>
            {user?.name.slice(0, 1) ?? '?'}
          </div>
          <div className="op-sb-user-txt op-label">
            <strong>{user?.name ?? '게스트'}</strong>
            <span>{isOwner ? '대표 (owner)' : '직원 (staff)'}</span>
          </div>
          <button
            type="button"
            className="op-sb-logout op-label"
            onClick={logout}
            title="로그아웃"
            aria-label="로그아웃"
          >
            <LogOut size={15} />
          </button>
        </div>
        <button type="button" className="op-collapse" onClick={toggle} aria-label="사이드바 접기/펼치기">
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          <span className="op-label">{collapsed ? '펼치기' : '접기'}</span>
        </button>
      </div>
    </aside>
  )
}
