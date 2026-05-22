---
title: "fix: validate and enforce post standards across all blog posts"
date: 2026-05-22
status: active
depth: standard
---

# fix: Validate and enforce post standards across all blog posts

## Summary

All 95 blog posts in `src/content/blog/` must comply with two published standards:
`docs/tags-categories-standard.md` (taxonomy rules) and `docs/internal-linking-guide.md`
(HUB article linking rules). There are also uncommitted changes from the current session
(category normalizations, sitemap expansion, RSS fix) that must ship in the same PR.

**Auto-fix scope:** tags/categories violations that have unambiguous canonical mappings.
**Report-only scope:** internal linking gaps — these require content judgment to fix.

---

## Scope Boundaries

### In scope
- Stage and commit the pending session changes (categories, sitemap, RSS, docs update)
- Run a final tags + categories audit and auto-fix any remaining violations
- Detect internal linking gaps against the 31 HUB articles in `docs/internal-linking-guide.md`
- Produce a structured linking-gap report in the PR body
- Pass `npm run build` before opening the PR

### Deferred to Follow-Up Work
- Manually adding missing internal links (content decision, not auto-fixable)
- Adding newly needed canonical tags/categories to `docs/tags-categories-standard.md`

### Out of scope
- Changing post content beyond frontmatter
- Validating `heroImage` paths or `authors` fields

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Validation language | Node.js `.cjs` scripts | Consistent with existing `scripts/` tooling |
| Categories/tags fix strategy | Reuse `_fix-tags.cjs` pattern, operate only on `categories:` / `tags:` lines | Safe, proven approach from prior session work |
| Linking gap detection | Keyword search in post body against HUB trigger terms | Simple, no AST required; false positives are acceptable in a report |
| Report format | Markdown table in PR body | Readable, no extra tooling required |
| Branch strategy | Stay on current branch (main) | User instruction |

---

## Implementation Units

### U1. Commit pending session changes

**Goal:** Land the category normalizations, sitemap expansion, RSS fix, and docs update that are staged but uncommitted.

**Requirements:** All pending working-tree changes from the current session.

**Dependencies:** None.

**Files:**
- `src/content/blog/` (43 modified posts — category fixes)
- `src/scripts/sitemap-generator.mjs`
- `src/pages/rss.xml.js`
- `docs/tags-categories-standard.md`

**Approach:** Stage all modified files, commit with a descriptive message, do not push yet.

**Test scenarios:**
- `git status` shows clean working tree after commit
- `git diff HEAD~1 --stat` confirms expected files are in the commit

**Verification:** `git log --oneline -1` shows the commit.

---

### U2. Final tags + categories audit and auto-fix

**Goal:** Detect and auto-fix any tags or categories in blog posts that still fall outside the canonical lists in `docs/tags-categories-standard.md`.

**Requirements:** Zero non-canonical values in `tags:` or `categories:` after this unit completes.

**Dependencies:** U1.

**Files:**
- `scripts/_validate-taxonomy.cjs` (new, ephemeral — deleted after run)
- `src/content/blog/*.md` (modified where violations found)

**Approach:**
- Parse canonical lists from `docs/tags-categories-standard.md` at runtime (both the tags section and categories section)
- For each post, check `categories:` and `tags:` arrays:
  - Value not in canonical → flag as violation
  - Casing mismatch with canonical → auto-fix
  - Duplicate within array → auto-fix (deduplicate)
  - More than 3 categories or more than 8 tags → flag in report (do not auto-remove, content decision)
- Write a structured report to stdout: violations fixed, violations requiring manual review

**Test scenarios:**
- Re-running the script after fix produces zero auto-fixable violations
- Array structure (commas, quotes) is preserved correctly after edits
- Posts with exactly 3 categories or 8 tags are not flagged
- Posts with 4+ categories or 9+ tags appear in the report

**Verification:** Script exits 0 with "0 violations remaining" message.

---

### U3. Internal linking gap detection

**Goal:** For each post, identify which HUB topics are mentioned in the body but not yet linked.

**Requirements:** Report must cover all 31 HUB entries from `docs/internal-linking-guide.md`.

**Dependencies:** U1.

**Files:**
- `scripts/_linking-audit.cjs` (new, ephemeral — deleted after run)
- Output: report written to stdout (captured into PR body)

**Approach:**
- Parse the 31 HUB entries from `docs/internal-linking-guide.md` (trigger terms + target slug)
- For each post:
  - Extract body (content after the closing `---` of frontmatter)
  - For each HUB entry, check if any trigger term appears in the body (case-insensitive)
  - Check if the target slug already appears as a link (`/blog/<slug>/`) in the body
  - If trigger found AND link absent → gap
- Output: markdown table `| Post | Missing HUB links |` grouped by post
- Also flag posts already in `docs/internal-linking-guide.md` historial (already linked) to avoid false positives

**Test scenarios:**
- A post that mentions "fondos indexados" but has no link to `triunfo-inversor-mediocre-inversion-indexada` appears in the gap report
- A post that already links to the HUB article does NOT appear as a gap for that entry
- Posts with zero gaps do not appear in the report
- The historial links in `docs/internal-linking-guide.md` are used to skip already-applied links

**Verification:** Report lists only genuine gaps; no false positives for already-linked posts.

---

### U4. Build verification and PR

**Goal:** Confirm the build passes and open a PR with the fix summary and linking-gap report.

**Requirements:** `npm run build` exits 0; PR body contains: what was auto-fixed + linking-gap table.

**Dependencies:** U2, U3.

**Files:** None (PR body only).

**Approach:**
- Run `npm run build`
- Push to `origin/main`
- Open PR with body containing:
  - Section 1: summary of auto-fixes applied (taxonomy violations fixed, duplicates removed)
  - Section 2: linking-gap table from U3 output

**Test scenarios:**
- Build completes with `[build] Complete!`
- PR body contains both sections
- No new 5xx pages in the build output

**Verification:** `gh pr view` shows open PR with correct body.

---

## Assumptions

- Non-canonical categories/tags with no obvious canonical mapping will be flagged in the report but not auto-fixed
- The historial in `docs/internal-linking-guide.md` is up to date through 2026-04-20; links added after that date may produce false positives in U3 (acceptable for a first report)
- `npm run build` takes ~20 seconds; no timeout issues expected
