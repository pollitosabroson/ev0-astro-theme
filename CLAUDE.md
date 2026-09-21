# CLAUDE.md — alejandrorosales.me

Contexto del proyecto para Claude Code. Lee esto antes de hacer cualquier cambio.

---

## Qué es este proyecto

Blog personal de **Alejandro Rosales**, inversor y divulgador financiero hispanohablante.
URL de producción: `https://alejandrorosales.me`

Contenido: educación financiera, inversión indexada, libertad financiera, FIRE, psicología del dinero.
Audiencia: comunidad hispanohablante interesada en democratizar las inversiones.

Basado en **EV0 Astro Theme** (MIT), con extensas personalizaciones para SEO, JSON-LD y optimización para indexación por LLMs.

---

## Autor y marca

- **Nombre**: Alejandro Rosales
- **YouTube**: https://www.youtube.com/@Alejandro-Rosales
- **Twitter/X**: https://twitter.com/pollitosabroson
- **Idioma del contenido**: español neutro
- **Audiencia**: comunidad hispanohablante, finanzas personales e inversión

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Astro 4.0.7 (SSG) |
| Estilos | Tailwind CSS 3.4.0 + Typography + Aspect-Ratio plugins |
| Contenido | Markdown (.md) + MDX |
| Validación | TypeScript strict + Zod (schema de colección) |
| Hosting | Netlify (build: `npm run build`, publish: `dist/`) |
| Node | 20 (definido en `netlify.toml`) |
| PWA | vite-plugin-pwa + Workbox |
| YouTube | googleapis 129 (API v3) |
| Linting | ESLint 8 + Prettier 3 (plugins: astro, tailwindcss) |

**Variables de entorno necesarias**:
```
API_KEY=<YouTube Data API v3 key>
CHANNEL_ID=<YouTube channel ID>
IMG_PRO_KEY=<img.pro API key — CDN de imágenes>
```

---

## Estructura de carpetas

```
/
├── src/
│   ├── components/           # Componentes Astro reutilizables
│   │   ├── icons/            # SVG icons (PascalCase + Icon suffix)
│   │   ├── mdx/              # Componentes para usar dentro de .md/.mdx
│   │   ├── BlogPostJsonLd.astro     # Schema Article
│   │   ├── FAQSchema.astro          # Schema FAQPage (desde frontmatter)
│   │   ├── VideoSEO.astro           # Schema VideoObject
│   │   ├── DisclaimerFinanciero.astro  # Aviso legal automático
│   │   ├── JsonLd.astro             # Schema Person + WebSite (en Base.astro)
│   │   └── [otros componentes]
│   ├── config/
│   │   ├── config.json       # Metadata del sitio, author, features
│   │   ├── menu.json         # Navegación
│   │   └── social.js         # URLs de redes sociales
│   ├── content/
│   │   ├── blog/             # Posts en .md (español)
│   │   └── config.ts         # Schema Zod de la colección
│   ├── layouts/
│   │   ├── Base.astro        # Layout raíz (head, meta, GA4, PWA)
│   │   ├── BlogPost.astro    # Layout de artículo (schemas, disclaimer)
│   │   ├── Posts.astro       # Grid de posts paginados
│   │   └── Page.astro        # Layout simple (about, páginas)
│   ├── pages/
│   │   ├── index.astro       # Home
│   │   ├── about.astro       # Sobre mí
│   │   ├── rss.xml.js        # Feed RSS
│   │   └── blog/             # [page], [slug], categories/, tags/
│   ├── scripts/              # Plugins Astro (hooks astro:build:done)
│   │   ├── llms-generator.mjs     # Genera llms.txt + llms-full.txt
│   │   ├── jsonld-generator.mjs   # Genera structured-data.json
│   │   ├── sitemap-generator.mjs  # Genera sitemap.xml (ordenado por fecha)
│   │   ├── aria-auditor.mjs       # Auditoría a11y (informativo, no bloquea)
│   │   └── ssr-validator.mjs      # Validación SSR (informativo, no bloquea)
│   ├── styles/global.css     # Tailwind directives + overrides
│   ├── utils/                # Helpers (slug, OG image, tags, manifest)
│   └── middleware.ts         # Redirige URLs sin trailing slash (301)
├── scripts/                  # CLIs locales
│   ├── youtube.cjs           # npm run youtube → actualiza config/youtube.json
│   └── add-video-seo.cjs     # Añade campos video al frontmatter de un post
├── docs/                     # Documentación interna
│   ├── internal-linking-guide.md   # Guía de enlaces internos + HUB articles
│   └── tags-categories-standard.md # Estándar de categorías y tags
├── public/                   # Assets estáticos (webp, fonts, favicons)
├── astro.config.mjs
├── netlify.toml              # Build explícito: npm run build, Node 20
└── tailwind.config.mjs
```

