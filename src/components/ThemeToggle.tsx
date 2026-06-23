import { Moon, Sun, Monitor } from 'lucide-react'
import { useUI } from '@/stores/ui'

export function ThemeToggle() {
  const theme = useUI((s) => s.theme)
  const cycle = useUI((s) => s.cycleTheme)
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템'
  return (
    <button
      type="button"
      className="np-iconbtn"
      onClick={cycle}
      title={`테마: ${label} (클릭하여 전환)`}
      aria-label={`테마 전환 — 현재 ${label}`}
    >
      <Icon size={17} />
    </button>
  )
}
