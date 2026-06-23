import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * Auth/session backed by Supabase Auth (when configured). The session user is
 * derived from the linked `staff` row + its store; `storeId` scopes data (RLS),
 * `role` gates owner-only surfaces. Falls back to a no-backend stub otherwise.
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

export const DEMO_ACCOUNTS = [
  { email: 'owner@dogwell.kr', role: 'owner' as Role, name: '김미용' },
  { email: 'staff@dogwell.kr', role: 'staff' as Role, name: '이그루' },
  { email: 'trim@dogwell.kr', role: 'staff' as Role, name: '박트림' },
]
export const DEMO_PASSWORD = 'nuri2026'

/* eslint-disable @typescript-eslint/no-explicit-any */
async function loadStaff(userId: string, fallbackEmail: string): Promise<SessionUser | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('staff')
    .select('id,name,role,store_id,email,stores(name)')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  const row = data as any
  const store = Array.isArray(row.stores) ? row.stores[0] : row.stores
  return {
    staffId: row.id,
    name: row.name,
    email: row.email ?? fallbackEmail,
    role: row.role,
    storeId: row.store_id,
    storeName: store?.name ?? '',
  }
}

interface SessionState {
  user: SessionUser | null
  initializing: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  initializing: isSupabaseConfigured,

  init: async () => {
    if (!supabase) {
      set({ initializing: false })
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const u = await loadStaff(data.session.user.id, data.session.user.email ?? '')
      set({ user: u })
    }
    set({ initializing: false })
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await loadStaff(session.user.id, session.user.email ?? '')
        set({ user: u })
      } else {
        set({ user: null })
      }
    })
  },

  login: async (email, password) => {
    if (!supabase) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    const u = await loadStaff(data.user.id, data.user.email ?? email)
    if (!u) return { ok: false, error: '연결된 직원 정보가 없습니다. 관리자에게 문의하세요.' }
    set({ user: u })
    return { ok: true }
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut()
    set({ user: null })
  },
}))
