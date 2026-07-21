// @ts-nocheck
/**
 * Fetch the Fastify documentation from the fastify/fastify repository and
 * transform it into versioned Astro content-collection entries.
 *
 * The documentation content itself is NOT stored in this repository — it is
 * fetched fresh from https://github.com/fastify/fastify at build time.
 *
 * Pipeline (mirrors the official fastify/website build):
 *   1. List all release tags via `git ls-remote` (no auth, no rate limit).
 *   2. Pick the latest release of each major >= DOCS_MIN_MAJOR.
 *   3. Download the release tarball and extract only its `docs/` folder.
 *   4. Transform each markdown file (strip the centered title, rewrite
 *      relative `.md` links + resource paths, inject frontmatter).
 *   5. Emit `src/content/docs/<version>/…` and `public/docs/<version>/…`.
 *   6. Duplicate the newest version as `latest`.
 *   7. Write `src/data/versions.json`.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, rm, cp, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/docs');
const PUBLIC_DIR = path.join(ROOT, 'public/docs');
const DATA_FILE = path.join(ROOT, 'src/data/versions.json');
const CACHE = path.join(ROOT, '.cache/docs');

const REPO = 'fastify/fastify';
const MIN_MAJOR = Number(process.env.DOCS_MIN_MAJOR || '3');
const FORCE = process.env.FORCE_FETCH === '1';

const GUIDE_ORDER = [
  'Getting-Started', 'Recommendations', 'Database', 'Testing', 'Write-Plugin',
  'Plugins', 'Serverless', 'Migration-Guide-V5', 'Migration-Guide-V4',
  'Migration-Guide-V3', 'Benchmarking', 'Delay-Accept', 'Detecting-When-Clients-Abort',
  'Fluent-Schema', 'Prototype-Poisoning', 'Ecosystem', 'Contributing', 'Style-Guide',
];
const SECTION_ORDER = { Overview: 0, Guides: 1, Reference: 2 };

const log = (...a) => console.log('[docs]', ...a);

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
}

/** @returns {{ major:number, minor:number, patch:number, tag:string }[]} */
function listVersions() {
  const out = sh('git', ['ls-remote', '--tags', '--refs', `https://github.com/${REPO}.git`]);
  /** @type {Map<number, {major:number,minor:number,patch:number,tag:string}>} */
  const latestByMajor = new Map();
  for (const line of out.split('\n')) {
    const m = line.match(/refs\/tags\/v(\d+)\.(\d+)\.(\d+)$/);
    if (!m) continue;
    const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (major < MIN_MAJOR) continue;
    const v = { major, minor, patch, tag: `v${major}.${minor}.${patch}` };
    const cur = latestByMajor.get(major);
    if (!cur || minor > cur.minor || (minor === cur.minor && patch > cur.patch)) {
      latestByMajor.set(major, v);
    }
  }
  return [...latestByMajor.values()].sort((a, b) => b.major - a.major);
}

async function downloadAndExtract(tag) {
  await mkdir(CACHE, { recursive: true });
  const tarPath = path.join(CACHE, `${tag}.tar.gz`);
  const rawDir = path.join(CACHE, tag);
  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });

  log(`Downloading ${REPO}@${tag}…`);
  const res = await fetch(`https://codeload.github.com/${REPO}/tar.gz/refs/tags/${tag}`);
  if (!res.ok) throw new Error(`Download failed for ${tag}: ${res.status}`);
  await writeFile(tarPath, Buffer.from(await res.arrayBuffer()));

  // Determine the archive's top-level directory, then extract only docs/.
  const top = sh('tar', ['-tzf', tarPath]).split('\n')[0].split('/')[0];
  sh('tar', ['-xzf', tarPath, '-C', rawDir, '--strip-components=1', `${top}/docs`]);
  return path.join(rawDir, 'docs');
}

async function walk(dir, base = dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'resources') continue;
      files.push(...(await walk(full, base)));
    } else if (/\.mdx?$/i.test(entry.name)) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function titleFor(relPath, content) {
  const base = path.basename(relPath).replace(/\.mdx?$/i, '');
  const dir = path.dirname(relPath);
  if (base.toLowerCase() === 'index') {
    if (dir === '.' || dir === '') return 'Introduction';
    return path.basename(dir);
  }
  const heading = content.match(/^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/m);
  if (heading) return heading[1].replace(/`/g, '').trim();
  return base.replace(/[-_]/g, ' ');
}

function orderFor(relPath, section) {
  const base = path.basename(relPath).replace(/\.mdx?$/i, '');
  if (base.toLowerCase() === 'index') return 0;
  if (section === 'Guides') {
    const i = GUIDE_ORDER.indexOf(base);
    return i === -1 ? 500 : i + 1;
  }
  return 500;
}

/** Rewrite a relative link/asset target into a site URL. */
function rewriteTarget(target, relDir, version) {
  if (/^(https?:|mailto:|#|\/)/i.test(target)) return null; // absolute/external/anchor
  const [rawPath, anchor] = target.split('#');
  if (!rawPath) return null;
  let joined = path.posix.normalize(path.posix.join(relDir.replace(/\\/g, '/'), rawPath));
  joined = joined.replace(/^\.\//, '');

  if (/\.mdx?$/i.test(joined)) {
    joined = joined.replace(/\.mdx?$/i, '').replace(/\/(index|Index)$/,'').replace(/^(index|Index)$/,'');
    let url = `/docs/${version}/${joined}`.replace(/\/+$/,'');
    url += '/';
    return anchor ? `${url}#${anchor}` : url;
  }
  if (joined.includes('resources/')) {
    const rel = joined.slice(joined.indexOf('resources/'));
    return `/docs/${version}/${rel}`;
  }
  return null;
}

