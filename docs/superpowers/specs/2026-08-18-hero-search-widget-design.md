# Hero multi-field search widget — Design

## Objetivo

El usuario quiere que el buscador del Hero se parezca al widget de búsqueda
de vuelos de [jetsmart.com](https://jetsmart.com/ar/es/) (más complejo que
el input de texto libre actual), pero adaptado a lo que este sitio puede
filtrar realmente.

## Por qué no se copia literalmente el widget de JetSmart

JetSmart es una aerolínea: su buscador tiene Origen (aeropuerto), Destino
(aeropuerto), Solo ida/Ida y vuelta, fecha de ida/vuelta, pasajeros, millas,
código promocional — porque busca **rutas de vuelo** entre aeropuertos con
inventario dinámico de vuelos por fecha.

Este sitio vende **paquetes de viaje fijos** (`Offer`): cada oferta ya trae
su propio origen, destino, fechas de disponibilidad y duración armados de
antemano — no hay un motor de búsqueda de rutas. `/ofertas` (`frontend/app/ofertas/page.jsx`)
ya filtra client-side sobre la lista completa de ofertas por: texto libre,
destino (país, derivado dinámicamente de las ofertas existentes), fecha
(dentro de la ventana `availability.startDate`/`endDate`), duración, precio,
vuelo directo, con descuento, destacadas — vía query params (`q`, `dest`,
`date`, `dur`, `min`, `max`, `direct`, `discount`, `featured`).

## Alcance de este cambio

### Campos del widget

Solo los campos que este sitio puede cumplir de verdad, mapeados a filtros
que `/ofertas` **ya** entiende (sin tocar el backend ni `/ofertas` mismo):

1. **Destino** — select con las opciones = países distintos presentes en
   las ofertas actuales (mismo criterio que `/ofertas` usa para su propio
   filtro de destino: `offer.location.country`). Valor por defecto:
   "Cualquier destino" (sin filtro).
2. **Fecha** — selector de fecha única, opcional. Mapea a la misma
   semántica que `/ofertas` ya usa: la fecha debe caer dentro de
   `availability.startDate`–`availability.endDate` de la oferta.
3. **Personas** — contador numérico (mínimo 1, por defecto 1). No filtra
   nada en `/ofertas` hoy (no existe ese filtro ahí) — viaja en la URL como
   `pax` para uso futuro (por ejemplo, precargar el wizard de cotización),
   pero no es un requisito bloqueante de este cambio que `/ofertas` lo lea.

Explícitamente fuera de alcance (no tienen equivalente real en este
negocio): selector de Origen/aeropuerto, radio Solo ida/Ida y vuelta, fecha
de vuelta, checkbox de millas, código promocional, tabs
Vuelos/Administra-tu-vuelo/Check-in/Estado del vuelo.

### Componente nuevo

`frontend/components/inicio/ui/HeroSearchWidget.jsx` — reemplaza el
`<form>` de input de texto libre que hoy vive dentro de la card superpuesta
de `Hero.jsx`. Reutiliza componentes ya existentes en el proyecto en vez de
construir UI nueva desde cero:

- `HeroSelect` (`frontend/components/ui/hero-select.jsx`) para Destino.
- `DatePickerField` (`frontend/components/ui/date-picker-field.jsx`) para
  Fecha.
- `NumberField` de `@heroui/react` (patrón ya documentado en `CLAUDE.md`:
  `NumberField.Group` con `DecrementButton`/`Input`/`IncrementButton`) para
  Personas.

Layout: fila horizontal de los 3 campos + botón "Buscar" en desktop,
apilado verticalmente en mobile. Mismo estilo visual de card que ya tiene
el Hero (`bg-surface`, `border-default`, sombra) — solo cambia el
contenido interno de esa card.

### Integración con `Hero.jsx`

`Hero.jsx` necesita una fuente de datos para poblar las opciones de
Destino: se agrega un `fetch('/api/ofertas')` adicional en el `useEffect`
existente (mismo patrón que ya usa para `/api/settings/hero` y
`/api/novedades`), y se deriva la lista de países únicos igual que
`/ofertas` lo hace hoy.

El botón "Buscar" arma la URL `/ofertas?dest=<país>&date=<fecha>&pax=<n>`
(solo incluyendo los params que tengan valor) y navega ahí con
`useRouter().push(...)` — mismo mecanismo que ya usa el input actual.

### Fuera de alcance

- No se modifica `/ofertas` ni su lógica de filtrado — el widget nuevo
  solo arma una URL con los query params que esa página ya sabe leer.
- No se agrega backend nuevo, ni un endpoint de búsqueda dedicado.
- No se implementa filtrado real por cantidad de personas — `pax` queda
  como dato de URL sin efecto por ahora.
- No se agregan los tabs de gestión de cuenta de aerolínea de JetSmart
  (Administra tu vuelo, Check-in, Estado del vuelo) — no existen
  equivalentes en este negocio.
