import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { ConsumerPet } from '@/lib/consumer/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Consumer {
  id: string
  name: string
  phone: string
}

function mapPet(r: any): ConsumerPet {
  return { id: r.id, name: r.name, species: r.species, breed: r.breed ?? '', ageY: r.age_y ?? 0, weightKg: Number(r.weight_kg ?? 0), careTag: r.care_tag ?? '' }
}

async function loadProfile(userId: string): Promise<Consumer | null> {
  if (!supabase) return null
  const { data } = await supabase.from('consumer_profiles').select('id,name,phone').eq('id', userId).maybeSingle()
  if (!data) return null
  return { id: data.id, name: data.name ?? '보호자', phone: data.phone ?? '' }
}

async function fetchPets(): Promise<ConsumerPet[]> {
  if (!supabase) return []
  const { data } = await supabase.from('consumer_pets').select('*').order('created_at')
  return (data ?? []).map(mapPet)
}

interface ConsumerState {
  consumer: Consumer | null
  pets: ConsumerPet[]
  initializing: boolean
  logVersion: number
  bumpLog: () => void
  init: () => Promise<void>
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ ok: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refreshPets: () => Promise<void>
  addPet: (input: { name: string; species: string; breed: string; ageY: number; weightKg: number; careTag?: string }) => Promise<string | null>
}

export const useConsumer = create<ConsumerState>((set, get) => ({
  consumer: null,
  pets: [],
  initializing: isSupabaseConfigured,
  logVersion: 0,
  bumpLog: () => set((s) => ({ logVersion: s.logVersion + 1 })),

  init: async () => {
    if (!supabase) {
      set({ initializing: false })
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const c = await loadProfile(data.session.user.id)
      if (c) set({ consumer: c, pets: await fetchPets() })
    }
    set({ initializing: false })
    supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const c = await loadProfile(session.user.id)
        if (c) set({ consumer: c, pets: await fetchPets() })
      } else {
        set({ consumer: null, pets: [] })
      }
    })
  },

  signUp: async (email, password, name, phone) => {
    if (!supabase) return { ok: false, error: 'Supabase 미설정' }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return { ok: false, error: error.message }
    if (!data.session || !data.user) {
      return { ok: false, error: '가입 확인 메일을 확인하거나 데모 계정으로 로그인하세요.' }
    }
    await supabase.from('consumer_profiles').upsert({ id: data.user.id, name, phone })
    set({ consumer: { id: data.user.id, name, phone }, pets: await fetchPets() })
    return { ok: true }
  },

  login: async (email, password) => {
    if (!supabase) return { ok: false, error: 'Supabase 미설정' }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    let c = await loadProfile(data.user.id)
    if (!c) {
      await supabase.from('consumer_profiles').upsert({ id: data.user.id, name: '보호자', phone: '' })
      c = { id: data.user.id, name: '보호자', phone: '' }
    }
    set({ consumer: c, pets: await fetchPets() })
    return { ok: true }
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut()
    set({ consumer: null, pets: [] })
  },

  refreshPets: async () => {
    set({ pets: await fetchPets() })
  },

  addPet: async (input) => {
    const c = get().consumer
    if (!supabase || !c) return null
    const { data, error } = await supabase
      .from('consumer_pets')
      .insert({ owner_id: c.id, name: input.name, species: input.species, breed: input.breed, age_y: input.ageY, weight_kg: input.weightKg, care_tag: input.careTag ?? null })
      .select('id')
      .maybeSingle()
    if (error) return null
    await get().refreshPets()
    return (data as any)?.id ?? null
  },
}))
