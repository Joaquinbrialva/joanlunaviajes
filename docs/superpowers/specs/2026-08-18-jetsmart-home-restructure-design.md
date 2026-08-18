# Homepage restructure inspired by JetSmart — Design

## Objetivo

El usuario quiere que la estructura de la pantalla de inicio (y la navbar)
se inspire en la de [jetsmart.com](https://jetsmart.com/ar/es/), adaptada
al contenido real de este sitio (agencia de viajes, no aerolínea). No se
trata de copiar literalmente cada bloque de JetSmart — varios de sus
bloques son específicos de aerolínea (millas AAdvantage, blog, alianzas,
membresía "All You Can Fly") y no tienen equivalente en este sitio; esos
se descartan en vez de inventar contenido falso.

## Contexto investigado

Se inspeccionó el DOM real de jetsmart.com/ar/es/ (no solo capturas) para
confirmar proporciones exactas:

- El banner hero **no es full-bleed**: vive dentro del contenedor normal
  de contenido de la página (mismo ancho que el resto), con altura fija
  (~400px en desktop), no relativa al viewport. Esto ya se implementó en
  `Hero.jsx` (ver commits `5755e33`, `a701751`).
- Debajo del banner hay una card de búsqueda superpuesta (ya implementado).
- Debajo de eso: una fila horizontal de tarjetas de precio por destino
  ("Ofertas desde Buenos Aires, Aeroparque"), luego bloques promocionales
  específicos de aerolínea (se descartan acá), luego footer.
- La navbar de JetSmart: logo a la izquierda, links con dropdowns al
  centro, botón "Iniciar Sesión" + selector de país a la derecha, fondo
  blanco sólido siempre (sin efecto de transparencia sobre el hero).

## Alcance de este cambio

### Navbar (`frontend/components/inicio/ui/Navbar.jsx`)

- El logo se mueve de la columna central a la izquierda, junto/antes de
  los links de navegación (en vez de estar centrado entre dos columnas
  flexibles iguales).
- Se elimina el efecto de transparencia sobre el Hero en la home
  (`isIsland`, `showBg`, `active` dependientes de `scrolled` y `isHome`).
  La navbar queda con fondo sólido (mismo estilo que ya usa cuando
  `showBg` es `true` hoy) **siempre**, en todas las páginas — ya no hay
  distinción especial para `/`.
- El resto de la navbar (links, botón "Cotizar a medida", menú de
  usuario, selector de tema, menú mobile) se mantiene sin cambios
  funcionales, solo se simplifica quitando las ramas condicionales que
  dependían del estado transparente.

### Layout de la home (`frontend/components/ui/root-shell.jsx`)

Como la navbar deja de tener el modo transparente especial para `/`, la
home ya no necesita el padding-top reducido (`pt-4`) que usaba para que
el Hero llegara "detrás" de la navbar. Se unifica: la home usa el mismo
`pt-[92px]` que ya usan `/nosotros` y el resto de las páginas (siguen
existiendo las excepciones `pt-0` para `/contacto` y `/nosotros`, que no
cambian).

### Estructura de secciones (`frontend/app/page.js`)

Orden nuevo:

1. `Hero` — sin cambios adicionales a los ya implementados.
2. `Offers` ("Ofertas imperdibles") — se restylea de grid de 4 columnas
   grandes a una fila más compacta tipo tarjeta-de-precio-por-destino
   (imagen más baja, contenido más denso), inspirada en la fila "Ofertas
   desde [origen]" de JetSmart. Mismo componente, mismo endpoint
   (`GET /api/ofertas`), solo cambia el estilo de la tarjeta y el layout
   (de grid 4-col a fila horizontal con scroll en mobile / grid compacto
   en desktop — a definir el detalle exacto en el plan de implementación,
   manteniendo consistencia con el resto del design system del sitio).
3. `Destinations` ("Destinos que enamoran") — componente ya existente en
   el repo (`frontend/components/inicio/sections/Destinations.jsx`) que
   nunca se conectó a `page.js`. Se agrega sin modificaciones funcionales
   (ya trae su propio fetch a `/api/destinos`, su propio header y su
   propio empty-state).
4. `HowItWorks` ("Así funciona") — sin cambios.
5. `QuoteCTA` — sin cambios.
6. `Footer` — sin cambios (ya se renderiza fuera de `page.js`, vía
   `RootShell`).

### Fuera de alcance

- No se agregan tiles promocionales 2x2 ni ningún contenido inventado
  para llenar el hueco de los bloques específicos de aerolínea de
  JetSmart (membresía, blog, alianzas, tarifa $0).
- No se agregan mega-dropdowns a los links de la navbar — se mantienen
  los 3 links simples actuales (`Ofertas`, `Nosotros`, `Contacto`).
- No se toca el contenido/lógica de `HowItWorks`, `QuoteCTA` ni `Footer`.
- No se toca el backend — todas las secciones ya consumen endpoints
  existentes (`/api/ofertas`, `/api/destinos`, `/api/novedades` vía Hero).
