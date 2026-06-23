// Seed marketplace supply: extra stores + their services (service key).
// Idempotent: skips if more than the original store already exists.
// Usage: node scripts/seed-stores.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}
const sb = createClient('https://pothwgpmdltykjzzcyga.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const STORES = [
  { name: '댕댕살롱', type: '미용실', staff: '한가위',
    services: [['미용', '전체미용', 50000, 90], ['미용', '부분미용', 28000, 60], ['목욕', '스파목욕', 45000, 70]] },
  { name: '펫호텔 라온', type: '호텔', staff: '오하라',
    services: [['호텔', '1박 숙박', 40000, 1440], ['데이케어', '종일 데이케어', 25000, 480], ['목욕', '퇴실 목욕', 20000, 40]] },
  { name: '멍멍 플레이카페', type: '카페', staff: '서지후',
    services: [['데이케어', '놀이방 2시간', 15000, 120], ['데이케어', '종일권', 30000, 600]] },
  { name: '24시 종합펫케어', type: '종합', staff: '문도윤',
    services: [['미용', '전체미용', 60000, 100], ['호텔', '1박 숙박', 45000, 1440], ['목욕', '약욕', 35000, 50]] },
]

const COLORS = ['#5e6ad2', '#36b37e', '#d99a30', '#e5658a']

async function main() {
  const { count } = await sb.from('stores').select('*', { count: 'exact', head: true })
  if (count && count > 1) { console.log(`stores already has ${count} — skipping supply seed.`); return }

  for (let i = 0; i < STORES.length; i++) {
    const s = STORES[i]
    const storeId = randomUUID()
    const { error: se } = await sb.from('stores').insert({ id: storeId, name: s.name, type: s.type })
    if (se) { console.error(`✗ store ${s.name}:`, se.message); continue }
    await sb.from('staff').insert({ store_id: storeId, name: s.staff, role: 'owner', commission_rate: 0, color: COLORS[i % COLORS.length] })
    const svcRows = s.services.map(([category, name, price, duration_min]) => ({ store_id: storeId, category, name, price, duration_min }))
    const { error: sve } = await sb.from('services').insert(svcRows)
    if (sve) { console.error(`✗ services ${s.name}:`, sve.message); continue }
    console.log(`✓ ${s.name} (${s.type}) — ${svcRows.length} services`)
  }
  const { count: total } = await sb.from('stores').select('*', { count: 'exact', head: true })
  console.log('total stores now:', total)
}

main().then(() => { console.log('DONE'); process.exit(0) }).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
