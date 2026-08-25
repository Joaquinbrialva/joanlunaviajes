# Rediseño: modales de resumen (destinos y ofertas) con hero inmersivo

## Contexto

`DestinationPreviewDrawer` y `OfferPreviewDrawer` son los modales de "vista rápida" que se abren desde las tablas admin (`/admin/destinos`, `/admin/ofertas`). Hoy tienen implementaciones inconsistentes:

- `destination-preview-drawer.jsx` usa `AdminDrawer` (drawer lateral angosto, `max-w-xl`) con una cabecera de imagen chica (h-40) y filas de texto planas (`Row`/`Section`).
- `offer-preview-drawer.jsx` implementa su propio modal centrado con un panel de imagen a la izquierda (42% de ancho) y contenido a la derecha, ya con badges y pills sobre la imagen.

El usuario no está conforme con ninguno de los dos y pidió un rediseño con un componente tipo "hero".

## Objetivo

Unificar ambos modales bajo un mismo lenguaje visual: un **hero inmersivo full-bleed** en la parte superior (imagen a todo el ancho con gradiente y contenido superpuesto) seguido de contenido detallado scrolleable debajo, dentro de un modal centrado compartido.

## Alcance

- Nuevo componente `PreviewModal` (shell: backdrop + contenedor centrado + Escape/scroll-lock).
- Nuevo componente `PreviewHero` (imagen full-bleed + badges + título + meta + stat pills, genérico).
- Refactor de `destination-preview-drawer.jsx` para usar ambos, dejando de depender de `AdminDrawer`.
- Refactor de `offer-preview-drawer.jsx` para usar ambos, cambiando de layout split (imagen izquierda / contenido derecha) a layout vertical (hero arriba / contenido abajo).
- `AdminDrawer` no se modifica ni se elimina (sigue en uso en `/admin/usuarios`).
- El contenido interno de cada sección (Row, Section, TagList, StatBar en destinos; SectionHeader, StarRating, etc. en ofertas) se mantiene igual — solo cambia la cabecera y el contenedor.

## Componentes nuevos

### `frontend/components/admin/preview-modal.jsx`

Shell de modal centrado, sin conocimiento de contenido:

```
<PreviewModal isOpen onClose maxWidth="max-w-4xl">
  {children}
</PreviewModal>
```

- Backdrop `fixed inset-0 bg-black/60 backdrop-blur-sm` con click-to-close.
- Contenedor centrado con transición `scale/opacity` (idéntica a la actual de `offer-preview-drawer.jsx`: `scale-95 opacity-0` → `scale-100 opacity-100`, duration-300).
- `useEffect` para Escape key + `document.body.style.overflow = 'hidden'` mientras está abierto (extraído del código ya existente en `offer-preview-drawer.jsx`).
- Layout interno `flex flex-col` con altura `h-[92vh] md:h-[85vh] max-h-[820px]`, `rounded-3xl overflow-hidden shadow-2xl`.
- No incluye botón de cerrar propio — eso vive en `PreviewHero` (superpuesto sobre la imagen) para no duplicar UI de cierre.

### `frontend/components/admin/preview-hero.jsx`

Hero full-bleed genérico, sin saber si es oferta o destino:

```
<PreviewHero
  image={cover}
  fallbackIcon={LuMapPin}
  eyebrow={offer.subtitle}          // opcional, texto chico arriba del título
  title={offer.title}
  meta={[{ icon: LuMapPin, text: 'Ciudad, País' }]}   // línea bajo el título
  badges={[{ label: 'Publicado', variant: 'published' }, ...]}
  stats={[{ label: 'Precio', value: '$1.200' }, ...]} // pills glass abajo
  onClose={onClose}
/>
```

