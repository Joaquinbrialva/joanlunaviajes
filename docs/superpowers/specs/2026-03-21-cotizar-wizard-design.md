# Spec: Página `/cotizar` — Wizard de cotización a medida

**Fecha:** 2026-03-21
**Estado:** Aprobado

---

## Contexto y motivación

Los visitantes del sitio frecuentemente consultan por:
1. Precios / presupuesto — no hay forma de filtrar por precio en las ofertas actuales.
2. Paquetes que no están publicados — quieren viajes a medida que no existen como oferta listada.

Se necesita una página dedicada donde cualquier visitante pueda describir el viaje que quiere y solicitar una cotización personalizada, sin necesidad de estar registrado.

---

## Objetivo

Crear la página pública `/cotizar` con un wizard de 4 pasos que recopile la información necesaria para armar una propuesta a medida, y que al enviarse genere una cotización en el panel admin (`/admin/cotizaciones`).

---

## Arquitectura

### Stack
- Frontend: Next.js (app router), Tailwind CSS v4, `@heroui/react` v3
- Backend: Express + Prisma + PostgreSQL

### Ruta pública
- **URL:** `/cotizar`
- **Archivo:** `frontend/app/cotizar/page.jsx`
- **Acceso:** público, sin autenticación requerida. Los admins que visiten la página ven el formulario normalmente.

### Integración con backend
Al enviar el wizard → `POST /api/cotizaciones` con el body:
```json
{
  "name": "...",
  "email": "...",
  "phone": "",
  "passengers": 3,
  "message": "...",
  "wizardData": { ... }
}
```

---

## Cambios en el backend

### 1. Migración Prisma

Dos cambios en `backend/prisma/schema.prisma`:

```prisma
model Inquiry {
  // Cambio 1: phone pasa a tener default "" para tolerar envíos sin teléfono
  phone      String   @default("")

  // Cambio 2: nuevo campo opcional para datos estructurados del wizard
  wizardData Json?

  // ... resto de campos sin cambios ...
}
```

Ejecutar: `npx prisma migrate dev --name add-inquiry-wizard-data`

> `migrate dev` ejecuta `prisma generate` automáticamente. Si se usara `migrate deploy` (producción), correr `npx prisma generate` manualmente después.

> **Dependencia de despliegue:** el cambio en la ruta (paso 2) solo es seguro después de que esta migración haya sido aplicada. Aplicar la migración primero.

### 2. Ruta `POST /api/cotizaciones`

**Cambio en validación:** relajar la condición actual que exige `phone`:

```js
// Antes:
if (!name || !phone) { ... }

// Después:
if (!name) {
  return res.status(400).json({ error: 'Completá tu nombre.' });
}
```

`phone` pasará como string vacío `""` cuando el usuario no lo complete. La validación de email es frontend-only (el backend ya solo valida formato si el campo no está vacío).

**Persistir `wizardData`** en `prisma.inquiry.create`:
```js
wizardData: body.wizardData ?? null,
```

### 3. Notificación de campana al admin

El cuerpo de la notificación actualmente usa `offerTitle` o `destinationSlug` para describir la consulta. Para submissions del wizard, ninguno de esos campos existe, por lo que mostraría "consulta general". Actualizar la lógica para usar el destino del wizard cuando esté disponible:

```js
const subject = newInquiry.offerTitle
  ? `"${newInquiry.offerTitle}"`
  : newInquiry.destinationSlug
    ? newInquiry.destinationSlug.replace(/-/g, ' ')
    : newInquiry.wizardData?.destination
      ? `cotización a medida: ${newInquiry.wizardData.destination}`
      : 'consulta general';
```

### 4. Emails transaccionales

Las funciones `sendInquiryToAgency` y `sendConfirmationToClient` ya existentes se dispararán también para submissions del wizard. No se modifican sus templates en este alcance. El email de la agencia recibirá el campo `message` con el resumen legible — es suficiente para este primer release.

---

## Construcción del `message` en el frontend

El frontend construye `message` como texto legible antes de enviar, para que el admin pueda leerlo en cualquier vista de tabla o email. Ejemplo:

