import { create } from 'zustand'
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

// Static config / types / pure helpers are re-exported so screens import
// everything data-related from one place: '@/stores/data'.
export {
  STORE,
  DEMO_TODAY,
  STATUS_META,
  endTime,
} from '@/lib/mock/db'
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

/**
 * Reactive client-side "database" — mirrors the Supabase tables (CLAUDE.md §5).
 * All mutations are synchronous (= optimistic) here; when the real backend
 * lands, these actions become Supabase calls + TanStack Query mutations and
 * the screens that read these selectors stay unchanged.
 *
 * Tenant note: a single store (storeId) is seeded. Multi-store isolation
 * (the RLS analogue) would filter every list by the session's storeId.
 */

let counter = 0
function nid(prefix: string): string {
  counter += 1
  return `${prefix}${Date.now().toString(36)}${counter}`
}

interface DataState {
  storeId: string
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

  // customers & pets
  addCustomer: (input: { name: string; phone: string; notifyConsent: boolean }) => string
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  addPet: (input: {
    customerId: string
    name: string
    species: Species
    breed: string
    ageY: number
    weightKg: number
    temperament?: Temperament
  }) => string
  updatePet: (id: string, patch: Partial<Pet>) => void

  // services
  addService: (input: Omit<Service, 'id'>) => string
  updateService: (id: string, patch: Partial<Service>) => void

  // appointments
  addAppt: (input: {
    date: string
    start: string
    durationMin: number
    petId: string
    staffId: string
    serviceId: string
    deposit?: number
  }) => string
  updateApptStatus: (id: string, status: ApptStatus) => void
  setApptDeposit: (id: string, amount: number) => void
  cancelAppt: (id: string) => void
  /** No-show prevention: mark no-show AND bump the owner's no-show score. */
  markNoShow: (id: string) => void

  // payments
  payAppt: (apptId: string, input: { amount: number; method: PayMethod; discount: number }) => void

  // waitlist (no-show / cancellation slot fill)
  addWaitlist: (input: { petId: string; desired: string }) => string
  removeWaitlist: (id: string) => void
  /** Create an appointment from a waiting pet and drop it from the waitlist. */
  fillFromWaitlist: (
    waitId: string,
    slot: { date: string; start: string; staffId: string; serviceId: string },
  ) => void

  // boarding — checkout frees the cage
  checkOutBoarding: (id: string) => void

  // messages (mock send)
  sendMessage: (input: { customerId: string; template: MsgTemplate; at: string }) => void
}

