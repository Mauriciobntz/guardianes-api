/**
 * Entrypoint — HTTP transport for the server.
 *
 * Routes only delegate to the logic layer and translate typed errors
 * into HTTP status codes. No business logic lives here.
 */

import express from 'express'
import cors from 'cors'
import {
  getReportes,
  getReporteById,
  createReporte,
  ValidationError,
  NotFoundError,
} from './reportesService.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '3mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Express 4 does not catch rejected promises: pass them to the error handler below.
const route = handler => (req, res, next) => handler(req, res).catch(next)

app.get('/api/reportes', route(async (req, res) => {
  res.json(await getReportes(req.query.autorId))
}))

app.get('/api/reportes/:id', route(async (req, res) => {
  res.json(await getReporteById(req.params.id))
}))

app.post('/api/reportes', route(async (req, res) => {
  res.status(201).json(await createReporte(req.body))
}))

// Unknown route fallback.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Typed-error mapping + generic failure handler.
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message })
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Guardianes server listening on http://localhost:${PORT}`)
})
