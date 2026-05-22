---
title: "fix: 21 posts con categories > 3 o tags > 8 fuera de límite"
date: 2026-05-22
status: active
depth: standard
---

# fix: Posts con arrays de categories/tags fuera de límite

## Summary

El validador de taxonomía detectó 21 posts únicos con arrays que superan los límites del estándar (`docs/tags-categories-standard.md`): máximo 3 categorías y máximo 8 tags por post. El validador no auto-corrigió estos casos porque la decisión de qué eliminar requiere juicio editorial. Este plan define cómo ejecutar esas decisiones de forma segura.

**Violations detectadas (2026-05-22):**

| Post | Categorías | Tags |
|---|---|---|
| `ahorros-vs-prestamos.md` | — | 12 |
| `como-evitar-efecto-diderot-controlar-finanzas.md` | — | 12 |
| `compra-ahora-paga-despues-ventajas-riesgos.md` | 5 | — |
| `crisis-vivienda-espana-escasez-mano-obra-construccion.md` | 4 | — |
| `cumplir-propositos-seguridad-exito.md` | 4 | — |
| `depositos-plazo-fijo-inversion-segura.md` | 4 | — |
| `finanzas-personales-no-son-para-imbeciles-y-perezosos.md` | 4 | 10 |
| `frugalidad-para-mejorar-finanzas.md` | 5 | — |
| `hipoteca-laberinto-guia-vivienda-propia.md` | — | 11 |
| `hipotecas-desde-cero-que-son-como-funcionan.md` | 4 | — |
| `incrementar-inversiones-nueve-meses-estrategias-resultados.md` | 5 | 9 |
| `inversiones-noviembre-balance-bull-run-cuentas-remuneradas.md` | 5 | — |
| `invertir-vs-apostar-futuro-financiero.md` | 5 | — |
| `la-paciencia-al-invertir-private-equity.md` | 4 | — |
| `los-principales-errores-al-invertir.md` | 5 | — |
| `manejar-finanzas-familiares.md` | — | 21 |
| `movimiento-fire.md` | 9 | — |
| `nuevos-impuestos-2025-impacto-bolsillo.md` | — | 9 |
| `que-es-la-independencia-financiera-y-por-que-no-la-vas-a-lograr.md` | 5 | — |
| `reestructurar-deudas-control-financiero.md` | 4 | — |
| `swing-pricing-dual-pricing-fondos-inversion.md` | 4 | — |

---

## Scope Boundaries

### In scope
- Reducir `categories` a ≤3 en los posts con exceso
- Reducir `tags` a ≤8 en los posts con exceso
- Mantener la coherencia con `docs/tags-categories-standard.md` (Title Case, tildes, valores canónicos)

### Deferred to Follow-Up Work
- Añadir nuevas categorías o tags canónicas que actualmente no existen en el estándar

### Out of scope
- Cambiar el contenido del cuerpo de los posts
- Crear nuevas categorías o tags que no estén en el estándar canónico

---

## Key Technical Decisions

| Decisión | Elección | Rationale |
|---|---|---|
| Criterio de eliminación (categorías) | Eliminar las más genéricas primero; conservar las que más diferencian el post | Las categorías de nivel superior (`Finanzas Personales`, `Educación Financiera`) sobreviven; las sub-especializadas que solapan con otra categoría del mismo post se eliminan |
| Criterio de eliminación (tags) | Eliminar los más redundantes o genéricos; conservar los más específicos del tema | Tags como `Blog Personal`, `Educación Financiera` (ya cubierto por categoría) o variantes que solapan se eliminan primero |
| Ejecución | Edición manual post a post | Son 21 posts — manejable sin script; reduce riesgo de eliminación incorrecta |
| Branch | `fix/taxonomy-array-limits` | PR único para toda la corrección |

---

## Reglas editoriales para elegir qué eliminar

### Para `categories` (objetivo: ≤3)
1. **Conservar siempre** si el post pertenece claramente al tema (e.g., `Inversiones` para un post de cartera)
2. **Eliminar primero** las más genéricas que ya están implícitas en otra del mismo post (e.g., `Gestión del Dinero` si ya tiene `Finanzas Personales`)
3. **Eliminar** las que solapan semánticamente con otra categoría del mismo post

### Para `tags` (objetivo: ≤8)
1. **Conservar** los tags específicos del tema (nombres propios, conceptos técnicos concretos)
2. **Eliminar primero** los genéricos (`Blog Personal`, `Dinero`, `Inversión` si ya hay tags más específicos)
3. **Eliminar** los que duplican semánticamente otra categoría del mismo post
4. **Eliminar** variantes de inglés cuando existe el equivalente en español canónico

---

## Implementation Units

### U1. Corregir posts con categories > 3

