// Seed transactional demo data into Supabase from the mock db.ts (service key).
// Idempotent: skips if customers already exist. Usage: node scripts/seed-data.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import {
  CUSTOMERS, PETS, SERVICES, STAFF, APPTS, PAYMENTS, CAGES, BOARDINGS, MESSAGES, WAITLIST,
} from '../src/lib/mock/db.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const URL = 'https://pothwgpmdltykjzzcyga.supabase.co'
const STORE_ID = '11111111-1111-1111-1111-111111111111'

const env = {}
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}
const sb = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  const { count } = await sb.from('customers').select('*', { count: 'exact', head: true })
  if (count && count > 0) { console.log(`customers already has ${count} rows — skipping seed.`); return }

  // resolve DB uuids for staff (by name), services (by name), cages (by label)
  const [{ data: dbStaff }, { data: dbServices }, { data: dbCages }] = await Promise.all([
    sb.from('staff').select('id,name'),
    sb.from('services').select('id,name'),
    sb.from('cages').select('id,label'),
  ])
  const staffByName = Object.fromEntries(dbStaff.map((s) => [s.name, s.id]))
  const svcByName = Object.fromEntries(dbServices.map((s) => [s.name, s.id]))
  const cageByLabel = Object.fromEntries(dbCages.map((c) => [c.label, c.id]))

  const staffUuid = Object.fromEntries(STAFF.map((s) => [s.id, staffByName[s.name]]))
  const svcUuid = Object.fromEntries(SERVICES.map((s) => [s.id, svcByName[s.name]]))
  const cageUuid = Object.fromEntries(CAGES.map((c) => [c.id, cageByLabel[c.label]]))
  const custUuid = Object.fromEntries(CUSTOMERS.map((c) => [c.id, randomUUID()]))
  const petUuid = Object.fromEntries(PETS.map((p) => [p.id, randomUUID()]))
  const apptUuid = Object.fromEntries(APPTS.map((a) => [a.id, randomUUID()]))

  const ins = async (table, rows) => {
    const { error } = await sb.from(table).insert(rows)
    if (error) { console.error(`✗ ${table}:`, error.message); throw error }
    console.log(`  ✓ ${table}: ${rows.length}`)
  }

  await ins('customers', CUSTOMERS.map((c) => ({ id: custUuid[c.id], store_id: STORE_ID, name: c.name, phone: c.phone, notify_consent: c.notifyConsent, no_show_score: c.noShowScore, memo: c.memo ?? null })))
  await ins('pets', PETS.map((p) => ({ id: petUuid[p.id], store_id: STORE_ID, customer_id: custUuid[p.customerId], name: p.name, species: p.species, breed: p.breed, age_y: p.ageY, weight_kg: p.weightKg, vaccinations: p.vaccinations, allergies: p.allergies, grooming_note: p.groomingNote, temperament: p.temperament })))
  await ins('appointments', APPTS.map((a) => ({ id: apptUuid[a.id], store_id: STORE_ID, pet_id: petUuid[a.petId], staff_id: staffUuid[a.staffId], service_id: svcUuid[a.serviceId], date: a.date, start_time: a.start, duration_min: a.durationMin, status: a.status, deposit: a.deposit, paid: a.paid })))
  await ins('payments', PAYMENTS.map((pm) => ({ id: randomUUID(), store_id: STORE_ID, appointment_id: apptUuid[pm.apptId], amount: pm.amount, method: pm.method, discount: pm.discount, unpaid: pm.unpaid })))
  await ins('boarding', BOARDINGS.map((b) => ({ id: randomUUID(), store_id: STORE_ID, pet_id: petUuid[b.petId], cage_id: cageUuid[b.cageId], check_in: b.checkIn, check_out: b.checkOut, daycare: b.daycare, memo: b.memo })))
  await ins('messages', MESSAGES.map((m) => ({ id: randomUUID(), store_id: STORE_ID, customer_id: custUuid[m.customerId], template: m.template, status: m.status })))
  await ins('waitlist', WAITLIST.map((w) => ({ id: randomUUID(), store_id: STORE_ID, pet_id: petUuid[w.petId], desired: w.desired, priority: w.priority })))

  console.log('seed complete.')
}

main().then(() => { console.log('DONE'); process.exit(0) }).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
