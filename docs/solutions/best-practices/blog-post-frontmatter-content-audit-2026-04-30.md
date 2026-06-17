---
title: "Blog post frontmatter y content audit al publicar un post nuevo"
date: 2026-04-30
category: best-practices
module: content/blog
problem_type: best_practice
component: documentation
symptoms:
  - "Campo author (string) usado en lugar de authors (array), rompiendo el schema Zod"
  - "Categorías no canónicas o mal clasificadas (tags usados como categorías)"
  - "Tags en minúsculas en lugar de Title Case, no coincidiendo con la lista canónica"
  - "Artículos relacionados enlazando a slugs inexistentes (ejemplos placeholder nunca reemplazados)"
  - "URLs internas sin trailing slash generando cadenas de redirección 301"
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: medium
related_components:
  - tooling
tags:
  - frontmatter-schema
  - content-standards
  - internal-linking
  - tags-categories
  - trailing-slash
  - seo
  - authors-array
  - placeholder-links
---

# Blog post frontmatter y content audit al publicar un post nuevo

## Problem

Al publicar un post nuevo (`nvidia-historia-inteligencia-artificial.md`) se encontraron seis errores de frontmatter y contenido: campo `author` en singular en vez de `authors` array, categorías no canónicas, tags en minúsculas, tres enlaces en "Artículos relacionados" apuntando a slugs que no existen, URLs internas sin trailing slash, y ausencia de los enlaces internos al cuerpo requeridos por la guía de enlazado.

## Symptoms

- `author: "Alejandro Rosales"` en lugar de `authors: ["Alejandro Rosales"]` — silenciosamente ignorado o rechazado por el schema Zod de la colección
- `categories: ["Tecnología", "Inteligencia Artificial", "Inversiones"]` — `Tecnología` no existía en la lista canónica; `Inteligencia Artificial` es un tag, no una categoría
- `tags: ["nvidia", "ia", "inteligencia artificial", "jensen huang", "gpu"]` — todos en minúsculas, violando Title Case; ninguno coincidía con la lista canónica
- Sección "Artículos relacionados" con tres slugs de posts que no existen (`/blog/ia-cambiando-trabajo-salarios/`, `/blog/ia-consumo-energia/`, `/blog/mercado-global-semiconductores/`) → 404 en producción
- URLs internas sin `/` al final → redirecciones 301 innecesarias en cada clic
- Tres menciones de temas HUB en el cuerpo sin enlazar, dejando valor SEO de enlazado interno sin aprovechar

## What Didn't Work

N/A — fue una auditoría de frontmatter y contenido, no una sesión de depuración. No hubo intentos de fix fallidos.

## Solution

**1. Campo `authors` (array):**
```yaml
# Antes
author: "Alejandro Rosales"

# Después
authors: ["Alejandro Rosales"]
```

**2. Categorías canónicas:**
```yaml
# Antes
categories: ["Tecnología", "Inteligencia Artificial", "Inversiones"]

# Después
categories: ["Tecnología", "Empresas", "Inversiones"]
```
`Tecnología` se añadió como nueva categoría canónica a `docs/tags-categories-standard.md`. `Inteligencia Artificial` pasó a tags. `Empresas` sustituyó a `Inteligencia Artificial` porque el post es un caso de estudio de empresa.

**3. Tags en Title Case + canónicos:**
```yaml
# Antes
tags: ["nvidia", "ia", "inteligencia artificial", "jensen huang", "gpu", "tecnología", "inversiones"]

# Después
tags: ["NVIDIA", "Inteligencia Artificial", "Jensen Huang", "GPU", "Semiconductores", "Inversiones", "Análisis de Mercado", "Economía Global"]
```
Se añadieron 5 nuevos tags canónicos a `docs/tags-categories-standard.md`: `GPU`, `Jensen Huang`, `NVIDIA`, `Semiconductores`, `Tecnología`.

**4. Reemplazar slugs placeholder en "Artículos relacionados":**

Verificar slugs reales antes de escribirlos:
```bash
ls src/content/blog/ | grep <fragmento-del-slug>
```

