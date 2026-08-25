# Preview modals v2: full-screen overlay + grid content

## Contexto

`docs/superpowers/specs/2026-07-19-preview-hero-modals-design.md` unificó `DestinationPreviewDrawer` y `OfferPreviewDrawer` bajo un `PreviewModal` (modal centrado, `max-w-4xl`) + `PreviewHero` (hero full-bleed) compartidos. Implementado y en `dev` (commits `8c0dd30`, `2be4814`, `9ce93b7`, `65f583b`).

El usuario probó el resultado y no le gusta: el modal angosto centrado obliga a apilar todas las secciones de contenido (Vuelo, Fechas, Precio, Alojamiento, etc. / Identificación, Info de viaje, Clima, etc.) en una sola columna larga, generando mucho scroll y sensación de espacio desperdiciado a los costados en pantallas grandes.

## Objetivo

Mismo par de componentes (`PreviewModal`, `PreviewHero`) evoluciona a:
1. `PreviewModal` pasa de modal centrado angosto a **overlay full-screen**.
2. El contenido debajo del hero pasa de columna única apilada a **grid de 2-3 columnas** en desktop, reduciendo el scroll vertical.

No se reescribe todo desde cero — es una evolución de los mismos componentes ya construidos, más el reordenamiento del grid de contenido dentro de cada drawer.

## Alcance

- Modificar `frontend/components/admin/preview-modal.jsx`: de modal centrado (`max-w-4xl`, `rounded-3xl`, `p-3 sm:p-6` padding alrededor) a overlay full-screen (`fixed inset-0`, sin max-width, sin padding perimetral, sin bordes redondeados — o redondeados solo si se decide mantener un margen mínimo, ver detalle abajo).
- Modificar `frontend/components/admin/preview-hero.jsx`: reducir altura de `h-56 md:h-72` a `h-40 md:h-56`.
- Modificar `destination-preview-drawer.jsx` y `offer-preview-drawer.jsx`: envolver las secciones de contenido en un contenedor grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`) en vez de `space-y-6`/apilado directo, de forma que cada `<Section>`/bloque de contenido sea un item de grid independiente.
- No se cambia qué datos se muestran ni la lógica de cada sección — solo el contenedor que las agrupa (de columna a grid) y el contenedor del modal (de centrado a full-screen).
- Se mantiene: apertura/cierre por click en tabla (sin cambio de URL), Escape para cerrar, click fuera del contenido para cerrar (en full-screen esto se interpreta como click en el área del hero/fondo si aplica, o se elimina el "click fuera" ya que no hay fondo visible — ver detalle).

## Detalle: `PreviewModal` full-screen

```jsx
export default function PreviewModal({ isOpen, onClose, children }) {
  // ...mismo useEffect de Escape + scroll-lock...
  return (
    <div className={`fixed inset-0 z-[70] bg-surface transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}
```

- Se elimina el backdrop separado (`bg-black/60`) y el `onClick` de "cerrar al hacer click afuera" — al ocupar toda la pantalla no hay "afuera" contra el que hacer click. Cierre queda por: botón X (en el hero, ya existente) y tecla Escape.
- Se elimina el prop `maxWidth` (ya no aplica).
- Transición: fade simple de opacidad (sin scale, que tenía sentido para un modal que "aparece" desde el centro pero no para un overlay full-screen).
- `z-[70]` se mantiene como capa única (ya no hay backdrop en `z-[60]` separado).

## Detalle: `PreviewHero` — altura reducida

Único cambio: `h-56 md:h-72` → `h-40 md:h-56` en el contenedor raíz (`frontend/components/admin/preview-hero.jsx`). El resto (imagen, gradiente, botón cerrar, badges, título, meta, stats) no cambia.

## Detalle: grid de contenido

**`destination-preview-drawer.jsx`**: el `<div className='flex-1 overflow-y-auto min-h-0'>` que envuelve las 6 secciones (Identificación, Información de viaje, Clima, Estadísticas, Contenido editorial, SEO) pasa de contener los `<Section>` uno debajo del otro a:

```jsx
<div className='flex-1 overflow-y-auto min-h-0'>
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5'>
    <Section title='Identificación'>...</Section>
    <Section title='Información de viaje'>...</Section>
    <Section title='Clima'>...</Section>
    <Section title='Estadísticas'>...</Section>
    <Section title='Contenido editorial'>...</Section>
    <Section title='SEO'>...</Section>
  </div>
</div>
```

`Section` deja de tener sus propios `border-b`/`px-5 py-4` (que asumían apilado vertical con separadores horizontales) y pasa a ser una tarjeta independiente: `rounded-2xl border border-default bg-surface-secondary/20 p-4` (mismo tratamiento visual que ya usan las tarjetas de contenido en `offer-preview-drawer.jsx`, para consistencia entre ambos drawers).

**`offer-preview-drawer.jsx`**: mismo tratamiento — el `<div className="p-5 space-y-6">` que envuelve Vuelo, Fechas, Precio, Alojamiento, Incluye/No incluye, Highlights & Tags, Metadatos pasa a `<div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`. Cada bloque de sección (que ya tiene su propio `<SectionHeader>` + card con `rounded-2xl border`) pasa a ser un item de grid tal cual está, sin necesidad de rediseñar las tarjetas internas — solo cambia el contenedor padre.

Nota: algunas secciones son naturalmente más anchas que otras (ej. "Incluye/No incluye" ya es un grid interno de 2 columnas). Se permite que una sección ocupe 2 columnas del grid externo con `md:col-span-2` cuando el contenido lo pida (a criterio de implementación, evaluado visualmente).

## Fuera de alcance

- No se cambia el footer sticky de acciones (Editar / Ver pública) más allá de que ahora ocupa el ancho completo de la pantalla.
- No se agrega navegación por URL ni ruta dedicada (se descartó en brainstorming: sigue siendo un overlay disparado por click en la tabla, sin cambiar la URL).
- No se toca `AdminDrawer` (sigue sin usarse en estos dos drawers, sigue en uso en `/admin/usuarios`).
- No se cambian los datos que consumen los modales.
