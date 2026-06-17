---
title: "Astro Build Pipeline Not Auto-Updating llms.txt and Sitemap on Netlify"
date: 2026-04-03
category: workflow-issues
module: astro-blog / netlify-build-pipeline
problem_type: workflow_issue
component: tooling
symptoms:
  - Live llms.txt missing recent blog posts despite correct local build output
  - Sitemap on production stale — posts from new PRs not appearing
  - llms.txt and llms-full.txt diverged (full had all posts, summary had only 20)
root_cause: incomplete_setup
resolution_type: workflow_improvement
severity: medium
related_components:
  - documentation
  - development_workflow
tags:
  - astro
  - netlify
  - llms-txt
  - build-automation
  - content-pipeline
  - seo
  - sitemap
  - astro-integration
---

# Astro Build Pipeline Not Auto-Updating llms.txt and Sitemap on Netlify

## Problem

An Astro 4 blog with custom `astro:build:done` integrations (generating `llms.txt`, `llms-full.txt`, and `sitemap.xml`) was producing stale files on the live Netlify deployment. Posts published weeks earlier were absent from the live artifacts despite being present in the local `dist/` output.

## Symptoms

- `curl https://example.com/llms.txt` showed fewer posts than the local `dist/llms.txt`
- `llms.txt` and `llms-full.txt` diverged: full file had all posts, summary had only 20
- Sitemap showed posts sorted alphabetically by filename, making newest posts hard to verify (they appeared mid-list, not at the top)
- Production was at the same git commit as local, ruling out a code sync issue

## What Didn't Work

No failed attempts — the root causes were identified through direct inspection of `netlify.toml` (absent) and the generator script (hardcoded `slice(0, 20)`).

## Solution

Two independent fixes were required:

### Fix 1 — Create `netlify.toml`

Without this file Netlify uses auto-detection, which is unreliable for projects where custom Astro integrations hook into `astro:build:done`. An explicit config guarantees the full pipeline runs.

Create `/netlify.toml` at the repo root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

### Fix 2 — Remove positional `slice()` cap in the generator

**Before** (`src/scripts/llms-generator.mjs`):

```js
${posts.slice(0, 20).map(post => `### ${post.title}
```

**After:**

```js
${posts.map(post => `### ${post.title}
```

The `slice(0, 20)` was a silent truncation that kept `llms.txt` stuck at 20 posts forever, while `llms-full.txt` (which had no such cap) continued growing. As the blog scaled past 20 posts the two files diverged with no error or warning.

### Fix 3 — Secondary sort by date in sitemap generator

All blog posts share `priority: 0.9`, so the primary sort left secondary order undefined (effectively alphabetical by glob result). Newest posts appeared mid-list rather than at the top.

**Before** (`src/scripts/sitemap-generator.mjs`):

```js
urlStructure.sort((a, b) => b.priority - a.priority);
```

**After:**

```js
urlStructure.sort((a, b) => {
  if (b.priority !== a.priority) return b.priority - a.priority;
  // Within the same priority, newest posts first
  return new Date(b.lastmod) - new Date(a.lastmod);
});
```

## Why This Works

**netlify.toml**: Netlify's auto-detection for npm projects defaults to `npm run build`, but execution environment details (working directory, hook timing, Node version) are not guaranteed for custom integrations. Providing explicit config removes that ambiguity.

**slice() removal**: The cap was added as a "show recent posts" shorthand but was never date-ordered — it was positional in whatever order `glob()` returned files (approximately alphabetical). Post 21+ would silently never appear. Removing the cap makes both files behave identically and scale without intervention.

**Date sort**: When multiple URLs share the same priority, a secondary sort by `lastmod` descending is the correct default for a blog. Crawlers and human reviewers expect the newest content first.

## Prevention

1. **Always create `netlify.toml`** for Astro projects with custom build integrations. Never rely on Netlify auto-detection when `astro:build:done` hooks generate critical files.

2. **Never use positional `slice()` in file generators.** If a length limit is intentional (e.g., "show only 20 most recent"), make it explicit and date-ordered:

   ```js
   // Intentional: show 20 most recent posts in summary file
   const recentPosts = posts
     .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
     .slice(0, 20);
   ```

   Or remove the limit entirely if the full set is needed.

3. **Verify deployed output matches local build** after any batch of new posts:

   ```bash
   # Check post count parity
   curl -s https://yourdomain/llms.txt | grep -c "^###"
   # Compare against local
   grep -c "^###" dist/llms.txt
   ```

4. **Sort by date in any sitemap generator** where entries share the same priority. Do not leave secondary sort order undefined.

5. **Add `netlify.toml` as a project checklist item** alongside `.env.example` and `README.md` when setting up a new static site deployment.

## Related Issues Fixed in the Same Session

### AI Citation Artifacts in Markdown Posts

Markdown posts generated with AI assistance contained `:contentReference[oaicite:X]{index=X}` patterns that rendered as broken literal text in the browser.

**Fix**: Grep for `oaicite` across all posts and remove matching lines. Where the artifact replaced a real value mid-sentence (e.g., an index name), reconstruct the sentence with the correct term.

```bash
grep -r "oaicite" src/content/blog/
```

**Prevention**: Add a post-generation lint step that fails if `oaicite` is found in any markdown file. Add rule to `CLAUDE.md`: never publish content containing `:contentReference[oaicite:X]{index=X}`.

---

### Inconsistent Categories and Tags Across Blog Posts

92 blog posts used inconsistent casing and spelling for the same concepts (`finanzas personales` vs `Finanzas Personales`, `MyInvertos` / `My Investor` / `MyInvestor`, `dividend` vs `Dividendos`, typo `fundos de pensiones`).

**Fix**: Grep audit per variant, batch-update frontmatter, create `docs/tags-categories-standard.md` as the canonical reference with 35 categories, full A–Z tag list, a "never use" table, and a pre-publish checklist.

**Prevention**: Validate frontmatter tags against the canonical list before merging new posts. See `docs/tags-categories-standard.md`.

---

### No Internal Linking Between Blog Posts

Zero cross-links existed among 92 articles, leaving high-value hub articles isolated.

**Fix**: Keyword analysis across all posts, 66 links applied across 43 files. Created `docs/internal-linking-guide.md` with 31 hub articles and their target slugs.

**Rules applied:**
- Maximum 3 new links per post per session
- First occurrence of keyword only
- Never inside TL;DR or FAQ sections

See `docs/internal-linking-guide.md` for the hub article list.

## Related Issues

- `docs/internal-linking-guide.md` — hub articles and linking rules
- `docs/tags-categories-standard.md` — canonical categories and tags