**Goal:** Reducir a ≤3 los arrays de `categories` en los 15 posts afectados.

**Requirements:** Reglas editoriales definidas en este plan; canonical list de `docs/tags-categories-standard.md`.

**Dependencies:** PR #107 mergeado (para partir de `main` limpio).

**Files:**
- `src/content/blog/compra-ahora-paga-despues-ventajas-riesgos.md`
- `src/content/blog/crisis-vivienda-espana-escasez-mano-obra-construccion.md`
- `src/content/blog/cumplir-propositos-seguridad-exito.md`
- `src/content/blog/depositos-plazo-fijo-inversion-segura.md`
- `src/content/blog/finanzas-personales-no-son-para-imbeciles-y-perezosos.md`
- `src/content/blog/frugalidad-para-mejorar-finanzas.md`
- `src/content/blog/hipotecas-desde-cero-que-son-como-funcionan.md`
- `src/content/blog/incrementar-inversiones-nueve-meses-estrategias-resultados.md`
- `src/content/blog/inversiones-noviembre-balance-bull-run-cuentas-remuneradas.md`
- `src/content/blog/invertir-vs-apostar-futuro-financiero.md`
- `src/content/blog/la-paciencia-al-invertir-private-equity.md`
- `src/content/blog/los-principales-errores-al-invertir.md`
- `src/content/blog/movimiento-fire.md`
- `src/content/blog/que-es-la-independencia-financiera-y-por-que-no-la-vas-a-lograr.md`
- `src/content/blog/reestructurar-deudas-control-financiero.md`
- `src/content/blog/swing-pricing-dual-pricing-fondos-inversion.md`

**Approach:**
- Para cada post: leer el frontmatter, evaluar qué categorías conservar según las reglas editoriales, editar la línea `categories:`
- Prioridad especial: `movimiento-fire.md` tiene 9 categorías — el caso más extremo, requiere más atención editorial

**Test scenarios:**
- Ningún post en la lista tiene más de 3 categorías tras la edición
- Todos los valores restantes existen en la canonical list de `docs/tags-categories-standard.md`
- El array YAML mantiene formato correcto (`["Cat1", "Cat2", "Cat3"]`)

**Verification:** Re-ejecución del script de audit devuelve 0 posts con categories > 3.

---

### U2. Corregir posts con tags > 8

**Goal:** Reducir a ≤8 los arrays de `tags` en los 6 posts afectados.

**Requirements:** Reglas editoriales de este plan; canonical list de tags en `docs/tags-categories-standard.md`.

**Dependencies:** U1 (misma rama, puede ejecutarse en paralelo).

**Files:**
- `src/content/blog/ahorros-vs-prestamos.md` (12 tags)
- `src/content/blog/como-evitar-efecto-diderot-controlar-finanzas.md` (12 tags)
- `src/content/blog/finanzas-personales-no-son-para-imbeciles-y-perezosos.md` (10 tags)
- `src/content/blog/hipoteca-laberinto-guia-vivienda-propia.md` (11 tags)
- `src/content/blog/incrementar-inversiones-nueve-meses-estrategias-resultados.md` (9 tags)
- `src/content/blog/manejar-finanzas-familiares.md` (21 tags — caso extremo)
- `src/content/blog/nuevos-impuestos-2025-impacto-bolsillo.md` (9 tags)

**Approach:**
- Para cada post: leer los tags, identificar los 8 más representativos del contenido, eliminar el resto
- `manejar-finanzas-familiares.md` tiene 21 tags — revisión especial necesaria para quedarse con los 8 más relevantes
- Eliminar primero: tags genéricos (`Blog Personal`, `Dinero`), tags en inglés con equivalente canónico en español, duplicados semánticos

**Test scenarios:**
- Ningún post en la lista tiene más de 8 tags tras la edición
- Los tags restantes existen en la canonical list
- El array YAML mantiene el formato correcto

**Verification:** Re-ejecución del script de audit devuelve 0 posts con tags > 8.

---

### U3. Build y PR

**Goal:** Confirmar que el build pasa con las correcciones aplicadas y abrir un PR.

**Requirements:** `npm run build` sin errores.

**Dependencies:** U1, U2.

**Files:** Ninguno adicional.

**Approach:**
- `npm run build` desde la raíz
- Si el build detecta errores de schema Zod (frontmatter inválido), corregir antes de continuar
- PR body: tabla con cada post, arrays originales → arrays corregidos

**Test scenarios:**
- Build produce ≥940 páginas sin errores
- Zod no reporta errores de validación de frontmatter
- Re-ejecución del script de audit: 0 violations de categories > 3, 0 violations de tags > 8

**Verification:** PR abierto con CI verde; `docs/tags-categories-standard.md` no necesita cambios (solo se eliminan valores, no se añaden nuevos).
