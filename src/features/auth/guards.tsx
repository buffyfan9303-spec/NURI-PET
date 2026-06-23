import { Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useSession } from '@/stores/session'
import './auth.css'

/** Gate for /app — unauthenticated users go to /login (remembering where). */
export function RequireAuth() {
  const user = useSession((s) => s.user)
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Owner-only sub-tree (settings, staff). Staff see a clear "no access" page. */
export function RequireOwner() {
  const user = useSession((s) => s.user)
  if (user && user.role !== 'owner') {
    return (
      <div className="forbidden">
        <div className="forbidden-ic">
          <ShieldAlert size={26} />
        </div>
        <h2>접근 권한이 없습니다</h2>
        <p>이 화면은 대표(owner) 권한이 필요합니다. 직원 계정으로는 열 수 없어요.</p>
        <Link to="/app" className="np-btn">
          대시보드로 돌아가기
        </Link>
      </div>
    )
  }
  return <Outlet />
}