```
Cotización a medida

Destino: Europa
Flexibilidad de fechas: Fechas fijas
Salida: 15/07/2025 | Regreso: 30/07/2025
Viajeros: 2 adultos, 1 niño
Presupuesto: $500–$1500 por persona
Tipo de viaje: Familia
Incluye: Vuelos, Hotel, Traslados
Notas: Viajamos con un bebé.
```

`wizardData` es la fuente autoritativa para el panel admin (permite mostrar campos individuales). `message` es el fallback legible para emails y vistas que no conocen el esquema del wizard.

---

## Estado del formulario (objeto plano)

```js
{
  // Paso 1
  destination: '',          // string libre
  dateFlexibility: '',      // '' | 'fixed' | 'flexible' | 'unknown'

  // Paso 2
  departureDate: '',        // string ISO o ''
  returnDate: '',           // string ISO o ''
  adults: 1,                // número >= 1
  children: 0,              // número >= 0

  // Paso 3
  tripType: '',             // 'Familia' | 'Pareja' | 'Luna de miel' | 'Solo' | 'Grupo de amigos' | 'Corporativo'
  budget: '',               // 'hasta-500' | '500-1500' | '1500-3000' | 'mas-3000' | 'flexible'
  includes: [],             // ['Vuelos', 'Hotel', 'Traslados', 'Excursiones', 'Seguro de viaje', 'Asistencia médica']

  // Paso 4
  name: '',
  email: '',
  phone: '',                // opcional
  notes: '',
}
```

---

## Diseño del wizard — 4 pasos

### Paso 1 — Destino

**Campos:**
- `destination`: input de texto libre. Placeholder: `"Europa, Caribe, Tailandia... o 'Sorpréndeme'"`. Requerido para avanzar.
- `dateFlexibility`: chips de selección única: "Sí, tengo fechas" (`fixed`) / "Soy flexible" (`flexible`) / "No sé todavía" (`unknown`). Requerido para avanzar.

**Validación para avanzar:** `destination` no vacío Y `dateFlexibility` seleccionado.

---

### Paso 2 — Fechas y viajeros

**Comportamiento de los date pickers según `dateFlexibility`:**
- `'fixed'` → date pickers **visibles y requeridos**. `returnDate` debe ser >= `departureDate`. No se permiten fechas pasadas — pasar `minValue={today()}` al componente.
- `'flexible'` o `'unknown'` → date pickers **ocultos**. Mostrar: "Sin fechas fijas — lo coordinamos con vos."

**Nota de implementación — `DatePickerField`:** el componente actualmente no expone `minValue`. Se debe extender para aceptar y pasar esa prop al `<Calendar>` interno de `@heroui/react`.

**Campos:**
- `departureDate` / `returnDate`: solo visibles si `dateFlexibility === 'fixed'`.
- `adults`: contador +/−, mínimo 1.
- `children`: contador +/−, mínimo 0.

**Validación para avanzar:** si `dateFlexibility === 'fixed'`, ambas fechas completas y `returnDate >= departureDate`.

---

### Paso 3 — Preferencias

Todos los campos de este paso son opcionales.

**Campos:**
- `tripType`: chips de selección única. Opciones: Familia / Pareja / Luna de miel / Solo / Grupo de amigos / Corporativo.
- `budget`: chips de selección única. Opciones: Hasta $500 / $500–$1500 / $1500–$3000 / +$3000 / Flexible. El admin ve la etiqueta legible, no el valor interno.
- `includes`: checkboxes de selección múltiple. Opciones: Vuelos / Hotel / Traslados / Excursiones / Seguro de viaje / Asistencia médica.

**Validación para avanzar:** ninguna.

---

### Paso 4 — Datos de contacto

**Campos:**
- `name`: requerido.
- `email`: requerido, formato email (validación solo en frontend).
- `phone`: opcional.
- `notes`: textarea opcional. Placeholder: "Ej: viajamos con un bebé, queremos playa y montaña..."

**Al enviar:**
- El botón muestra estado de carga (spinner, usando el patrón `isPending` de `@heroui/react` Button).
- **En éxito:** el wizard es reemplazado por una pantalla de confirmación:
  - Ícono de check en verde.
  - Título: "¡Tu consulta fue enviada!"
  - Texto: "Te respondemos en menos de 24 horas con opciones personalizadas para tu viaje."
  - Botón "Hacer otra consulta" → resetea el wizard al paso 1 limpiando **todos** los campos del estado (incluyendo nombre y email).
  - Link "Ver ofertas disponibles" → `/ofertas`.