---

## Convenciones de código

### Path aliases — usar siempre, nunca rutas relativas largas

```ts
@layouts/*    → src/layouts/*
@components/* → src/components/*
@config/*     → src/config/*
@content/*    → src/content/*
@styles/*     → src/styles/*
@utils/*      → src/utils/*
@icons/*      → src/components/icons/*
```

### Nombrado de archivos

- **Posts**: kebab-case en español → `como-hacer-un-presupuesto-que-funciona.md`
- **Componentes**: PascalCase → `BlogPostJsonLd.astro`
- **Íconos**: PascalCase + sufijo `Icon` → `CalendarIcon.astro`
- **Slugs**: = nombre del archivo sin extensión + trailing slash → `/blog/mi-post/`

### Frontmatter de posts

```yaml
---
title: "Título entre comillas"
description: "Descripción SEO (máx ~160 caracteres)"
pubDate: 2026-03-30
updatedDate: 2026-04-01       # opcional
heroImage: "/blogs/imagen.webp"
categories: ["Finanzas Personales", "Inversiones"]
tags: ["Fondos Indexados", "Educación Financiera"]
authors: ["Alejandro Rosales"]

# Opcional — video de YouTube
video:
  embedUrl: "https://www.youtube.com/embed/VIDEO_ID"
  thumbnailUrl: "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg"
  duration: "PT15M42S"
  uploadDate: "2026-03-30T20:00:00Z"
  chapters:
    - name: "Introducción"
      startOffset: 0
      endOffset: 90

# Opcional — FAQPage schema
faqs:
  - question: "¿Pregunta?"
    answer: "Respuesta completa."
---
```

Campos requeridos: `title`, `description`, `pubDate`.

### Categorías y tags — estándar obligatorio

Ver `docs/tags-categories-standard.md` para la lista completa. Resumen:

- **Title Case**: `Finanzas Personales`, `Fondos Indexados`, `Educación Financiera`
- **Tildes obligatorias**: `Economía Personal`, `Gestión del Dinero`
- **Formato**: `["Tag Uno", "Tag Dos"]` (array YAML con comillas dobles)
- **Límites**: máximo 3 categorías y 8 tags por post
- **Errores frecuentes a evitar**: `finanzas personales`, `educación financiera`, `fondos indexados`, `MyInvertos`, `My Investor`, `dividend`, `bce`

### Estilos

- Todo Tailwind — sin CSS modules, sin `<style>` scoped salvo casos necesarios
- Dark mode con clases `dark:` (`dark:bg-zinc-900`, `dark:text-zinc-200`)
- Artículos: `class="prose prose-green prose-md md:prose-lg min-w-full"`
- Colores: escala `zinc` para neutros, `green` para acento

### Trailing slashes

Obligatorio en todas las URLs internas. El middleware redirige automáticamente pero genera los links correctos desde el principio.

---

## Funcionalidades automáticas

### DisclaimerFinanciero

Se añade automáticamente al final de posts cuyas `categories` incluyan: `inversión`, `inversiones`, `finanzas personales`, `educación financiera`, `libertad financiera`, `blog inversiones`, `fire`, `hipotecas`, `banca digital`, `psicología del dinero`, `finanzas familiares`, `economía personal`, `private equity`, `mercados globales`.