- Altura: `h-56 md:h-72` (fijo, no proporcional al modal — más predecible que un %).
- Imagen `absolute inset-0 object-cover`; si no hay imagen, ícono centrado sobre fondo `bg-zinc-900` (usa `fallbackIcon`, default `LuMapPin`).
- Gradiente `bg-gradient-to-t from-black/90 via-black/30 to-black/10` para legibilidad.
- Botón cerrar: `absolute top-4 right-4`, círculo glass (`bg-white/10 backdrop-blur-md border border-white/15`), ícono `LuX`.
- Badges: `absolute top-4 left-4`, reutiliza el componente `StatusBadge` que ya existe en `offer-preview-drawer.jsx` (se mueve a `preview-hero.jsx` y se exporta si algún otro archivo lo necesita — por ahora solo lo usan destinos y ofertas).
- Bloque inferior (`absolute bottom-0 left-0 right-0 px-5 pb-5`): eyebrow (si existe) → título (`text-white font-bold text-2xl md:text-3xl`) → meta (íconos + texto, `text-white/60 text-xs`) → fila de stat pills (`flex flex-wrap gap-2 mt-3`, mismo estilo glass que las pills actuales de ofertas).
- Sin pills en mobile-hidden — a diferencia del comportamiento actual de ofertas (que ocultaba las pills en mobile y las movía a una franja aparte), en el nuevo diseño las pills SÍ se muestran siempre dentro del hero (full-bleed da más espacio). Se elimina la "franja de stats mobile" separada que tenía `offer-preview-drawer.jsx`.

## Cambios en `destination-preview-drawer.jsx`

- Deja de importar `AdminDrawer`; pasa a `PreviewModal` + `PreviewHero`.
- Props del hero:
  - `image`: `destination.featuredImage`
  - `fallbackIcon`: `LuMapPin` (o ícono de globo si se prefiere, a criterio de implementación)
  - `title`: `destination.name`
  - `meta`: `[{ text: '${country} · ${continent}' }]`
  - `badges`: estado (Publicado/Borrador), Popular 🔥, Destacado ⭐ — mismas condiciones que hoy
  - `stats`: hasta 3 pills — Índice de seguridad (`stats.safetyIndex`), Temperatura (`climate.averageTemperatureC`), Idioma (`ti.language`) — solo se incluyen si el dato existe
- El resto del body (`Section`/`Row`/`TagList`/`StatBar` para Identificación, Info de viaje, Clima, Estadísticas, Contenido editorial, SEO) se mantiene sin cambios funcionales, ahora dentro de un `<div className="flex-1 overflow-y-auto min-h-0">`.
- Footer de acciones (Editar destino / Ver pública) se mantiene igual, como bloque `shrink-0 border-t` al final del modal (ya no es footer de `AdminDrawer`, es parte del flex column de `PreviewModal`).

## Cambios en `offer-preview-drawer.jsx`

- Reemplaza el layout `flex-col md:flex-row` (imagen 42% + contenido) por `PreviewModal` + `PreviewHero` arriba + contenido scrolleable abajo (`flex flex-col`).
- Props del hero:
  - `image`: `cover` (igual que hoy)
  - `eyebrow`: `offer.subtitle`
  - `title`: `offer.title`
  - `meta`: ciudad/país + aeropuerto (igual info que hoy)
  - `badges`: Publicado/Borrador, Destacada, Especial, Popular, Pocos cupos — mismas condiciones actuales
  - `stats`: Precio (con badge de descuento si aplica), Duración, Cupos — mismas pills que ya existían, ahora siempre visibles (no solo desktop)
- Se elimina la franja de "quick stats" duplicada para mobile (ya no hace falta, ver nota en `PreviewHero`).
- El resto de las secciones (Vuelo, Fechas, Precio, Alojamiento, Incluye/No incluye, Highlights & Tags, Metadatos) se mantienen intactas, solo se remueve el top-bar propio ("Resumen de oferta" + botón X) porque el cierre ahora vive en el hero. Se puede mantener un pequeño top-bar sin botón de cerrar (solo label "Resumen de oferta") o quitarlo del todo — se deja a criterio de implementación, priorizando consistencia con destinos (que no tenía top-bar propio).
- Footer sticky (Editar oferta / Ver pública) se mantiene igual.

## Fuera de alcance

- No se toca `AdminDrawer` (sigue usándose en `/admin/usuarios`).
- No se cambian los datos que consumen los modales, ni las rutas de edición/vista pública.
- No se agregan animaciones nuevas más allá de las transiciones ya existentes (fade/scale del modal).
