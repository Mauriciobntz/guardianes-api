/**
 * Persistence for the single-process prototype.
 *
 * - With DATABASE_URL (e.g. Neon on Render): reports live in PostgreSQL. The table is created
 *   and seeded automatically on first start.
 * - Without it (local dev): reports live in storage/reportes.json, as before.
 *
 * Either way the records are kept in memory too, so list/findById/create stay synchronous
 * and the logic layer does not change.
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
async function loadDatabase() {
  const { default: pg } = await import('pg')
  pool = new pg.Pool({ connectionString: databaseUrl, max: 3 })
  await pool.query('CREATE TABLE IF NOT EXISTS reportes (id text PRIMARY KEY, data jsonb NOT NULL, creado timestamptz NOT NULL DEFAULT now())')
  let { rows } = await pool.query('SELECT data FROM reportes ORDER BY creado, id')
  if (!rows.length) {
    await insert(normalize(seedReportes))
    ;({ rows } = await pool.query('SELECT data FROM reportes ORDER BY creado, id'))
  }
  return normalize(rows.map(row => row.data))
}
function insert(records) {
  return pool.query(
    'INSERT INTO reportes (id, data) SELECT r->>\'id\', r FROM jsonb_array_elements($1::jsonb) r ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(records)],
  )
}
// Writes go one after the other, so they reach the database in the same order they were made.
let writes = Promise.resolve()

let reportes = databaseUrl ? await loadDatabase() : loadFile()

export function list() { return reportes.map(r => ({ ...r })) }
export function findById(id) { const r = reportes.find(r => r.id === id); return r ? { ...r } : null }
export function create(data) {
  const record = { ...data }
  const next = [...reportes, record]
  if (pool) writes = writes.then(() => insert([record])).catch(error => console.error('No se pudo guardar el reporte en la base:', error))
  else persist(next)
  reportes = next
  return { ...record }
}
