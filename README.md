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

### Docs generation (production)

On the live site the documentation is generated from the versioned Markdown in
the [`fastify/fastify`](https://github.com/fastify/fastify) repository. This
project ships a docs **shell** with representative sample content in
`src/content/docs/`. To wire up the real pipeline, replace the sample files with
a build step that fetches the versioned docs (as the current
[`fastify/website`](https://github.com/fastify/website) `build:website` script
does) and writes them into the `docs` collection before `astro build`.
```
