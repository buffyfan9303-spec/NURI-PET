// Populate store profile fields (intro/address/phone) after 0003. Service key.
// Usage: node scripts/seed-store-fields.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const l of readFileSync(join(root, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2] }
const sb = createClient('https://pothwgpmdltykjzzcyga.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const FIELDS = {
  '도그웰 살롱': { intro: '20년 경력 1:1 맞춤 미용. 시니어견 케어 전문.', address: '서울 강남구 봉은사로 102', phone: '02-540-1234' },
  '댕댕살롱': { intro: '소형견 전문, 눈물자국·위생 케어가 꼼꼼해요.', address: '서울 마포구 연남로 35', phone: '02-333-7788' },
  '펫호텔 라온': { intro: 'CCTV 실시간 확인, 1견 1실 프리미엄 호텔링.', address: '서울 송파구 올림픽로 240', phone: '02-415-9000' },
  '멍멍 플레이카페': { intro: '넓은 실내 놀이터에서 마음껏 뛰노는 사회화 카페.', address: '서울 성동구 왕십리로 80', phone: '02-2200-3300' },
  '24시 종합펫케어': { intro: '미용·호텔·목욕을 한 곳에서. 24시간 운영.', address: '서울 영등포구 여의대로 12', phone: '02-780-2424' },
}

async function main() {
  for (const [name, f] of Object.entries(FIELDS)) {
    const { error } = await sb.from('stores').update(f).eq('name', name)
    if (error) console.error(`✗ ${name}:`, error.message)
    else console.log(`✓ ${name}`)
  }
  console.log('DONE')
}
main().then(() => process.exit(0)).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
