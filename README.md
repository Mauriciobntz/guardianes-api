# Guardianes API

API de reportes ambientales del prototipo **Guardianes del Iberá**. La app (repo
[Guardianes_del_Ibera](https://github.com/axelsilva17/Guardianes_del_Ibera)) la usa en las
pantallas **Reportar** y **Mis Reportes**.

- **Express** para las rutas.
- **PostgreSQL (Neon)** para guardar los reportes cuando existe `DATABASE_URL`.
  La tabla se crea sola y se cargan 5 reportes de ejemplo la primera vez.
- Sin `DATABASE_URL` (en tu compu) guarda en `src/datos/storage/reportes.json`.

## Correr en tu compu

```bash
npm install
npm run dev        # http://localhost:3000/api/health → {"status":"ok"}
npm test
```

Para usar la base de Neon también en local, copiá `.env.example` como `.env`, completá
`DATABASE_URL` y arrancá con `node --env-file=.env src/index.js`.

## Publicar en Render (gratis)

1. **Neon** (neon.tech): crear un proyecto y copiar el *connection string* (`postgresql://...`).
2. **Render**: New → **Blueprint** → elegir este repo. `render.yaml` ya trae la configuración;
   solo pide pegar `DATABASE_URL`.
3. Probar `https://<tu-servicio>.onrender.com/api/health`.
4. **Vercel** (proyecto de la app): Settings → Environment Variables →
   `VITE_API_URL` = la dirección de Render, sin `/` al final. Después, **Redeploy**.

> En el plan gratis Render duerme el servicio tras 15 min sin uso: el primer pedido tarda ~50 s.
> Los reportes no se pierden porque están en Neon.

## Endpoints

| Método | Ruta | Descripción | Códigos |
| ------ | ---- | ----------- | ------- |
| GET | `/api/health` | Chequeo de disponibilidad | 200 |
| GET | `/api/reportes?autorId=sofia-demo` | Lista reportes (filtro opcional por autor) | 200 |
| GET | `/api/reportes/:id` | Un reporte | 200, 404 |
| POST | `/api/reportes` | Crea un reporte | 201, 400 |

Body del POST: `titulo` y `tipo` (`fuego | basura | caza_furtiva | tala | otro`) obligatorios,
`lat` / `lng` obligatorios, y opcionales `descripcion`, `categoriaResiduo`
(`general | plastico | papel | vidrio | organico`) y `foto` (data URL JPG/PNG/WebP de hasta 2 MB).

## Estructura

```text
src/
  index.js                    # rutas HTTP → lógica
  reportesService.js          # reglas de negocio + validación
  datos/
    reportesRepository.js     # PostgreSQL (DATABASE_URL) o archivo JSON local
    seed.js                   # reportes de ejemplo
test/
  reportesPersistence.test.js
render.yaml                   # configuración para Render
```