```markdown
# Antes (slugs inexistentes)
👉 [IA y el trabajo](/blog/ia-cambiando-trabajo-salarios/)
👉 [Consumo energético IA](/blog/ia-consumo-energia/)
👉 [Mercado de chips](/blog/mercado-global-semiconductores/)

# Después (slugs verificados)
👉 [¿La IA va a quitarte el trabajo en 2026?](/blog/ia-trabajo-2026-impacto-empleo-realidad/)
👉 [Megatendencias de inversión hacia 2040](/blog/megatendencias-inversion-2040/)
👉 [iRobot: Cómo una Empresa Líder Pasó a la Bancarrota](/blog/irobot-historia-bancarrota-lecciones-financieras/)
```

**5. Trailing slashes en URLs internas:**

Todas las URLs internas deben terminar en `/`. El middleware redirige automáticamente (301) pero la generación correcta evita la cadena de redirección.

**6. Añadir enlaces internos al cuerpo (máx 3, primera aparición, no en TL;DR ni FAQ):**
```markdown
# Primera mención de "Inteligencia Artificial" en el cuerpo
[Inteligencia Artificial](/blog/ia-trabajo-2026-impacto-empleo-realidad/)

# Primera mención de "inversores"
[inversores](/blog/tipos-de-inversores/)

# Primera mención de "corrección"
[corrección importante](/blog/mercado-en-rojo-que-hacer/)
```

**7. Actualizar `docs/internal-linking-guide.md`:**
- Añadir el nuevo post a la tabla de artículos HUB (con las palabras clave que disparan el enlace)
- Añadir los 3 enlaces aplicados al historial

## Why This Works

El schema Zod en `src/content/config.ts` define `authors` como array; usar `author` (string) causa rechazo silencioso. Los archivos de páginas de tags y categorías se generan a partir de la lista canónica — valores fuera de ella producen páginas vacías o duplicadas. Los slugs en "Artículos relacionados" no se validan en build time (SSG), por lo que los 404 solo aparecen en producción. El middleware en `src/middleware.ts` redirige sin trailing slash → con trailing slash, pero las redirecciones 301 incrementan la latencia y diluyen señales SEO. Los enlaces internos distribuyen PageRank según la estrategia documentada en `docs/internal-linking-guide.md`.

## Prevention

**Checklist antes de hacer merge de cualquier post nuevo** (ya existe en `docs/tags-categories-standard.md`):

- [ ] `authors` es array: `["Alejandro Rosales"]` — nunca `author` en singular
- [ ] Cada categoría existe en la lista canónica de `docs/tags-categories-standard.md`
- [ ] Cada tag existe en la lista canónica y usa Title Case
- [ ] Máximo 3 categorías y 8 tags
- [ ] Tildes correctas en todos los campos
- [ ] `heroImage` en formato `/blogs/nombre.webp`

**Verificar slugs de "Artículos relacionados" antes de escribirlos:**
```bash
# Verificar que el slug existe
ls src/content/blog/ | grep ia-trabajo

# Si no aparece nada, buscar el post real más relevante
ls src/content/blog/ | grep -E "(ia|inteligencia)"
```

**Añadir tags/categorías nuevas en el mismo commit que el post:**

Si el post introduce un término nuevo (empresa tech, persona, tecnología), añadir el tag o categoría a `docs/tags-categories-standard.md` en la misma PR — nunca después.

**Scan rápido de errores comunes antes del merge:**
```bash
# Detectar 'author:' en singular
grep -n "^author:" src/content/blog/<nuevo-post>.md

# Detectar tags en minúsculas
grep -A20 "^tags:" src/content/blog/<nuevo-post>.md | grep '"[a-z]'

# Detectar URLs sin trailing slash en el cuerpo
grep -n '\](/blog/[^/)]*)' src/content/blog/<nuevo-post>.md
```

**Actualizar `docs/internal-linking-guide.md` con cada nuevo post:**
- Añadir a la tabla HUB si el post cubre un tema recurrente
- Añadir los enlaces aplicados en el cuerpo al historial

## Related Issues

- `docs/solutions/workflow-issues/netlify-llms-txt-build-pipeline-not-auto-updating-2026-04-03.md` — cubre la normalización masiva de tags/categorías en 92 posts (auditoría previa); overlap moderado en tags/categorías e internal linking, sin cubrir placeholder links ni trailing slashes
- `docs/tags-categories-standard.md` — fuente de verdad para categorías, tags y checklist de publicación
- `docs/internal-linking-guide.md` — tabla de artículos HUB y reglas de enlazado interno
