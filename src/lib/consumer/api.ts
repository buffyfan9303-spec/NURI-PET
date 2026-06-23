import { supabase } from '@/lib/supabase/client'

/* Consumer (보호자) marketplace data access — Supabase queries.
   Stores/services are public-read; bookings go through the book_appointment RPC;
   consumers read their own appointments via the consumer_id RLS policy. */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface StoreDir {
  id: string
  name: string
  type: string
  open: string
  close: string
  serviceCount: number
  fromPrice: number | null
  intro?: string | null
  address?: string | null
  imageUrl?: string | null
}

export interface StoreService {
  id: string
  category: string
  name: string
  price: number
  durationMin: number
}

export interface ConsumerPet {
  id: string
  name: string
  species: string
  breed: string
  ageY: number
  weightKg: number
  careTag: string
}

export interface Booking {
  id: string
  date: string
  start: string
  status: string
  storeName: string
  storeType: string
  serviceName: string
  servicePrice: number
  petName: string
}

export interface ConditionLog {
  id: string
  date: string
  appetite: string | null
  water: string | null
  energy: string | null
  weightKg: number | null
  memo: string | null
}

function sb() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

export async function listStores(): Promise<StoreDir[]> {
  const { data } = await sb().from('store_directory').select('*').order('name')
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    open: String(r.open ?? '').slice(0, 5),
    close: String(r.close ?? '').slice(0, 5),
    serviceCount: r.service_count ?? 0,
    fromPrice: r.from_price ?? null,
    intro: r.intro ?? null,
    address: r.address ?? null,
    imageUrl: r.image_url ?? null,
  }))
}

export async function getStore(id: string): Promise<{ store: StoreDir | null; services: StoreService[] }> {
  const [s, sv] = await Promise.all([
    sb().from('stores').select('*').eq('id', id).maybeSingle(),
    sb().from('services').select('*').eq('store_id', id).order('price'),
  ])
  const r: any = s.data
  const store: StoreDir | null = r
    ? { id: r.id, name: r.name, type: r.type, open: String(r.open ?? '').slice(0, 5), close: String(r.close ?? '').slice(0, 5), serviceCount: 0, fromPrice: null, intro: r.intro ?? null, address: r.address ?? null, imageUrl: r.image_url ?? null }
    : null
  const services: StoreService[] = (sv.data ?? []).map((x: any) => ({ id: x.id, category: x.category, name: x.name, price: x.price ?? 0, durationMin: x.duration_min ?? 60 }))
  return { store, services }
}

export async function bookAppointment(params: {
  storeId: string
  serviceId: string
  date: string
  start: string
  petName: string
  species: string
  breed: string
  ownerName: string
  phone: string
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await sb().rpc('book_appointment', {
    p_store_id: params.storeId,
    p_service_id: params.serviceId,
    p_date: params.date,
    p_start_time: params.start,
    p_pet_name: params.petName,
    p_species: params.species,
    p_breed: params.breed,
    p_owner_name: params.ownerName,
    p_phone: params.phone,
  })
  return { id: (data as string) ?? null, error: error ? error.message : null }
}

export async function myBookings(): Promise<Booking[]> {
  const { data } = await sb()
    .from('appointments')
    .select('id,date,start_time,status,created_at, stores(name,type), services(name,price), pets(name)')
    .order('date', { ascending: false })
  return (data ?? []).map((r: any) => {
    const store = Array.isArray(r.stores) ? r.stores[0] : r.stores
    const svc = Array.isArray(r.services) ? r.services[0] : r.services
    const pet = Array.isArray(r.pets) ? r.pets[0] : r.pets
    return {
      id: r.id,
      date: r.date,
      start: String(r.start_time ?? '').slice(0, 5),
      status: r.status,
      storeName: store?.name ?? '매장',
      storeType: store?.type ?? '',
      serviceName: svc?.name ?? '서비스',
      servicePrice: svc?.price ?? 0,
      petName: pet?.name ?? '내 반려동물',
    }
  })
}

export async function listConditionLogs(petId: string): Promise<ConditionLog[]> {
  const { data } = await sb()
    .from('pet_condition_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('date', { ascending: false })
    .limit(30)
  return (data ?? []).map((r: any) => ({ id: r.id, date: r.date, appetite: r.appetite, water: r.water, energy: r.energy, weightKg: r.weight_kg, memo: r.memo }))
}

export async function addConditionLog(petId: string, input: { appetite?: string; water?: string; energy?: string; weightKg?: number; memo?: string }): Promise<void> {
  await sb().from('pet_condition_logs').insert({
    pet_id: petId,
    date: new Date().toISOString().slice(0, 10),
    appetite: input.appetite ?? null,
    water: input.water ?? null,
    energy: input.energy ?? null,
    weight_kg: input.weightKg ?? null,
    memo: input.memo ?? null,
  })
}