- **En error:** toast de error via `toastError()` de `@/lib/toast`.

---

## Navegación del wizard

- Stepper en la parte superior con 4 pasos. Pasos completados muestran ✓.
- "Anterior" disponible desde paso 2. "Siguiente" deshabilitado si validación del paso falla.
- Estado del formulario se preserva al navegar hacia atrás.

---

## Entrada al flujo desde otras páginas

**1. Navbar** (`frontend/components/inicio/ui/Navbar.jsx`)

El botón CTA "Consultar ahora" → `/consulta` aparece en **dos lugares** que deben actualizarse:
- Desktop (~línea 148–155): el pill button naranja.
- Mobile (~línea 291–298): el `<Link href="/consulta">` dentro del bloque `{!isStaff && (...)}`. Este bloque vive dentro del branch `!user` (usuarios no autenticados); debe permanecer ahí — no mover fuera de ese condicional.

Reemplazar texto por "Cotizar a medida" y destino por `/cotizar`. La página `/consulta` existente no se elimina.

**2. Página de ofertas** (`/ofertas`): agregar banner al final: "¿No encontraste lo que buscás? → Armá tu viaje a medida".

**3. Hero de la home** (opcional): botón secundario "Quiero algo a medida" junto al CTA principal.

---

## Cambios en el panel admin

### `inquiry-preview-drawer`

El drawer recibe el objeto `inquiry` desde el servidor. `wizardData` viaja en el objeto (la función `normalizeInquiry` usa spread por lo que no lo descarta). Cuando `inquiry.wizardData !== null`, renderizar una sección "Detalles del viaje solicitado":

| Campo | Fuente | Valor de ejemplo |
|---|---|---|
| Destino | `wizardData.destination` | Europa |
| Flexibilidad | `wizardData.dateFlexibility` | Fechas fijas / Flexible / Sin definir todavía |
| Salida / Regreso | `wizardData.departureDate` / `wizardData.returnDate` | 15/07/2025 → 30/07/2025 |
| Viajeros | `wizardData.adults` + `wizardData.children` | 2 adultos, 1 niño |
| Presupuesto | `wizardData.budget` | $500–$1500 por persona |
| Tipo de viaje | `wizardData.tripType` | Familia |
| Incluye | `wizardData.includes` (array) | Vuelos, Hotel, Traslados |

**Etiquetas para `dateFlexibility`:**
- `'fixed'` → "Fechas fijas"
- `'flexible'` → "Flexible"
- `'unknown'` → "Sin definir todavía"

**Etiquetas para `budget`:**
- `'hasta-500'` → "Hasta $500"
- `'500-1500'` → "$500–$1500"
- `'1500-3000'` → "$1500–$3000"
- `'mas-3000'` → "+$3000"
- `'flexible'` → "Flexible"

Si `wizardData` es null, la sección no se muestra.

---

## Componentes a crear / modificar

| Archivo | Acción |
|---|---|
| `frontend/app/cotizar/page.jsx` | Crear — página wizard completa |
| `frontend/components/inicio/ui/Navbar.jsx` | Modificar — reemplazar CTA en desktop y mobile |
| `frontend/components/admin/inquiry-preview-drawer.jsx` | Modificar — sección "Detalles del viaje" si `wizardData` presente |
| `frontend/components/ui/date-picker-field.jsx` | Modificar — aceptar y pasar `minValue` prop |
| `backend/prisma/schema.prisma` | Modificar — `phone @default("")` + `wizardData Json?` |
| `backend/src/routes/cotizaciones.js` | Modificar — relajar validación + persistir `wizardData` + notificación |

---

## Fuera de alcance

- Actualizar templates de email para mostrar datos estructurados del wizard.
- Envío de email automático adicional al visitante.
- Asignación automática a un agente.
- Filtro por precio en `/ofertas` (feature separada).
- Comportamiento especial para admins que visiten `/cotizar`.
