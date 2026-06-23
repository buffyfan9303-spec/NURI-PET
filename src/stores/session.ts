import { create } from 'zustand'

/**
 * Mock auth/session — mirrors Supabase Auth + the tenant/role model (CLAUDE.md §5).
 * Replaceable later by Supabase Auth: `user` comes from the session, `storeId`
 * scopes every query (the RLS analogue), `role` gates owner-only surfaces.
 */

export type Role = 'owner' | 'staff'

export interface SessionUser {
  staffId: string
  name: string
  email: string
  role: Role
  storeId: string
  storeName: string
}

interface MockAccount extends SessionUser {
  password: string
}

const STORE_NAME = '도그웰 살롱'

const ACCOUNTS: MockAccount[] = [
  { staffId: 'st1', name: '김미용', email: 'owner@dogwell.kr', password: 'nuri2026', role: 'owner', storeId: 'store1', storeName: STORE_NAME },
  { staffId: 'st2', name: '이그루', email: 'staff@dogwell.kr', password: 'nuri2026', role: 'staff', storeId: 'store1', storeName: STORE_NAME },
  { staffId: 'st3', name: '박트림', email: 'trim@dogwell.kr', password: 'nuri2026', role: 'staff', storeId: 'store1', storeName: STORE_NAME },
]

/** Public hint list for the login screen quick-fill (no passwords leaked beyond the demo pw). */
export const DEMO_ACCOUNTS = ACCOUNTS.map((a) => ({ email: a.email, role: a.role, name: a.name }))
export const DEMO_PASSWORD = 'nuri2026'

const KEY = 'nuripet-session'

function load(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

interface SessionState {
  user: SessionUser | null
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

export const useSession = create<SessionState>((set) => ({
  user: load(),
  login: (email, password) => {
    const acc = ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
    if (!acc || acc.password !== password) {
      return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    const { password: _pw, ...user } = acc
    void _pw
    try {
      localStorage.setItem(KEY, JSON.stringify(user))
    } catch {
      /* ignore */
    }
    set({ user })
    return { ok: true }
  },
  logout: () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    set({ user: null })
  },
}))
