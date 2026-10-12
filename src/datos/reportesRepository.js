/**
 * Persistence for the prototype.
 *
 * - With DATABASE_URL (e.g. Neon on Render): every call reads/writes PostgreSQL, so changes made
 *   directly in the database show up right away. The table is created and seeded on first start.
 * - Without it (local dev): reports live in storage/reportes.json.
 *
 * All functions are async so both modes share the same interface.
 */
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedReportes } from './seed.js'

const file = process.env.REPORTES_FILE || fileURLToPath(new URL('./storage/reportes.json', import.meta.url))
const databaseUrl = process.env.DATABASE_URL

function normalize(records) {
  return records.map((r, index) => ({ ...r, numero: r.numero || index + 1,
    ...(!r.autorId && !seedReportes.some(seed => seed.id === r.id) && ['Anonimo', 'Anónimo', 'Sofía Martínez'].includes(r.autor) ? { autorId: 'sofia-demo', autor: 'Sofía Martínez' } : {}),
  }))
}

// ---- JSON file ----
function persist(records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(`${file}.tmp`, JSON.stringify(records, null, 2), 'utf8')
  renameSync(`${file}.tmp`, file)
}
function loadFile() {
  let records
  try {
    records = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''))
    if (!Array.isArray(records) || records.some(r => !r || typeof r.id !== 'string')) throw new Error('Archivo de reportes inválido')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    records = seedReportes.map(r => ({ ...r }))
  }
  records = normalize(records)
  persist(records)
  return records
}

// ---- PostgreSQL ----
let pool
async function connect() {
  const { default: pg } = await import('pg')
  pool = new pg.Pool({ connectionString: databaseUrl, max: 3 })
  await pool.query('CREATE TABLE IF NOT EXISTS reportes (id text PRIMARY KEY, data jsonb NOT NULL, creado timestamptz NOT NULL DEFAULT now())')
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM reportes')
  if (!rows[0].n) await insert(normalize(seedReportes))
}
function insert(records) {
  return pool.query(
    'INSERT INTO reportes (id, data) SELECT r->>\'id\', r FROM jsonb_array_elements($1::jsonb) r ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(records)],
  )
}

let reportes = null
if (databaseUrl) await connect()
else reportes = loadFile()

export async function list() {
  if (!pool) return reportes.map(r => ({ ...r }))
  const { rows } = await pool.query('SELECT data FROM reportes ORDER BY creado, id')
  return normalize(rows.map(row => row.data))
}
export async function findById(id) {
  if (!pool) { const r = reportes.find(r => r.id === id); return r ? { ...r } : null }
  const { rows } = await pool.query('SELECT data FROM reportes WHERE id = $1', [id])
  return rows[0]?.data ?? null
}
export async function nextNumero() {
  if (!pool) return Math.max(0, ...reportes.map(r => Number(r.numero) || 0)) + 1
  const { rows } = await pool.query("SELECT coalesce(max((data->>'numero')::int), 0) + 1 AS n FROM reportes")
  return rows[0].n
}
export async function create(data) {
  const record = { ...data }
  if (pool) await insert([record])
  else { const next = [...reportes, record]; persist(next); reportes = next }
  return { ...record }
}
