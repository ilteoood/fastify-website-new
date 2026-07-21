const RAW = import.meta.env.BASE_URL || "";
const BASE = RAW.endsWith("/") ? RAW.slice(0, -1) : RAW;

/**
 * Prefix a root-absolute path (starting with `/`) with the configured base
 * path so internal links work when the site is served from a subpath
 * (e.g. GitHub Pages project sites). External URLs and fragments pass through.
 */
export function withBase(path: string): string {
  if (typeof path !== "string" || !path.startsWith("/")) return path;
  return `${BASE}${path}`;
}
