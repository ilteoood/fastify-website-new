# Fastify Website (redesign)

A redesigned home for [Fastify](https://fastify.dev/) — a fast and low overhead
web framework for Node.js. Built with **Astro**, **Tailwind CSS v4**, **MDX**
content collections, and **Pagefind** for static full-text search.

The design language is a dark-first "telemetry" aesthetic built around the one
thing Fastify is known for: **speed**. The signature element is a live
requests-per-second velocity gauge in the hero.

## Stack

- [Astro](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- MDX + Astro Content Collections for docs & blog
- [Pagefind](https://pagefind.app) — static, client-side search index
- Variable fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code)

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build to `dist/` and generate the Pagefind search index |
| `npm run preview` | Preview the production build locally |

> Search only works against a production build (`npm run build`), because the
> Pagefind index is generated from the built HTML. In `dev` the search modal
> shows a graceful fallback message.

## Project structure

```
src/
  components/     UI: Nav, Footer, Search, VelocityMeter, CodeTabs, BenchBars…
  content/
    docs/         Documentation pages (md/mdx) — grouped by `section`
    blog/         Blog posts (md/mdx)
  data/site.ts    Central data: nav, features, sponsors, team, benchmarks, plugins
  layouts/        BaseLayout (chrome, theme, fonts)
  pages/          Routes: /, /ecosystem, /benchmarks, /organizations, /blog, /docs
  styles/         global.css — design tokens + prose styling
```

## Feature parity with the current site

This redesign preserves every user-facing capability of the current
Docusaurus site:

- Marketing homepage (hero, why, core features, quick start, benchmarks,
  ecosystem, team, CTA) with copy-to-clipboard code samples.
- **Ecosystem** page with client-side search + category filtering.
- **Benchmarks** page with animated comparison bars.
- **Organizations & team** page (production users, sponsors, maintainers).
- **Docs** with a sectioned sidebar, prev/next navigation, breadcrumbs, and
  full-text search.
- **Blog** with a content collection.
- Dark/light theme toggle (no flash of unstyled theme), responsive nav with a
  mobile menu, keyboard-accessible focus states, reduced-motion support.

### Documentation pipeline

The documentation is **not** stored in this repository — it lives in the
[`fastify/fastify`](https://github.com/fastify/fastify) repo and is fetched at
build time by [`scripts/fetch-docs.mjs`](scripts/fetch-docs.mjs), which runs
automatically via the `prebuild`/`predev` npm hooks.

The script:

1. Lists all release tags with `git ls-remote` (no auth, no rate limit).
2. Picks the latest release of each major `>= DOCS_MIN_MAJOR` (default `3`).
3. Downloads each release tarball and extracts only its `docs/` folder.
4. Transforms every Markdown file — strips the repeated centered title,
   rewrites relative `.md` links and resource paths to site URLs, and injects
   `title` / `section` / `order` / `version` frontmatter.
5. Emits versioned content into `src/content/docs/<version>/…`, copies image
   resources into `public/docs/<version>/…`, duplicates the newest release as
   `latest`, and writes `src/data/versions.json`.

The result is browsable, versioned docs (`latest`, `v5.x`, `v4.x`, `v3.x`) with
a version switcher, exactly like the current website. Fetched content is
git-ignored so the source of truth stays in `fastify/fastify`.

```bash
npm run fetch:docs            # fetch/refresh docs (skips already-fetched versions)
FORCE_FETCH=1 npm run fetch:docs   # force a refresh
DOCS_MIN_MAJOR=4 npm run fetch:docs # only fetch v4.x and newer
```

