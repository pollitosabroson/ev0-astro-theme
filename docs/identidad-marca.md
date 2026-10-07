# Identidad de marca «Azul noche y oro» — guía de integración

Documento para Claude Code. Léelo antes de tocar cabecera, colores, tipografía, favicons, imágenes para compartir o cualquier componente visual del blog.

La fuente de verdad de la marca es el Design System «Alejandro Rosales» (azul noche y oro), que se usa en el canal de YouTube, los vídeos y este blog. Este documento resume lo que afecta al blog.

---

## 1. Estado actual

- Rama: `feat/identidad-marca` (creada desde `main` en `eac2f8c`).
- Detalle de los cambios en la sección 3.
- Verificado: `npm run build` completo en el Mac, y revisión visual con Playwright (home, post, `/blog/`, `/tags/`, 404, móvil a 390 px; claro y oscuro).

---

## 2. Reglas de marca para el blog

### Color

| Token | Hex | Uso en el blog | Clase Tailwind |
|---|---|---|---|
| azul-noche | `#0A0E17` | Tinta principal de marca, fondos oscuros de marca, `msapplication-TileColor`, `theme_color` del manifest | `marca-noche` |
| pizarra | `#111826` | Segundo fondo oscuro, degradados | `marca-pizarra` |
| oro | `#E8B84B` | Acento **sólo sobre fondo oscuro** (modo oscuro): enlaces, hover, destacados | `marca-oro` |
| oro-tinta | `#8A6414` | Acento **sobre fondo claro**: enlaces, hover, destacados. 5,4:1 sobre blanco | `marca-oro-tinta` |
| marfil | `#F4F6FB` | Texto sobre azul noche | `marca-marfil` |
| niebla | `#9AA6BC` | Texto secundario sobre azul noche. **No usar como texto sobre blanco** (2,4:1) | `marca-niebla` |
| grafito | `#4A5568` | Texto secundario sobre blanco (7,5:1) | `marca-grafito` |

Reglas:

1. El `oro` puro (`#E8B84B`) **nunca** va como texto sobre fondo claro: da 1,7:1. Sobre claro se usa `oro-tinta`.
2. Patrón para cualquier acento: `text-marca-oro-tinta dark:text-marca-oro` (y lo mismo con `border-`, `hover:`, `group-hover:`).
3. **El verde no es decorativo.** En la marca, verde (`#3FD98A`) significa «sube / bueno» y rojo (`#F0616D`) «baja / malo», siempre con signo o flecha. No uses `green-*` para enlaces, hovers ni bordes. Excepción ya existente: el check de «copiado» en `src/components/mdx/Code.astro` (indica éxito).
4. Neutros: se mantiene la escala `zinc` del tema EV0 para fondos y texto general.
5. Un solo acento por bloque: si todo es dorado, nada destaca.

### Tipografía

- Una sola familia: **Inter**, autoalojada en `public/fonts/inter-{400,600,800,900}.woff2` (subconjunto latín + latín extendido, ~22 KB cada una).
- `font-sans` de Tailwind ya apunta a Inter. No añadas Google Fonts ni otras familias.
- Pesos: 900 titulares y cifras · 800 rótulos pequeños en mayúsculas con `tracking-[0.2em]` · 600 subtítulos · 400 texto largo.
- Si necesitas un peso nuevo, genera el `.woff2` con el mismo subconjunto y añade su `@font-face` en `src/styles/global.css`. No uses un peso sin archivo (el navegador lo falsearía).

### Logos e imágenes

| Archivo | Uso |
|---|---|
| `public/logo-header-light.svg` | Logo de cabecera en modo claro (sello AR + nombre en azul noche). 720×160, se muestra a `h-9 sm:h-10` |
| `public/logo-header-dark.svg` | Logo de cabecera en modo oscuro («Rosales» en oro) |
| `public/logoLight.png`, `public/logoDark.png` | Sello AR cuadrado 512×512. Los usa el JSON-LD como `publisher.logo`. **Deben seguir siendo PNG** (Google no garantiza SVG como logo) |
| `public/og-default.png` | Imagen para compartir por defecto, 1200×630. Fallback de `og:image`, `twitter:image` y `image` del JSON-LD |
| `public/favicons/*` | Favicon SVG, ICO, PNG 16/32, apple-touch-icon 180, android-chrome 192/512, safari-pinned-tab |
| `public/favicon.png` | Sello AR 512 (lo conserva la plantilla) |
| `public/blog-placeholder.jpg` | **Ya no se usa** como fallback. Se mantiene por si algún post antiguo lo referencia. No lo borres sin hacer `grep` |

No redibujes ni modifiques los logos: si hace falta otra variante, pídela a partir del Design System.

---

## 3. Qué se cambió y dónde

### Configuración

- `src/config/config.json`
  - `site.favicon` → `/favicons/favicon.svg`
  - nuevas claves `site.headerLogoLight` / `site.headerLogoDark`
  - `logoLight` / `logoDark` se mantienen (JSON-LD)
- `tailwind.config.cjs` → `theme.extend.colors.marca.*` y `theme.extend.fontFamily.sans` (Inter)
- `src/utils/manifest.ts` → `short_name: 'A. Rosales'`, `theme_color: '#0A0E17'`, `background_color: '#ffffff'`

### Layouts y componentes

