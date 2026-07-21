// @ts-nocheck
/**
 * Parse the Ecosystem guide from fastify/fastify (landed locally by
 * `scripts/fetch-docs.mjs` into `src/content/docs/latest/Guides/Ecosystem.md`)
 * and emit `src/data/plugins.json` for the ecosystem page.
 *
 * Mirrors the official fastify/website build-plugin-list.js:
 *   - Splits the file at `#### [Core](#core)` then at `#### [Community](#community)`.
 *   - Merges multi-line markdown list items into single entries.
 *   - Extracts [`name`](url) descriptions via the same regex as upstream.
 */
import { existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import pino from "pino";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "src/content/docs/latest/Guides/Ecosystem.md");
const OUTPUT = path.join(ROOT, "src/data/plugins.json");

const log = pino({
  level: process.env.LOG_LEVEL || "debug",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const PLUGIN_LINE = /\[`([-a-z\d./@]+)`\]\(([^)]+)\)(\s*(.+))?/i;
const DESCRIPTION_FALLBACK = "";

async function skipIfGenerated() {
  if (!existsSync(SOURCE) && existsSync(OUTPUT)) {
    try {
      if ((await stat(OUTPUT)).isFile()) return true;
    } catch {}
  }
  return false;
}

async function readSections(file) {
  const content = await readFile(file, "utf8");
  const [, pluginText] = content.split("#### [Core](#core)\n");
  if (!pluginText) throw new Error("Could not locate `#### [Core](#core)` heading");
  const [core, community] = pluginText.split("#### [Community](#community)");
  if (community === undefined)
    throw new Error("Could not locate `#### [Community](#community)` heading");
  return { core, community };
}

function mergeListItems(text) {
  const lines = text.split("\n").filter(Boolean);
  const merged = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- [`") || trimmed.startsWith("- [") || trimmed.startsWith("-`")) {
      merged.push(trimmed);
    } else if (merged.length > 0) {
      merged[merged.length - 1] += " " + trimmed;
    }
  }
  return merged;
}

function parseEntries(section) {
  return mergeListItems(section).map((line) => {
    const match = PLUGIN_LINE.exec(line);
    if (!match) {
      throw new Error(
        `Invalid plugin entry in Ecosystem.md: "${line}". Expected a markdown list item starting with "- [\`name\`](url)".`,
      );
    }
    const description = (match[4] || DESCRIPTION_FALLBACK).trim().replace(/ {2,}/g, " ");
    const capped = description ? description.charAt(0).toUpperCase() + description.slice(1) : "";
    return {
      name: match[1],
      url: match[2],
      description: capped,
    };
  });
}

function withOfficialFlag(entries) {
  return entries.map((entry) => ({ ...entry, official: true }));
}

async function main() {
  if (await skipIfGenerated()) {
    log.info(`Source missing and ${path.relative(ROOT, OUTPUT)} already exists — skipping.`);
    return;
  }
  if (!existsSync(SOURCE)) {
    throw new Error(
      `Source file not found: ${path.relative(ROOT, SOURCE)}. Run \`pnpm run fetch:docs\` first.`,
    );
  }

  const { core, community } = await readSections(SOURCE);
  // Core plugins come first so the "official" entries surface at the top of the rendered list.
  const plugins = [...withOfficialFlag(parseEntries(core)), ...parseEntries(community)];

  await writeFile(OUTPUT, JSON.stringify({ plugins }, null, 2) + "\n");
  log.info(`Wrote ${plugins.length} plugins to ${path.relative(ROOT, OUTPUT)}`);
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
