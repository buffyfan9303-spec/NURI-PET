import { create } from 'zustand'

export type ThemePref = 'light' | 'dark' | 'system'

const KEY = 'nuripet-theme'

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(p: ThemePref): 'light' | 'dark' {
  return p === 'system' ? (systemDark() ? 'dark' : 'light') : p
}

export function applyTheme(p: ThemePref): void {
  const r = resolve(p)
  const el = document.documentElement
  el.classList.toggle('dark', r === 'dark')
  el.classList.toggle('light', r === 'light')
}

interface UIState {
  theme: ThemePref
  resolved: 'light' | 'dark'
  sidebarCollapsed: boolean
  commandOpen: boolean
  setTheme: (t: ThemePref) => void
  cycleTheme: () => void
  toggleSidebar: () => void
  setCommandOpen: (v: boolean) => void
}

const initialTheme = ((): ThemePref => {
  try {
    return (localStorage.getItem(KEY) as ThemePref) || 'dark'
  } catch {
    return 'dark'
  }
})()

export const useUI = create<UIState>((set, get) => ({
  theme: initialTheme,
  resolved: resolve(initialTheme),
  sidebarCollapsed: false,
  commandOpen: false,
  setTheme: (t) => {
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* ignore */
    }
    applyTheme(t)
    set({ theme: t, resolved: resolve(t) })
  },
  cycleTheme: () => {
    const order: ThemePref[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(get().theme) + 1) % order.length]
    get().setTheme(next)
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandOpen: (v) => set({ commandOpen: v }),
}))
