# Novedades (Stories/álbum de Alejandra) — Design

## Objetivo

Alejandra (agente de viajes) sube contenido a Estados de WhatsApp, historias
de Instagram y Facebook. Se quiere un espacio en la home del sitio para
mostrar esas novedades a los visitantes.

## Alcance de esta fase

Carga **manual** desde el panel de administración. No hay integración
automática con WhatsApp/Instagram/Facebook en esta fase:

- WhatsApp Estados no tiene API pública viable.
- Instagram/Facebook Stories sí tienen API oficial (Meta Graph API), pero
  requieren cuenta Business vinculada y aprobación de Meta — se evalúa como
  fase futura, fuera de este spec.

## Modelo de datos

Nuevo modelo Prisma `Update` (nombre interno en código/DB; se muestra al
usuario como "Novedades"):

```prisma
model Update {
  id        String   @id @default(uuid())
  images    String[]                    // URLs en Supabase Storage, en orden de galería
  caption   String   @default("")
  status    String   @default("published") // "published" | "draft"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Notas:
- Sin `slug` — no tiene página de detalle propia.
- Sin `title` — solo imágenes + caption corto opcional (decisión del usuario).
- Sin expiración automática — las novedades quedan hasta que Alejandra (o
  cualquier admin/agent/designer) las borre manualmente.
- `status` sigue el mismo patrón que `Offer`/`Destination` (draft/published)
  para poder preparar una novedad sin publicarla aún.

Aplicar con `npm run db:push` (el proyecto no usa `prisma migrate` todavía,
ver backlog en CLAUDE.md).

## Backend

Nuevo archivo `backend/src/routes/novedades.js`, montado en el router
principal junto a los demás (`ofertas`, `destinos`, etc.), siguiendo el
mismo patrón que `destinos.js`:

| Method | Route | Auth | Descripción |
|---|---|---|---|
| GET | `/api/novedades` | público | Lista novedades con `status: published`, orden `createdAt desc` |
| POST | `/api/novedades` | admin/agent/designer | Crear novedad |
| PATCH | `/api/novedades/:id` | admin/agent/designer | Editar (imágenes, caption, status) |
| DELETE | `/api/novedades/:id` | admin/agent/designer | Borrar novedad |

- Reutiliza los mismos roles permitidos que `upload.js`/`settings.js`
  (`ALLOWED_ROLES` — admin, agent, designer). Mantener sincronizado con
  `users.js` `VALID_ROLES` y el frontend `ROLES`, como ya indica CLAUDE.md.
- La subida de archivos reutiliza el endpoint existente `POST /api/upload`
  (Supabase Storage, bucket `images`) — el form de admin sube cada imagen
  individualmente y arma el array `images` antes de crear/editar la novedad.
- Validación mínima: al menos 1 imagen requerida para crear/publicar.

## Admin (frontend)

Nueva página `frontend/app/admin/novedades/page.jsx`:

- Listado en grid de tarjetas: miniatura (primera imagen), caption
  truncado, fecha, badge de estado (publicado/borrador).
- Botón "Nueva novedad" abre un formulario simple (drawer/modal — no wizard
  multi-paso, a diferencia de ofertas/destinos, porque el contenido es
  mínimo): subir 1-N imágenes (reordenables, cada una con botón eliminar),
  campo caption opcional, toggle publicado/borrador.
- Edición reutiliza el mismo formulario, precargado.
- Borrado es directo (no hay soft-delete en el resto del proyecto, se
  mantiene consistencia).
- Entrada de navegación en el layout del admin (`admin/layout.jsx`), junto a
  Ofertas/Destinos/Cotizaciones.

## Público (frontend)

Nuevo componente `frontend/components/inicio/sections/Novedades.jsx`:

- Se inserta en `frontend/app/page.jsx` inmediatamente debajo del Hero.
- Fila horizontal de tarjetas/círculos estilo Stories, una por novedad
  publicada, mostrando su primera imagen.
- Click abre un lightbox que recorre las imágenes de esa novedad (si tiene
  más de una) y muestra el caption.
- Si no hay novedades publicadas, la sección no se renderiza (mismo criterio
  que otras secciones vacías de la home).
- Fetch a `GET /api/novedades` (proxy `/api/*` existente hacia el backend).

## Fuera de alcance

- Integración automática con WhatsApp Estados, Instagram Stories o Facebook
  Stories (Meta Graph API). Queda pendiente como decisión futura si se
  evalúa el costo de la cuenta Business + aprobación de Meta.
- Expiración automática de novedades (tipo 24h de Stories).
