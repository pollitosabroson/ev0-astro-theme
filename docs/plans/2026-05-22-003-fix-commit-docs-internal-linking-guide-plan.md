---
title: "fix: commit docs/internal-linking-guide.md to main"
date: 2026-05-22
status: active
depth: lightweight
---

# fix: Commitear docs/internal-linking-guide.md a main

## Summary

El archivo `docs/internal-linking-guide.md` existe en la copia local del repositorio pero nunca fue añadido al staging ni commiteado. Sin este archivo en el repo remoto, el historial de enlaces aplicados y la tabla de 31 artículos HUB se pierden entre sesiones. El archivo `docs/tags-categories-standard.md` sí fue commiteado; este plan cierra esa brecha para el segundo documento.

---

## Scope Boundaries

### In scope
- Añadir `docs/internal-linking-guide.md` al repo (git add + commit + push a `main`)
- Verificar que la guía contenga la versión actualizada con el historial de enlaces de la sesión actual

### Deferred to Follow-Up Work
- Actualizar el historial de la guía con los 27 nuevos enlaces añadidos en PR #107 (se puede hacer en la misma sesión que ejecute este plan, después del merge)

### Out of scope
- Cambiar el contenido de la guía
- Añadir `docs/solutions/` ni otros archivos untracked (`.agents/`, `Dockerfile`, etc.)

---

## Implementation Units

### U1. Commit docs/internal-linking-guide.md

**Goal:** Persistir el archivo de guía de enlazado en el repo remoto.

**Requirements:** El archivo local está en `docs/internal-linking-guide.md` y contiene la tabla de 31 HUB articles más el historial de enlaces aplicados.

**Dependencies:** PR #107 mergeado (U1 del plan 002) para que `main` esté actualizado.

**Files:**
- `docs/internal-linking-guide.md` (untracked → tracked)

**Approach:**
- Confirmar que la rama activa es `main` (`git checkout main && git pull`)
- `git add docs/internal-linking-guide.md`
- Commit con mensaje descriptivo
- Push a `origin/main`

**Test scenarios:**
- `git log --oneline -1` muestra el nuevo commit en main
- `git show HEAD --name-only` lista solo `docs/internal-linking-guide.md`
- El archivo es accesible en GitHub en `docs/internal-linking-guide.md`

**Verification:** `git status` no muestra `docs/internal-linking-guide.md` como untracked; el archivo aparece en el historial de commits de `main`.

---

### U2. Actualizar historial de enlaces (opcional, misma sesión)

**Goal:** Añadir al historial del archivo los 27 enlaces aplicados en PR #107 para que el registro esté completo.

**Requirements:** PR #107 mergeado; lista de los 27 enlaces aplicados en esa rama.

**Dependencies:** U1.

**Files:**
- `docs/internal-linking-guide.md` (sección "Historial de enlaces aplicados")

**Approach:**
- Abrir `docs/internal-linking-guide.md`
- Localizar la sección `## Historial de enlaces aplicados`
- Añadir una fila por cada enlace aplicado en PR #107 (12 posts × ~2.5 links promedio = 27 entradas)
- Actualizar la fecha y el contador ("66 enlaces aplicados" → "93 enlaces aplicados")
- Commit + push

**Test scenarios:**
- El contador en el header del historial refleja el total correcto
- Las filas nuevas siguen el formato `| archivo.md | texto ancla | slug-destino |`

**Verification:** La sección historial en `main` refleja todos los enlaces de la sesión actual.
