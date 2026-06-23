// One-off / reusable migration runner for Supabase Postgres.
// Reads the DB password from .env.local (server-only, gitignored), then applies
// supabase/migrations/0001_init.sql + supabase/seed.sql over an SSL connection.
//   Usage:  node scripts/migrate.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const { Client } = pg
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const REF = 'pothwgpmdltykjzzcyga'
const REGION = 'ap-southeast-1'

function readEnvLocal() {
  const txt = readFileSync(join(root, '.env.local'), 'utf8')
  const out = {}
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

const env = readEnvLocal()
const password = env.SUPABASE_DB_PASSWORD
if (!password) {
  console.error('SUPABASE_DB_PASSWORD not found in .env.local')
  process.exit(1)
}

const candidates = [
  { name: 'pooler aws-0', host: `aws-0-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${REF}` },
  { name: 'pooler aws-1', host: `aws-1-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${REF}` },
  { name: 'direct', host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres' },
]

async function connect() {
  for (const c of candidates) {
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 12000,
    })
    try {
      await client.connect()
      console.log(`✓ connected via ${c.name} (${c.host})`)
      return client
    } catch (e) {
      console.log(`… ${c.name} failed: ${e.message}`)
      try { await client.end() } catch { /* noop */ }
    }
  }
  throw new Error('All connection candidates failed')
}

async function run() {
  const client = await connect()
  try {
    const initSql = readFileSync(join(root, 'supabase', 'migrations', '0001_init.sql'), 'utf8')
    console.log('→ applying 0001_init.sql …')
    await client.query(initSql)
    console.log('  ✓ schema + RLS applied')

    const seedSql = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8')
    console.log('→ applying seed.sql …')
    await client.query(seedSql)
    console.log('  ✓ seed applied')

    const tables = await client.query(
      "select table_name from information_schema.tables where table_schema='public' order by 1",
    )
    console.log('→ public tables:', tables.rows.map((r) => r.table_name).join(', '))

    const counts = await client.query(
      'select (select count(*) from public.stores) stores, (select count(*) from public.staff) staff, (select count(*) from public.services) services, (select count(*) from public.cages) cages',
    )
    console.log('→ seed counts:', JSON.stringify(counts.rows[0]))
  } finally {
    await client.end()
  }
}

run().then(() => { console.log('DONE'); process.exit(0) }).catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
