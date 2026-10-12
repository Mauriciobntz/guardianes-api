/**
 * LOGIC layer — reportes service.
 *
 * Owns the business rules and input validation for reports.
 * It never touches the raw collection directly: all persistence goes
 * through the data layer (reportesRepository).
 */

import { randomUUID } from 'node:crypto'
import * as reportesRepository from './datos/reportesRepository.js'

/** Allowed report types (domain contract). */
export const REPORTE_TIPOS = ['fuego', 'basura', 'caza_furtiva', 'tala', 'otro']

/** Allowed report states (domain contract). */
export const REPORTE_ESTADOS = ['pendiente', 'en_revision', 'resuelto']

/** Thrown when input fails validation. */
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

/** Thrown when a report does not exist. */
export class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
  }
}

const LAT_MIN = -90
const LAT_MAX = 90
const LNG_MIN = -180
const LNG_MAX = 180

/**
 * List every report.
 * @returns {import('./datos/seed.js').Reporte[]}
 */
export function getReportes(autorId) {
  const reportes = reportesRepository.list()
  return autorId ? reportes.filter(r => r.autorId === autorId) : reportes
}

/**
 * Get one report by id.
 * @param {string} id
 * @returns {import('./datos/seed.js').Reporte}
 * @throws {NotFoundError}
 */
export function getReporteById(id) {
  const reporte = reportesRepository.findById(id)
  if (!reporte) {
    throw new NotFoundError(`Reporte "${id}" not found`)
  }
  return reporte
}

/**
 * Validate input and create a report.
 * @param {object} input
 * @returns {import('./datos/seed.js').Reporte}
 * @throws {ValidationError}
 */
export function createReporte(input = {}) {
  const { titulo, tipo, descripcion, lat, lng, categoriaResiduo, foto } = input ?? {}

  if (typeof titulo !== 'string' || titulo.trim() === '') {
    throw new ValidationError('Field "titulo" is required and must be a non-empty string')
  }

  if (!REPORTE_TIPOS.includes(tipo)) {
    throw new ValidationError(`Field "tipo" must be one of: ${REPORTE_TIPOS.join(', ')}`)
  }

  const validCoordinate = (value) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
  if (!validCoordinate(lat) || !validCoordinate(lng)) {
    throw new ValidationError('Las coordenadas son obligatorias')
  }
  if (categoriaResiduo !== undefined && !['general', 'plastico', 'papel', 'vidrio', 'organico'].includes(categoriaResiduo)) {
    throw new ValidationError('Categoría de residuo inválida')
  }
  if (foto !== undefined && foto !== '' && (typeof foto !== 'string' || foto.length > 2800000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(foto))) {
    throw new ValidationError('Fotografía inválida: usá JPG, PNG o WebP de hasta 2 MB')
  }
  const latNum = Number(lat)
  if (!Number.isFinite(latNum) || latNum < LAT_MIN || latNum > LAT_MAX) {
    throw new ValidationError(`Field "lat" must be a number between ${LAT_MIN} and ${LAT_MAX}`)
  }

  const lngNum = Number(lng)
  if (!Number.isFinite(lngNum) || lngNum < LNG_MIN || lngNum > LNG_MAX) {
    throw new ValidationError(`Field "lng" must be a number between ${LNG_MIN} and ${LNG_MAX}`)
  }

  const reporte = {
    id: randomUUID(),
    numero: Math.max(0, ...reportesRepository.list().map(r => Number(r.numero) || 0)) + 1,
    titulo: titulo.trim(),
    tipo,
    descripcion: typeof descripcion === 'string' ? descripcion.trim() : '',
    lat: latNum,
    lng: lngNum,
    estado: 'pendiente',
    fecha: new Date().toISOString().slice(0, 10),
    autor: 'Sofía Martínez',
    autorId: 'sofia-demo', // Prototype account; replace with authenticated identity later.
  }

  if (categoriaResiduo !== undefined) reporte.categoriaResiduo = categoriaResiduo
  if (foto) reporte.foto = foto
  return reportesRepository.create(reporte)
}