- `src/layouts/Base.astro`
  - favicons: SVG + ICO + `apple-touch-icon` + `mask-icon`
  - `preload` de `inter-400` e `inter-900`
  - `msapplication-TileColor` `#0A0E17`
  - `theme-color` claro `#ffffff` y oscuro `#18181b`
  - eliminado el meta `theme-name` de bookworm (resto de otra plantilla)
  - fallback de `ogImage` → `/og-default.png`
- `src/components/Header.astro` → `<img>` con `headerLogoLight/Dark`, `h-9 w-auto sm:h-10`, sin `astro:assets` (era un PNG cuadrado a 80 px)
- `src/components/BlogPostJsonLd.astro` y `src/scripts/jsonld-generator.mjs` → fallback de imagen `/og-default.png`
- `src/components/RelatedPosts.astro` → verdes sustituidos por `marca-oro-tinta` / `marca-oro`
- `src/pages/tags/index.astro` → `text-green-400` → `text-marca-oro-tinta dark:text-marca-oro`
- `src/layouts/BlogPost.astro`, `src/layouts/Page.astro` → `prose-green` → `prose-zinc`
- `src/components/HomePagination.astro`, `src/pages/404.astro` → botón `indigo-*` → borde y texto `marca-oro-tinta` / `marca-oro`
- `src/components/Pagination.astro` → página actual `indigo-*` → fondo `marca-oro-tinta` (claro) / `marca-oro` con texto `marca-noche` (oscuro)
- `src/components/DisclaimerFinanciero.astro` → `amber-*` → bloque `zinc` con filete izquierdo de oro; fondo `marca-pizarra` en oscuro
- `src/pages/tags/index.astro` → nube arcoíris → `zinc` con algunas etiquetas en oro
- `src/components/mdx/Code.astro` (hover del botón copiar) y `src/config/social.js` (hover de X) → oro
- `src/config/config.json` → `site.lang` `"en"` → `"es"`

### Estilos

- `src/styles/global.css`
  - 4 `@font-face` de Inter
  - `--color-text-link` definido: antes **no estaba definido en ningún sitio** y el subrayado de enlaces del plugin de tipografía no tenía color. Ahora vale `138 100 20` en claro y `232 184 75` en `.dark`
  - `.prose a` en `marca-oro-tinta`; `.dark .prose a` en `marca-oro`

### Documentación

- `CLAUDE.md` → la regla «`green` para acento» se sustituye por la de marca.

---

## 4. Pendiente (en este orden)

1. **Borrar `.git/_to_delete/`.** Contiene un `index.lock` vacío y obsoleto que se movió ahí al crear la rama. Comando: `rm -rf .git/_to_delete`. No afecta al repo.
2. **Build local:** `npm run build`. Debe terminar sin errores.
3. **Revisión visual** con `npm run preview`:
   - home claro y oscuro
   - un post con enlaces
   - `/tags/`
   - artículos relacionados al final de un post
   - móvil a 390 px
4. **Commit** en `feat/identidad-marca` y PR a `main`.
5. **Tras desplegar en Netlify:**
   - pasar la home y un post por https://developers.facebook.com/tools/debug/ (refresca la caché de `og:image`)
   - abrir en ventana privada para ver el favicon nuevo

### Decisiones abiertas (no las cambies sin confirmación del autor)

- `site.title` («Alejandro Rosales, Inversor y Divulgador Financiero») no coincide con la frase del canal: «El dinero que mueve el mundo, sin humo y sin postureo.»
- `author.bio` en la home ocupa ~8 líneas. En una cabecera funcionan mejor 1–2 frases.
- `public/favicons/site.webmanifest` es un resto de la plantilla y no se enlaza. El manifest real lo genera `vite-plugin-pwa` desde `src/utils/manifest.ts`. Se puede borrar.

---

## 5. Cómo aplicar la marca a algo nuevo

- **Acento en un componente:** `text-marca-oro-tinta dark:text-marca-oro`, nunca `green-*`, `indigo-*` ni `amber-*`.
- **Bloque destacado oscuro** (p. ej. un banner de suscripción): `bg-marca-noche text-marca-marfil`, secundario `text-marca-niebla`, acento `text-marca-oro`.
- **Dato que sube o baja:**
  - sube: `text-[#3FD98A]` con `▲` o `+`
  - baja: `text-[#F0616D]` con `▼` o `−`
  - si se repite, añade los tokens `sube` / `baja` a `colors.marca` en `tailwind.config.cjs`
- **Rótulo pequeño de marca:** `text-xs font-extrabold uppercase tracking-[0.2em] text-marca-oro-tinta dark:text-marca-oro`, precedido de un guion `inline-block h-1 w-8 rounded-full bg-current`.
- **Imagen OG por artículo:** si un post no tiene `heroImage`, se usa `og-default.png`. No vuelvas a apuntar a `blog-placeholder.jpg`.
- **Contraste mínimo:** 4,5:1 para texto normal y 3:1 para texto ≥ 24 px o iconos. Comprueba cualquier combinación nueva antes de usarla.

---

## 6. Comprobación rápida

```bash
# No queda verde decorativo (sólo debe aparecer Code.astro)
grep -rn "green-" src --include=*.astro

# Ningún fallback apunta al placeholder antiguo
grep -rn "blog-placeholder" src

# Los assets existen
ls public/fonts/inter-*.woff2 public/favicons/favicon.svg public/og-default.png public/logo-header-*.svg

# Build
npm run build
```