function transform(content, relPath, version) {
  const relDir = path.dirname(relPath);

  // 1. Strip the repeated centered "Fastify" title.
  content = content.replace(/^\uFEFF?/, '');
  content = content.replace(/<h1[^>]*>\s*Fastify\s*<\/h1>\s*/i, '');

  // 2. Rewrite markdown links and images: [text](target) / ![alt](target)
  content = content.replace(/(!?\[[^\]]*\]\()([^)\s]+)(\s+"[^"]*")?(\))/g, (full, pre, target, title, post) => {
    const rewritten = rewriteTarget(target, relDir, version);
    return rewritten ? `${pre}${rewritten}${title || ''}${post}` : full;
  });

  // 3. Rewrite HTML resource references: src="./resources/…"
  content = content.replace(/(\ssrc=")([^"]+)(")/gi, (full, pre, target, post) => {
    const rewritten = rewriteTarget(target, relDir, version);
    return rewritten ? `${pre}${rewritten}${post}` : full;
  });

  // 4. Inject frontmatter.
  const section = relDir === '.' || relDir === '' ? 'Overview' : relDir.split(path.sep)[0];
  const title = titleFor(relPath, content).replace(/"/g, '\\"');
  const order = orderFor(relPath, section);
  const fm = `---\ntitle: "${title}"\nsection: "${section}"\norder: ${order}\nversion: "${version}"\n---\n\n`;
  return fm + content.trimStart();
}

async function processVersion(docsRoot, version) {
  const outDir = path.join(CONTENT_DIR, version);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const files = await walk(docsRoot);
  for (const rel of files) {
    const raw = await readFile(path.join(docsRoot, rel), 'utf8');
    const out = transform(raw, rel, version);
    const dest = path.join(outDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, out);
  }

  const resources = path.join(docsRoot, 'resources');
  if (existsSync(resources)) {
    const pubDest = path.join(PUBLIC_DIR, version, 'resources');
    await rm(pubDest, { recursive: true, force: true });
    await mkdir(path.dirname(pubDest), { recursive: true });
    await cp(resources, pubDest, { recursive: true });
  }
  log(`Wrote ${files.length} pages for ${version}`);
}

async function isNonEmptyDir(dir) {
  try {
    return (await stat(dir)).isDirectory() && (await readdir(dir)).length > 0;
  } catch {
    return false;
  }
}

async function main() {
  let versions;
  try {
    versions = listVersions();
  } catch (err) {
    if (await isNonEmptyDir(CONTENT_DIR)) {
      log('Could not reach GitHub — using previously fetched docs.');
      return;
    }
    throw err;
  }
  if (versions.length === 0) throw new Error('No Fastify versions found');

  const newest = versions[0];
  const manifest = { latest: `v${newest.major}.x`, versions: /** @type {any[]} */ ([]) };
  manifest.versions.push({
    name: 'latest', label: `latest (${newest.tag})`, tag: newest.tag, isLatest: true,
  });
  for (const v of versions) {
    manifest.versions.push({ name: `v${v.major}.x`, label: v.tag, tag: v.tag });
  }

  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  for (const v of versions) {
    const version = `v${v.major}.x`;
    if (!FORCE && (await isNonEmptyDir(path.join(CONTENT_DIR, version)))) {
      log(`Skipping ${version} (already fetched; set FORCE_FETCH=1 to refresh)`);
      continue;
    }
    const docsRoot = await downloadAndExtract(v.tag);
    await processVersion(docsRoot, version);
    if (v === newest) {
      await processVersion(docsRoot, 'latest');
    }
  }

  // Ensure `latest` exists even if the newest major was skipped above.
  if (FORCE || !(await isNonEmptyDir(path.join(CONTENT_DIR, 'latest')))) {
    const docsRoot = path.join(CACHE, newest.tag, 'docs');
    if (existsSync(docsRoot)) await processVersion(docsRoot, 'latest');
  }

  await writeFile(DATA_FILE, JSON.stringify(manifest, null, 2) + '\n');
  log(`Done. Versions: ${manifest.versions.map((v) => v.name).join(', ')}`);
  // Free disk: keep tarballs out of the repo.
  if (!process.env.KEEP_CACHE) await rm(CACHE, { recursive: true, force: true }).catch(() => {});
}

main().catch((err) => {
  console.error('[docs] Failed:', err);
  process.exit(1);
});
