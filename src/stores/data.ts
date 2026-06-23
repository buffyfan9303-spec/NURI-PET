import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  CUSTOMERS,
  PETS,
  SERVICES,
  STAFF,
  APPTS,
  PAYMENTS,
  CAGES,
  BOARDINGS,
  MESSAGES,
  WAITLIST,
} from '@/lib/mock/db'
import type {
  Customer,
  Pet,
  Service,
  StaffMember,
  Appt,
  ApptStatus,
  Payment,
  PayMethod,
  Cage,
  Boarding,
  Message,
  MsgTemplate,
  WaitEntry,
  Species,
  Temperament,
} from '@/lib/mock/db'

export { STORE, DEMO_TODAY, STATUS_META, endTime } from '@/lib/mock/db'
export type {
  Customer,
  Pet,
  Service,
  ServiceCategory,
  StaffMember,
  Appt,
  ApptStatus,
  Payment,
  PayMethod,
  Cage,
  Boarding,
  Message,
  MsgTemplate,
  MsgStatus,
  WaitEntry,
  Vaccination,
  Species,
  Temperament,
} from '@/lib/mock/db'

const DEMO_TODAY_LOCAL = '2026-06-24'
function nowHM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function uid(): string {
  return crypto.randomUUID()
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>
const mCustomer = (r: Row): Customer => ({ id: r.id, name: r.name, phone: r.phone ?? '', notifyConsent: !!r.notify_consent, noShowScore: r.no_show_score ?? 0, memo: r.memo ?? undefined })
const mPet = (r: Row): Pet => ({ id: r.id, customerId: r.customer_id, name: r.name, species: r.species, breed: r.breed ?? '', ageY: r.age_y ?? 0, weightKg: Number(r.weight_kg ?? 0), vaccinations: r.vaccinations ?? [], allergies: r.allergies ?? [], groomingNote: r.grooming_note ?? '', temperament: r.temperament ?? '온순' })
const mService = (r: Row): Service => ({ id: r.id, category: r.category, name: r.name, price: r.price ?? 0, durationMin: r.duration_min ?? 60 })
const mStaff = (r: Row): StaffMember => ({ id: r.id, name: r.name, role: r.role, commissionRate: Number(r.commission_rate ?? 0), color: r.color ?? 'var(--accent)' })
const mAppt = (r: Row): Appt => ({ id: r.id, date: r.date, start: String(r.start_time).slice(0, 5), durationMin: r.duration_min ?? 60, petId: r.pet_id, staffId: r.staff_id, serviceId: r.service_id, status: r.status, deposit: r.deposit ?? 0, paid: !!r.paid })
const mPayment = (r: Row): Payment => ({ id: r.id, apptId: r.appointment_id, amount: r.amount ?? 0, method: r.method, discount: r.discount ?? 0, unpaid: !!r.unpaid, at: String(r.created_at ?? '').replace('T', ' ').slice(0, 16) })
const mCage = (r: Row): Cage => ({ id: r.id, label: r.label, size: r.size })
const mBoarding = (r: Row): Boarding => ({ id: r.id, petId: r.pet_id, checkIn: r.check_in, checkOut: r.check_out, cageId: r.cage_id, daycare: !!r.daycare, memo: r.memo ?? '' })
const mMessage = (r: Row): Message => ({ id: r.id, customerId: r.customer_id, template: r.template, at: String(r.sent_at ?? '').replace('T', ' ').slice(0, 16), status: r.status })
const mWait = (r: Row): WaitEntry => ({ id: r.id, petId: r.pet_id, desired: r.desired ?? '', priority: r.priority ?? 1 })

/** Fire-and-forget write-through to Supabase (optimistic local update already applied). */
function write(fn: (sb: any) => any): void {
  if (!supabase) return
  void Promise.resolve(fn(supabase))
    .then((res: any) => {
      if (res && res.error) console.warn('[supabase write]', res.error)
    })
    .catch((e: any) => console.warn('[supabase write]', e))
}

interface DataState {
  storeId: string | null
  loaded: boolean
  customers: Customer[]
  pets: Pet[]
  services: Service[]
  staff: StaffMember[]
  appts: Appt[]
  payments: Payment[]
  cages: Cage[]
  boardings: Boarding[]
  messages: Message[]
  waitlist: WaitEntry[]

  hydrate: (storeId: string) => Promise<void>
  reset: () => void

  addCustomer: (input: { name: string; phone: string; notifyConsent: boolean }) => string
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  addPet: (input: { customerId: string; name: string; species: Species; breed: string; ageY: number; weightKg: number; temperament?: Temperament }) => string
  updatePet: (id: string, patch: Partial<Pet>) => void
  addService: (input: Omit<Service, 'id'>) => string
  updateService: (id: string, patch: Partial<Service>) => void
  addAppt: (input: { date: string; start: string; durationMin: number; petId: string; staffId: string; serviceId: string; deposit?: number }) => string
  updateApptStatus: (id: string, status: ApptStatus) => void
  setApptDeposit: (id: string, amount: number) => void
  cancelAppt: (id: string) => void
  markNoShow: (id: string) => void
  payAppt: (apptId: string, input: { amount: number; method: PayMethod; discount: number }) => void
  addWaitlist: (input: { petId: string; desired: string }) => string
  removeWaitlist: (id: string) => void
  fillFromWaitlist: (waitId: string, slot: { date: string; start: string; staffId: string; serviceId: string }) => void
  checkOutBoarding: (id: string) => void
  sendMessage: (input: { customerId: string; template: MsgTemplate; at: string }) => void
}

const mock = !isSupabaseConfigured

export const useData = create<DataState>((set, get) => ({
  storeId: null,
  loaded: mock,
  customers: mock ? [...CUSTOMERS] : [],
  pets: mock ? [...PETS] : [],
  services: mock ? [...SERVICES] : [],
  staff: mock ? [...STAFF] : [],
  appts: mock ? [...APPTS] : [],
  payments: mock ? [...PAYMENTS] : [],
  cages: mock ? [...CAGES] : [],
  boardings: mock ? [...BOARDINGS] : [],
  messages: mock ? [...MESSAGES] : [],
  waitlist: mock ? [...WAITLIST] : [],

  hydrate: async (storeId) => {
    if (!supabase) return
    const sb = supabase
    const [c, p, sv, st, ap, pm, cg, bd, ms, wl] = await Promise.all([
      sb.from('customers').select('*'),
      sb.from('pets').select('*'),
      sb.from('services').select('*'),
      sb.from('staff').select('*'),
      sb.from('appointments').select('*'),
      sb.from('payments').select('*'),
      sb.from('cages').select('*'),
      sb.from('boarding').select('*'),
      sb.from('messages').select('*'),
      sb.from('waitlist').select('*'),
    ])
    set({
      storeId,
      loaded: true,
      customers: (c.data ?? []).map(mCustomer),
      pets: (p.data ?? []).map(mPet),
      services: (sv.data ?? []).map(mService),
      staff: (st.data ?? []).map(mStaff),
      appts: (ap.data ?? []).map(mAppt),
      payments: (pm.data ?? []).map(mPayment),
      cages: (cg.data ?? []).map(mCage),
      boardings: (bd.data ?? []).map(mBoarding),
      messages: (ms.data ?? []).map(mMessage),
      waitlist: (wl.data ?? []).map(mWait),
    })
  },
  reset: () =>
    set({ storeId: null, loaded: false, customers: [], pets: [], services: [], staff: [], appts: [], payments: [], cages: [], boardings: [], messages: [], waitlist: [] }),

  addCustomer: (input) => {
    const id = uid()
    set((s) => ({ customers: [{ id, name: input.name, phone: input.phone, notifyConsent: input.notifyConsent, noShowScore: 0 }, ...s.customers] }))
    const storeId = get().storeId
    write((sb) => sb.from('customers').insert({ id, store_id: storeId, name: input.name, phone: input.phone, notify_consent: input.notifyConsent, no_show_score: 0 }))
    return id
  },
  updateCustomer: (id, patch) => {
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.phone !== undefined) row.phone = patch.phone
    if (patch.notifyConsent !== undefined) row.notify_consent = patch.notifyConsent
    if (patch.noShowScore !== undefined) row.no_show_score = patch.noShowScore
    if (patch.memo !== undefined) row.memo = patch.memo
    write((sb) => sb.from('customers').update(row).eq('id', id))
  },

  addPet: (input) => {
    const id = uid()
    const pet: Pet = { id, customerId: input.customerId, name: input.name, species: input.species, breed: input.breed, ageY: input.ageY, weightKg: input.weightKg, vaccinations: [], allergies: [], groomingNote: '', temperament: input.temperament ?? '온순' }
    set((s) => ({ pets: [...s.pets, pet] }))
    const storeId = get().storeId
    write((sb) => sb.from('pets').insert({ id, store_id: storeId, customer_id: input.customerId, name: input.name, species: input.species, breed: input.breed, age_y: input.ageY, weight_kg: input.weightKg, temperament: pet.temperament }))
    return id
  },
  updatePet: (id, patch) => {
    set((s) => ({ pets: s.pets.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.breed !== undefined) row.breed = patch.breed
    if (patch.species !== undefined) row.species = patch.species
    if (patch.ageY !== undefined) row.age_y = patch.ageY
    if (patch.weightKg !== undefined) row.weight_kg = patch.weightKg
    if (patch.groomingNote !== undefined) row.grooming_note = patch.groomingNote
    if (patch.temperament !== undefined) row.temperament = patch.temperament
    write((sb) => sb.from('pets').update(row).eq('id', id))
  },

  addService: (input) => {
    const id = uid()
    set((s) => ({ services: [...s.services, { id, ...input }] }))
    const storeId = get().storeId
    write((sb) => sb.from('services').insert({ id, store_id: storeId, category: input.category, name: input.name, price: input.price, duration_min: input.durationMin }))
    return id
  },
  updateService: (id, patch) => {
    set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)) }))
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.category !== undefined) row.category = patch.category
    if (patch.price !== undefined) row.price = patch.price
    if (patch.durationMin !== undefined) row.duration_min = patch.durationMin
    write((sb) => sb.from('services').update(row).eq('id', id))
  },

  addAppt: (input) => {
    const id = uid()
    const appt: Appt = { id, date: input.date, start: input.start, durationMin: input.durationMin, petId: input.petId, staffId: input.staffId, serviceId: input.serviceId, status: 'confirmed', deposit: input.deposit ?? 0, paid: false }
    set((s) => ({ appts: [...s.appts, appt] }))
    const storeId = get().storeId
    write((sb) => sb.from('appointments').insert({ id, store_id: storeId, pet_id: input.petId, staff_id: input.staffId, service_id: input.serviceId, date: input.date, start_time: input.start, duration_min: input.durationMin, status: 'confirmed', deposit: appt.deposit, paid: false }))
    return id
  },
  updateApptStatus: (id, status) => {
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, status } : a)) }))
    write((sb) => sb.from('appointments').update({ status }).eq('id', id))
  },
  setApptDeposit: (id, amount) => {
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, deposit: amount } : a)) }))
    write((sb) => sb.from('appointments').update({ deposit: amount }).eq('id', id))
  },
  cancelAppt: (id) => {
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)) }))
    write((sb) => sb.from('appointments').update({ status: 'cancelled' }).eq('id', id))
  },
  markNoShow: (id) => {
    set((s) => {
      const appt = s.appts.find((a) => a.id === id)
      const ownerId = appt ? s.pets.find((p) => p.id === appt.petId)?.customerId : undefined
      return {
        appts: s.appts.map((a) => (a.id === id ? { ...a, status: 'no_show' } : a)),
        customers: s.customers.map((c) => (c.id === ownerId ? { ...c, noShowScore: Math.min(5, c.noShowScore + 1) } : c)),
      }
    })
    const st = get()
    const appt = st.appts.find((a) => a.id === id)
    const owner = appt ? st.customers.find((c) => c.id === st.pets.find((p) => p.id === appt.petId)?.customerId) : undefined
    write((sb) => sb.from('appointments').update({ status: 'no_show' }).eq('id', id))
    if (owner) write((sb) => sb.from('customers').update({ no_show_score: owner.noShowScore }).eq('id', owner.id))
  },

  payAppt: (apptId, input) => {
    const pid = uid()
    set((s) => {
      const appt = s.appts.find((a) => a.id === apptId)
      const newStatus: ApptStatus = appt && appt.status === 'checked_in' ? 'done' : (appt?.status ?? 'done')
      return {
        payments: [{ id: pid, apptId, amount: input.amount, method: input.method, discount: input.discount, unpaid: false, at: `${DEMO_TODAY_LOCAL} ${nowHM()}` }, ...s.payments.filter((p) => !(p.apptId === apptId && p.unpaid))],
        appts: s.appts.map((a) => (a.id === apptId ? { ...a, paid: true, status: newStatus } : a)),
      }
    })
    const storeId = get().storeId
    const appt = get().appts.find((a) => a.id === apptId)
    write((sb) => sb.from('payments').insert({ id: pid, store_id: storeId, appointment_id: apptId, amount: input.amount, method: input.method, discount: input.discount, unpaid: false }))
    write((sb) => sb.from('appointments').update({ paid: true, status: appt?.status }).eq('id', apptId))
  },

  addWaitlist: (input) => {
    const id = uid()
    set((s) => ({ waitlist: [...s.waitlist, { id, petId: input.petId, desired: input.desired, priority: s.waitlist.length + 1 }] }))
    const storeId = get().storeId
    write((sb) => sb.from('waitlist').insert({ id, store_id: storeId, pet_id: input.petId, desired: input.desired, priority: get().waitlist.length }))
    return id
  },
  removeWaitlist: (id) => {
    set((s) => ({ waitlist: s.waitlist.filter((w) => w.id !== id) }))
    write((sb) => sb.from('waitlist').delete().eq('id', id))
  },
  fillFromWaitlist: (waitId, slot) => {
    const apptId = uid()
    set((s) => {
      const entry = s.waitlist.find((w) => w.id === waitId)
      if (!entry) return {}
      const sv = s.services.find((x) => x.id === slot.serviceId)
      const appt: Appt = { id: apptId, date: slot.date, start: slot.start, durationMin: sv?.durationMin ?? 60, petId: entry.petId, staffId: slot.staffId, serviceId: slot.serviceId, status: 'confirmed', deposit: 0, paid: false }
      return { appts: [...s.appts, appt], waitlist: s.waitlist.filter((w) => w.id !== waitId) }
    })
    const storeId = get().storeId
    const created = get().appts.find((a) => a.id === apptId)
    if (created) {
      write((sb) => sb.from('appointments').insert({ id: apptId, store_id: storeId, pet_id: created.petId, staff_id: created.staffId, service_id: created.serviceId, date: created.date, start_time: created.start, duration_min: created.durationMin, status: 'confirmed', deposit: 0, paid: false }))
      write((sb) => sb.from('waitlist').delete().eq('id', waitId))
    }
  },

  checkOutBoarding: (id) => {
    set((s) => ({ boardings: s.boardings.filter((b) => b.id !== id) }))
    write((sb) => sb.from('boarding').delete().eq('id', id))
  },

  sendMessage: (input) => {
    const id = uid()
    set((s) => ({ messages: [{ id, customerId: input.customerId, template: input.template, at: input.at, status: '발송' }, ...s.messages] }))
    const storeId = get().storeId
    write((sb) => sb.from('messages').insert({ id, store_id: storeId, customer_id: input.customerId, template: input.template, status: '발송' }))
  },
}))

// live (store-aware) lookups; safe inside render
export const petById = (id: string): Pet | undefined => useData.getState().pets.find((p) => p.id === id)
export const customerById = (id: string): Customer | undefined => useData.getState().customers.find((c) => c.id === id)
export const serviceById = (id: string): Service | undefined => useData.getState().services.find((s) => s.id === id)
export const staffById = (id: string): StaffMember | undefined => useData.getState().staff.find((s) => s.id === id)
export const customerOfPet = (petId: string): Customer | undefined => {
  const pet = petById(petId)
  return pet ? customerById(pet.customerId) : undefined
}
export const petsOfCustomer = (customerId: string): Pet[] => useData.getState().pets.filter((p) => p.customerId === customerId)
export const apptsOnDate = (date: string): Appt[] => useData.getState().appts.filter((a) => a.date === date).sort((x, y) => x.start.localeCompare(y.start))
