<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Joanluna Viajes
description: Agencia de viajes en Buenos Aires — energía de aventura en cada destino.
---

# Design System: Joanluna Viajes

## 1. Overview

**Creative North Star: "El Itinerario Encendido"**

Joanluna Viajes no vende folletos, vende la sensación de estar por despegar. El sistema visual arranca de la paleta completa: el naranja de marca (#ff7d2d, avión + wordmark ya existente) como color que abre puertas, acompañado de 2-3 colores compañeros deliberados que evocan cielo, mar y tierra — cada uno con un rol claro, no decorativo. Tipografía sans única, geométrica y de rasgos técnicos: confiada, legible, sin ornamento innecesario — deja que el color y el movimiento carguen la energía. El movimiento es coreografiado: entradas orquestadas, secuencias scroll-driven que hacen que explorar ofertas y destinos se sienta como ir avanzando en un viaje, no como scrollear un catálogo.

Este sistema rechaza explícitamente lo que PRODUCT.md marca como anti-referencia: el look "AI slop" (plantillas genéricas, tarjetas idénticas repetidas, degradados de texto, eyebrows en mayúsculas sobre cada sección), el sitio corporativo formal y frío, el fondo crema/beige genérico "IA 2026", y — específico de esta ronda — cualquier estética de SaaS/dashboard de producto (cards planas, iconografía de UI, tono frío) filtrándose al sitio público. El admin puede sentirse funcional; el sitio público, nunca.

**Key Characteristics:**
- Paleta completa con el naranja de marca como ancla, no como único acento
- Sans geométrica y técnica en toda la jerarquía tipográfica
- Movimiento coreografiado: el scroll cuenta una historia de viaje
- Cero clichés de "agencia de viajes tradicional" ni de "SaaS de producto"

## 2. Colors

Paleta completa de 3-4 roles deliberados, con el naranja de marca como color primario que porta identidad — no restringido a un 10% decorativo.

### Primary
- **Naranja Vuelo** (`#ff7d2d`): color de marca heredado del logo. Protagonista en CTAs, hero, momentos de decisión ("cotizar", "ver oferta") y acentos de navegación. [tono exacto de uso — sólido vs. tinte — a resolver en implementación]

### Secondary
- **[Azul Cielo / Turquesa — nombre descriptivo a definir]** (`[hex a resolver]`): rol de "destino/aire" — secciones de destinos, fondos de hero alternativos, contraste fresco frente al naranja cálido.

### Tertiary
- **[Verde Tierra o Coral Atardecer — a elegir en implementación]** (`[hex a resolver]`): tercer rol para variedad entre ofertas/categorías sin caer en semáforo de colores.

### Neutral
- **[Tinte oscuro de marca para texto — a resolver]**: texto principal, con tinte hacia el hue de marca, no gris puro.
- **[Fondo claro con tinte — a resolver]**: superficies base. Explícitamente NO crema/beige genérico "IA 2026" — si es claro, chroma bajo hacia el hue propio de la marca, no hacia calidez por defecto.

### Named Rules
**La Regla del Ancla Naranja.** El naranja de marca (#ff7d2d) aparece en todo momento de decisión (CTA, precio, estado activo). Nunca se diluye a un gris-naranja "seguro"; cuando aparece, es reconociblemente el naranja del logo.

## 3. Typography

**Display Font:** [sans geométrica y técnica — familia a elegir en implementación, ej. candidatas tipo Inter/Manrope/Space Grotesk según disponibilidad]
**Body Font:** misma familia, pesos distintos (sistema de una sola familia)
**Label/Mono Font:** no distinto — se resuelve con peso/tracking de la misma sans

**Character:** Una sola voz tipográfica de rasgos geométricos y técnicos — confiada y clara, sin la calidez de una script ni la formalidad de una serif. La energía de marca vive en el color y el movimiento, no en la tipografía.

### Hierarchy
- **Display** ([peso a definir, probablemente bold/black], `[clamp a definir, techo ≤6rem]`, line-height ajustado): titulares de hero y de sección — destinos destacados, ofertas hero.
- **Headline** ([peso semibold], [tamaño a definir]): encabezados de sección.
- **Title** ([peso medium], [tamaño a definir]): títulos de tarjeta de oferta/destino.
- **Body** ([peso regular], [tamaño a definir], máx. 65-75ch): descripciones de ofertas, texto de contacto.
- **Label** ([peso medium/semibold], [tamaño pequeño], [tracking leve]): etiquetas de UI, precios, badges — sin caer en el patrón de eyebrow en mayúsculas repetido en cada sección.

### Named Rules
**La Regla de una Sola Voz.** Toda la jerarquía usa la misma familia sans geométrica; la diferenciación es de peso y tamaño, nunca de mezclar familias.

## 4. Elevation

Coreografía de movimiento implica capas: el sistema es mayormente plano en reposo, con elevación que aparece como respuesta a scroll y a interacción (tarjetas que se levantan al entrar en viewport, hover con profundidad sutil), no como decoración constante. [vocabulario exacto de sombra a definir en implementación]

### Named Rules
**La Regla de Elevación con Propósito.** Ninguna sombra decorativa en reposo. La elevación aparece cuando algo entra en escena (scroll-reveal) o responde a una acción (hover, focus) — nunca como relleno visual.

## 5. Components

*[Sin componentes existentes documentados — este es un DESIGN.md semilla. Los componentes reales (botones, tarjetas de oferta/destino, navegación, inputs) se documentarán al re-ejecutar `/impeccable document` una vez que haya código implementado.]*

## 6. Do's and Don'ts

### Do:
- **Do** usar el naranja de marca (`#ff7d2d`) como color de decisión reconocible en cada CTA y momento clave.
- **Do** construir una paleta completa de 3-4 roles con propósito claro por color, no colores decorativos sin rol.
- **Do** usar una única familia sans geométrica y técnica en toda la jerarquía tipográfica.
- **Do** coreografiar el scroll: las secciones de ofertas y destinos entran con intención, reforzando la sensación de viaje.
- **Do** mantener contraste de texto ≥4.5:1 en cuerpo, incluso sobre fondos con tinte de color.

### Don't:
- **Don't** usar tarjetas idénticas repetidas en grilla sin variación — el patrón "agencia de viajes tradicional/catálogo" está explícitamente prohibido.
- **Don't** dejar que el sitio público se sienta como un dashboard de SaaS: nada de cards planas, iconografía de UI genérica, ni tono frío de producto.
- **Don't** usar degradados de texto (`background-clip: text` + gradiente).
- **Don't** usar eyebrows en mayúsculas sobre cada sección como scaffolding por defecto.
- **Don't** usar fondo crema/beige genérico "IA 2026" como base de superficie.
- **Don't** diluir el naranja de marca a un tono "seguro" — si aparece, es el naranja reconocible del logo.