Lógica en `src/layouts/BlogPost.astro` (array `FINANCIAL_CATEGORIES`).

### FAQSchema

Si el frontmatter incluye `faqs`, se inyecta automáticamente un JSON-LD `FAQPage`. No requiere nada más.

### JSON-LD Person

`JsonLd.astro` (incluido en `Base.astro`) emite el schema `Person` con `sameAs` apuntando a YouTube, Twitter y el sitio. Actualizar en `src/components/JsonLd.astro` si cambian las redes.

### Scripts de build (se ejecutan solos en cada `npm run build`)

| Script | Output en dist/ |
|---|---|
| `llms-generator.mjs` | `llms.txt`, `llms-full.txt` (todos los posts + sección CC BY-NC 4.0) |
| `jsonld-generator.mjs` | `structured-data.json` |
| `sitemap-generator.mjs` | `sitemap.xml` (posts ordenados por fecha descendente) |
| `aria-auditor.mjs` | Solo logs en consola |
| `ssr-validator.mjs` | Solo logs en consola |

---

## Comandos útiles

```bash
npm run dev          # Servidor local → http://localhost:4321
npm run build        # Build producción → dist/
npm run preview      # Preview del build local
npm run youtube      # Actualiza config/youtube.json con últimos videos
npm run format       # Prettier
npm run lint:eslint  # ESLint
```

---

## Enlazado interno

Ver `docs/internal-linking-guide.md` para la lista de **31 artículos HUB**.

Al escribir o editar posts:
- Enlazar todo tema HUB que se mencione de verdad (fondos indexados, interés compuesto, S&P 500, fondo de emergencia…). Sin tope numérico: el criterio es que el enlace lo pida la frase, no rellenar
- Solo primera aparición del término en el cuerpo
- No enlazar en secciones TL;DR ni FAQ
- Excepción: al retrofitar posts antiguos ya publicados, máximo 3 enlaces nuevos por tanda para no reescribirlos

---

## Contexto SEO y AI-First

El sitio está optimizado para indexación por LLMs:
- `llms.txt` y `llms-full.txt` — generados en build con todos los posts
- `robots.txt` — GPTBot, ClaudeBot, PerplexityBot permitidos; AhrefsBot, SemrushBot bloqueados
- JSON-LD schemas: `Article`, `VideoObject`, `FAQPage`, `Person`, `WebSite`
- Licencia del contenido: **CC BY-NC 4.0** (cita con atribución, no comercial)

---

## Normas de trabajo con Claude

1. **Leer antes de modificar** — nunca proponer cambios sin haber leído el archivo
2. **Mostrar propuesta y esperar confirmación** antes de aplicar cambios no triviales
3. **No inventar frontmatter** — usar solo los campos del schema Zod
4. **Eliminar artefactos de IA** — borrar cualquier `:contentReference[oaicite:X]{index=X}` en contenido generado
5. **Title Case en tags y categorías** — seguir `docs/tags-categories-standard.md`
6. **Trailing slash en todos los enlaces internos**
7. **Todo el contenido del blog en español** — no mezclar idiomas en posts
8. **No añadir features no pedidas** — no refactorizar código adyacente, no añadir comentarios innecesarios

---

## Estado del proyecto (2026-04-03)

- 92+ posts publicados en `src/content/blog/`
- 66 enlaces internos añadidos (auditoría SEO completa)
- Categorías y tags normalizados a Title Case en todos los posts
- `netlify.toml` configurado (Node 20, build explícito)
- Sitemap ordenado por fecha descendente
- `llms.txt` con sección de permisos CC BY-NC 4.0
- Footer: `© {year} Alejandro Rosales · CC BY-NC 4.0`
- `FAQSchema.astro` y `DisclaimerFinanciero.astro` implementados y activos
- `Person` schema con `sameAs` (YouTube, Twitter, sitio)
