---
title: "feat: enlazado interno restante — ~220 gaps en ~75 posts"
date: 2026-05-22
status: active
depth: standard
---

# feat: Enlazado interno restante — posts con 1–4 gaps

## Summary

El audit de enlazado interno detectó ~254 gaps en total. Los 12 posts con mayor prioridad (5–8 gaps cada uno, ~30 enlaces) fueron tratados en PR #107. Quedan aproximadamente 220+ gaps distribuidos en ~70–80 posts, cada uno con 1–4 huecos. Este plan define la estrategia de ejecución por tandas para cerrar esa deuda de forma sostenida.

**Estado de partida:** 66 enlaces históricos + 27 de PR #107 = ~93 enlaces aplicados.  
**Meta de este plan:** llevar el total a ≥150 enlaces, cubriendo los posts con 3–4 gaps restantes primero.

---

## Scope Boundaries

### In scope
- Posts de `src/content/blog/` con 3–4 gaps pendientes (segunda tanda de prioridad)
- Posts con 1–2 gaps (tercera tanda, opcional según disponibilidad)
- Seguir las reglas del `docs/internal-linking-guide.md`: máximo 3 links nuevos por post, solo primera aparición en el cuerpo, no en TL;DR ni FAQ

### Deferred to Follow-Up Work
- Posts donde el trigger term aparece solo en FAQ o TL;DR (no enlazables sin editar contenido)
- Creación de artículos HUB que todavía no existen (DCA, planes de pensiones, fiscalidad)
- Actualizar el historial de `docs/internal-linking-guide.md` tras cada tanda

### Out of scope
- Modificar el contenido de los posts más allá de añadir los links
- Auto-enlazar mediante script (requiere juicio editorial para elegir el anchor correcto)

---

## Key Technical Decisions

| Decisión | Elección | Rationale |
|---|---|---|
| Tamaño de tanda | 12–15 posts por sesión | Equilibra contexto disponible vs. throughput por sesión |
| Orden de prioridad | Mayor número de gaps primero | Máximo impacto SEO por sesión |
| Branch por tanda | `internal-linking-gaps-2`, `-3`, etc. | Mantiene PRs revisables y build verificable |
| Verificación | `npm run build` antes de cada PR | Detecta slugs rotos antes de merge |

---

## Implementation Units

### U1. Re-ejecutar el audit de gaps post-PR #107

**Goal:** Obtener la lista actualizada de gaps tras el merge de PR #107, ordenada por número de huecos descendente.

**Requirements:** PR #107 mergeado en `main`, `docs/internal-linking-guide.md` commiteado.

**Dependencies:** Planes 002 y 003 completados.

**Files:**
- `scripts/_linking-audit.cjs` (temporal, se borra después de ejecutar)

**Approach:**
- Reusar la lógica del script `_linking-audit.cjs` de la sesión anterior (parser de frontmatter + búsqueda de trigger terms del guide + check de slugs ya presentes)
- Ejecutar contra `src/content/blog/` con `main` actualizado
- Guardar output en memoria para U2

**Patterns to follow:** `scripts/_linking-audit.cjs` (sesión anterior — reconstruir si no existe en `main`)

**Test scenarios:**
- Los 12 posts de PR #107 no aparecen como gaps (ya tienen los links)
- El total de gaps es ≤224 (reducción respecto a los 254 originales)
- Los posts con 0 gaps no aparecen en el reporte

**Verification:** Script produce tabla `| Post | Gaps | HUB terms sin enlazar |` sin errores.

---

### U2. Tanda 2 — posts con 3–4 gaps (primera ejecución)

**Goal:** Añadir hasta 3 enlaces internos en cada post del siguiente grupo de prioridad (3–4 gaps).

**Requirements:** Lista de gaps de U1; reglas de enlazado de `docs/internal-linking-guide.md`.

**Dependencies:** U1.

**Files:**
- `src/content/blog/*.md` — los ~15 posts con 3–4 gaps según U1

**Approach:**
- Crear rama `internal-linking-gaps-2`
- Para cada post: leer, identificar la primera aparición de cada trigger term en el cuerpo (excluyendo TL;DR, FAQ, headers de sección), añadir el markdown link
- Máximo 3 links nuevos por post
- Respetar los links ya existentes (no duplicar destino)

**Patterns to follow:** Ediciones de PR #107 en `src/content/blog/*.md`

**Test scenarios:**
- Ningún post tiene más de 3 links nuevos
- Los links añadidos usan el slug completo con trailing slash (`/blog/slug/`)
- No hay links en secciones TL;DR, FAQ, ni en el YAML frontmatter
- Un link a `/blog/slug/` no aparece dos veces en el mismo post

**Verification:** `git diff --stat HEAD` muestra solo archivos `.md` modificados; ningún link nuevo lleva a un slug inexistente.

---

### U3. Build y PR por tanda

**Goal:** Verificar que el build pasa y abrir un PR para cada tanda de ~15 posts.

**Requirements:** `npm run build` debe completar sin errores de compilación.

**Dependencies:** U2.

**Files:** Ninguno adicional (PR body only).

**Approach:**
- `npm run build` desde la raíz del proyecto
- Si el build falla: identificar el post con el slug roto, corregir antes de continuar
- PR body debe incluir: lista de posts modificados y número de links añadidos por post

**Test scenarios:**
- Build produce ≥940 páginas (misma cantidad que antes ± posts nuevos)
- PR body lista los posts con sus 3 links y los slugs de destino
- No hay warnings de Zod sobre frontmatter malformado

**Verification:** PR abierto en GitHub con CI verde (Netlify build).

---

### U4. Tandas sucesivas (repetir U2–U3 hasta agotar gaps)

**Goal:** Procesar tandas adicionales de posts en sesiones futuras hasta reducir los gaps a <20.

**Requirements:** Lista de gaps actualizada del audit (U1 o re-ejecución).

**Dependencies:** U3 de la tanda anterior mergeado.

**Files:** `src/content/blog/*.md` — siguiente grupo de posts según prioridad.

**Approach:** Mismo proceso que U2–U3. Usar rama con sufijo incremental (`-3`, `-4`, …).

**Patterns to follow:** U2–U3.

**Test scenarios:** Mismos que U2–U3.

**Verification:** Historial de `docs/internal-linking-guide.md` actualizado con los nuevos links tras cada merge.

---

## Deferred Implementation Notes

- Algunos trigger terms aparecen solo en `## TL;DR` o `## FAQ` — el audit los detecta como gaps pero las reglas prohíben enlazar ahí. Estos quedarán como "gaps estructurales" no resolvibles sin editar contenido.
- El número exacto de posts por tanda puede variar según contexto disponible en cada sesión; 12–15 es una guía, no un límite fijo.
- Si durante una tanda se detecta que un HUB article no existe todavía (e.g., `/blog/dca-dollar-cost-averaging/`), saltar ese trigger term y anotarlo en la sección "Artículos con hueco" del guide.
