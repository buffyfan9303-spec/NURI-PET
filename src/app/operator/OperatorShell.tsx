import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUI } from '@/stores/ui'
import { cn } from '@/lib/cn'
import './operator.css'

export function OperatorShell() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  return (
    <div className={cn('op-shell', collapsed && 'is-collapsed')}>
      <Sidebar />
      <div className="op-main">
        <TopBar />
        <main className="op-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
