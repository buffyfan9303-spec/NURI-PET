// Backend finalize via the service_role (secret) key — no DB password needed.
//  1) verify schema + seed   2) create Auth users   3) link staff.user_id
//  Usage:  node scripts/setup-supabase.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const URL = 'https://pothwgpmdltykjzzcyga.supabase.co'

function readEnv(file) {
  const out = {}
  try {
    for (const line of readFileSync(join(root, file), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2]
    }
  } catch { /* noop */ }
  return out
}

const env = readEnv('.env.local')
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) { console.error('SUPABASE_SERVICE_ROLE_KEY missing in .env.local'); process.exit(1) }

const sb = createClient(URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const ACCOUNTS = [
  { email: 'owner@dogwell.kr', password: 'nuri2026' },
  { email: 'staff@dogwell.kr', password: 'nuri2026' },
  { email: 'trim@dogwell.kr', password: 'nuri2026' },
]

async function main() {
  // 1) verify schema + seed
  for (const t of ['stores', 'staff', 'services', 'cages']) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
    if (error) { console.error(`✗ ${t}:`, error.message); process.exit(1) }
    console.log(`  ${t}: ${count} rows`)
  }

  // 2) create auth users (idempotent)
  for (const a of ACCOUNTS) {
    const { error } = await sb.auth.admin.createUser({ email: a.email, password: a.password, email_confirm: true })
    if (error && !/already|registered|exists/i.test(error.message)) {
      console.error(`✗ createUser ${a.email}:`, error.message)
    } else {
      console.log(`✓ user ${a.email}${error ? ' (already existed)' : ''}`)
    }
  }

  // 3) link staff.user_id by email
  const { data: list, error: lerr } = await sb.auth.admin.listUsers({ perPage: 1000 })
  if (lerr) { console.error('listUsers:', lerr.message); process.exit(1) }
  const idByEmail = Object.fromEntries(list.users.map((u) => [u.email, u.id]))
  for (const a of ACCOUNTS) {
    const uid = idByEmail[a.email]
    if (!uid) { console.log(`! no auth id for ${a.email}`); continue }
    const { error } = await sb.from('staff').update({ user_id: uid }).eq('email', a.email)
    if (error) console.error(`✗ link ${a.email}:`, error.message)
    else console.log(`✓ linked ${a.email} → ${uid}`)
  }

  // verify links
  const { data: staff } = await sb.from('staff').select('email,role,user_id').order('role')
  console.log('→ staff:', JSON.stringify(staff))
}

main().then(() => { console.log('DONE'); process.exit(0) }).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