export const useData = create<DataState>((set) => ({
  storeId: 'store1',
  customers: [...CUSTOMERS],
  pets: [...PETS],
  services: [...SERVICES],
  staff: [...STAFF],
  appts: [...APPTS],
  payments: [...PAYMENTS],
  cages: [...CAGES],
  boardings: [...BOARDINGS],
  messages: [...MESSAGES],
  waitlist: [...WAITLIST],

  addCustomer: (input) => {
    const id = nid('c')
    set((s) => ({
      customers: [{ id, name: input.name, phone: input.phone, notifyConsent: input.notifyConsent, noShowScore: 0 }, ...s.customers],
    }))
    return id
  },
  updateCustomer: (id, patch) =>
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  addPet: (input) => {
    const id = nid('p')
    const pet: Pet = {
      id,
      customerId: input.customerId,
      name: input.name,
      species: input.species,
      breed: input.breed,
      ageY: input.ageY,
      weightKg: input.weightKg,
      vaccinations: [],
      allergies: [],
      groomingNote: '',
      temperament: input.temperament ?? '온순',
    }
    set((s) => ({ pets: [...s.pets, pet] }))
    return id
  },
  updatePet: (id, patch) =>
    set((s) => ({ pets: s.pets.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  addService: (input) => {
    const id = nid('sv')
    set((s) => ({ services: [...s.services, { id, ...input }] }))
    return id
  },
  updateService: (id, patch) =>
    set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)) })),

  addAppt: (input) => {
    const id = nid('a')
    const appt: Appt = {
      id,
      date: input.date,
      start: input.start,
      durationMin: input.durationMin,
      petId: input.petId,
      staffId: input.staffId,
      serviceId: input.serviceId,
      status: 'confirmed',
      deposit: input.deposit ?? 0,
      paid: false,
    }
    set((s) => ({ appts: [...s.appts, appt] }))
    return id
  },
  updateApptStatus: (id, status) =>
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, status } : a)) })),
  setApptDeposit: (id, amount) =>
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, deposit: amount } : a)) })),
  cancelAppt: (id) =>
    set((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)) })),

  markNoShow: (id) =>
    set((s) => {
      const appt = s.appts.find((a) => a.id === id)
      const ownerId = appt ? s.pets.find((p) => p.id === appt.petId)?.customerId : undefined
      return {
        appts: s.appts.map((a) => (a.id === id ? { ...a, status: 'no_show' } : a)),
        customers: s.customers.map((c) =>
          c.id === ownerId ? { ...c, noShowScore: Math.min(5, c.noShowScore + 1) } : c,
        ),
      }
    }),

  payAppt: (apptId, input) =>
    set((s) => {
      const pay: Payment = {
        id: nid('pm'),
        apptId,
        amount: input.amount,
        method: input.method,
        discount: input.discount,
        unpaid: false,
        at: `${DEMO_TODAY_LOCAL} ${nowHM()}`,
      }
      return {
        payments: [pay, ...s.payments.filter((p) => !(p.apptId === apptId && p.unpaid))],
        appts: s.appts.map((a) =>
          a.id === apptId ? { ...a, paid: true, status: a.status === 'checked_in' ? 'done' : a.status } : a,
        ),
      }
    }),

  addWaitlist: (input) => {
    const id = nid('w')
    set((s) => ({
      waitlist: [...s.waitlist, { id, petId: input.petId, desired: input.desired, priority: s.waitlist.length + 1 }],
    }))
    return id
  },
  removeWaitlist: (id) => set((s) => ({ waitlist: s.waitlist.filter((w) => w.id !== id) })),
  fillFromWaitlist: (waitId, slot) =>
    set((s) => {
      const entry = s.waitlist.find((w) => w.id === waitId)
      if (!entry) return {}
      const sv = s.services.find((x) => x.id === slot.serviceId)
      const appt: Appt = {
        id: nid('a'),
        date: slot.date,
        start: slot.start,
        durationMin: sv?.durationMin ?? 60,
        petId: entry.petId,
        staffId: slot.staffId,
        serviceId: slot.serviceId,
        status: 'confirmed',
        deposit: 0,
        paid: false,
      }
      return { appts: [...s.appts, appt], waitlist: s.waitlist.filter((w) => w.id !== waitId) }
    }),

  checkOutBoarding: (id) => set((s) => ({ boardings: s.boardings.filter((b) => b.id !== id) })),

  sendMessage: (input) =>
    set((s) => ({
      messages: [{ id: nid('mg'), customerId: input.customerId, template: input.template, at: input.at, status: '발송' }, ...s.messages],
    })),
}))

// --- live (store-aware) lookups; safe to call inside render ---
export const petById = (id: string): Pet | undefined => useData.getState().pets.find((p) => p.id === id)
export const customerById = (id: string): Customer | undefined =>
  useData.getState().customers.find((c) => c.id === id)
export const serviceById = (id: string): Service | undefined =>
  useData.getState().services.find((s) => s.id === id)
export const staffById = (id: string): StaffMember | undefined =>
  useData.getState().staff.find((s) => s.id === id)
export const customerOfPet = (petId: string): Customer | undefined => {
  const pet = petById(petId)
  return pet ? customerById(pet.customerId) : undefined
}
export const petsOfCustomer = (customerId: string): Pet[] =>
  useData.getState().pets.filter((p) => p.customerId === customerId)
export const apptsOnDate = (date: string): Appt[] =>
  useData
    .getState()
    .appts.filter((a) => a.date === date)
    .sort((x, y) => x.start.localeCompare(y.start))

// small local helpers for payment timestamps (Date is fine in app runtime)
const DEMO_TODAY_LOCAL = '2026-06-24'
function nowHM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
