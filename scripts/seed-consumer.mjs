// Seed a demo consumer (보호자) account + pets + condition logs (service key).
// Idempotent-ish: re-creating the user is a no-op; pets/logs skip if pets exist.
// Usage: node scripts/seed-consumer.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const l of readFileSync(join(root, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2] }
const sb = createClient('https://pothwgpmdltykjzzcyga.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const EMAIL = 'guardian@nuri.pet'
const PW = 'nuri2026'

async function main() {
  // create or find the auth user
  await sb.auth.admin.createUser({ email: EMAIL, password: PW, email_confirm: true }).catch(() => {})
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const u = list.users.find((x) => x.email === EMAIL)
  if (!u) { console.error('no user'); process.exit(1) }
  console.log('consumer user:', u.id)

  await sb.from('consumer_profiles').upsert({ id: u.id, name: '김보호', phone: '010-3030-2020' })

  const { count } = await sb.from('consumer_pets').select('*', { count: 'exact', head: true }).eq('owner_id', u.id)
  if (count && count > 0) { console.log(`already has ${count} pets — skipping pet/log seed.`); console.log('DONE'); return }

  const pets = [
    { owner_id: u.id, name: '도도', species: '강아지', breed: '비숑', age_y: 11, weight_kg: 5.2, care_tag: '시니어 케어' },
    { owner_id: u.id, name: '콩이', species: '강아지', breed: '포메라니안', age_y: 1, weight_kg: 2.4, care_tag: '' },
  ]
  const { data: inserted } = await sb.from('consumer_pets').insert(pets).select('id,name')
  console.log('pets:', JSON.stringify(inserted))
  const dodo = inserted.find((p) => p.name === '도도')

  // a week of condition logs for 도도 (water trending up)
  const waters = ['보통', '보통', '많음', '많음', '많음', '많음', '많음']
  const logs = waters.map((w, i) => {
    const d = new Date(2026, 5, 18 + i) // 2026-06-18 .. 06-24
    return { pet_id: dodo.id, date: d.toISOString().slice(0, 10), appetite: '좋음', water: w, energy: i % 3 === 0 ? '활발' : '보통', weight_kg: 5.2, memo: i === 6 ? '음수량 늘어남 관찰' : null }
  })
  await sb.from('pet_condition_logs').insert(logs)
  console.log('condition logs:', logs.length)
  console.log('DONE')
}

main().then(() => process.exit(0)).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
