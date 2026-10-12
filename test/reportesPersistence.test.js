import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

test('reports and photos survive a new process, with demo-account filtering', () => {
  const directory = mkdtempSync(join(tmpdir(), 'guardianes-reports-'))
  const file = join(directory, 'reportes.json')
  const run = code => spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('.', import.meta.url), env: { ...process.env, REPORTES_FILE: file }, encoding: 'utf8',
  })
  try {
    let result = run(`import { createReporte } from '../src/reportesService.js'; const r = createReporte({ titulo: 'Prueba persistencia', tipo: 'basura', descripcion: 'Detalle', lat: -28, lng: -57, foto: 'data:image/png;base64,aGVsbG8=' }); console.log(JSON.stringify(r))`)
    assert.equal(result.status, 0, result.stderr)
    const created = JSON.parse(result.stdout)
    assert.equal(created.autorId, 'sofia-demo')
    result = run(`import { getReportes, getReporteById } from '../src/reportesService.js'; console.log(JSON.stringify({mine: getReportes('sofia-demo'), other: getReportes('another-user'), detail: getReporteById('${created.id}')}))`)
    assert.equal(result.status, 0, result.stderr)
    const loaded = JSON.parse(result.stdout)
    assert.deepEqual(loaded.mine, [created])
    assert.deepEqual(loaded.other, [])
    assert.equal(loaded.detail.foto, created.foto)
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).at(-1).id, created.id)
    writeFileSync(file, '{invalid')
    result = run(`import '../src/reportesService.js'`)
    assert.notEqual(result.status, 0)
    assert.equal(readFileSync(file, 'utf8'), '{invalid')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
