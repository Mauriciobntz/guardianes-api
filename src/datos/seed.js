/**
 * DATA layer — seed dataset.
 *
 * Mock environmental reports used to back the in-memory repository.
 * Coordinates point to locations around the Ibera wetlands (Corrientes, Argentina).
 *
 * Record shape:
 *   { id, titulo, tipo, descripcion, lat, lng, estado, fecha, autor }
 */

/** @typedef {Object} Reporte
 * @property {string} id
 * @property {string} titulo
 * @property {'fuego'|'basura'|'caza_furtiva'|'tala'|'otro'} tipo
 * @property {string} descripcion
 * @property {number} lat
 * @property {number} lng
 * @property {'pendiente'|'en_revision'|'resuelto'} estado
 * @property {string} fecha - ISO date (YYYY-MM-DD)
 * @property {string} autor
 */

/** @type {Reporte[]} */
export const seedReportes = [
  {
    id: 'rep-001',
    titulo: 'Foco de incendio cerca del portal Carambola',
    tipo: 'fuego',
    descripcion:
      'Se observa humo y un frente de fuego activo sobre pastizal seco, a unos 300 m del sendero principal.',
    lat: -28.5521,
    lng: -57.1834,
    estado: 'pendiente',
    fecha: '2026-09-28',
    autor: 'Camila Rios',
  },
  {
    id: 'rep-002',
    titulo: 'Basura acumulada en la laguna Ibera',
    tipo: 'basura',
    descripcion:
      'Varios bolsos con residuos plasticos flotando junto a la orilla, probablemente dejados por visitantes.',
    lat: -28.5287,
    lng: -57.1592,
    estado: 'en_revision',
    fecha: '2026-09-30',
    autor: 'Mateo Ferreyra',
  },
  {
    id: 'rep-003',
    titulo: 'Sospecha de caza furtiva nocturna',
    tipo: 'caza_furtiva',
    descripcion:
      'Se escucharon disparos durante la noche y se vieron luces de vehiculos fuera de los caminos habilitados.',
    lat: -28.6013,
    lng: -57.2418,
    estado: 'pendiente',
    fecha: '2026-10-01',
    autor: 'Lucia Benitez',
  },
  {
    id: 'rep-004',
    titulo: 'Tala de arboles nativos en zona de monte',
    tipo: 'tala',
    descripcion:
      'Troncos recien cortados y marcas de motosierra en un sector de monte nativo protegido.',
    lat: -28.4896,
    lng: -57.3021,
    estado: 'resuelto',
    fecha: '2026-09-22',
    autor: 'Santiago Aguilar',
  },
  {
    id: 'rep-005',
    titulo: 'Animal silvestre herido en el camino',
    tipo: 'otro',
    descripcion:
      'Un carpincho con una herida en la pata fue visto junto al camino de acceso, sin poder desplazarse bien.',
    lat: -28.5743,
    lng: -57.1205,
    estado: 'en_revision',
    fecha: '2026-10-02',
    autor: 'Valentina Sosa',
  },
]
