import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/** Re-keys on route change so each page fades in cohesively as one unit
 *  (instead of elements staggering in separately). */
export function PageFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  )
}
