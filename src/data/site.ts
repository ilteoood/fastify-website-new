import benchmarksData from "./benchmarks.json" with { type: "json" };

export const SITE = {
  name: "Fastify",
  tagline: "Fast and low overhead web framework, for Node.js",
  description:
    "Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.",
  url: "https://fastify.dev",
  repo: "https://github.com/fastify/fastify",
  version: "v5.x",
  // Fallback shown on first paint; the live count is fetched client-side
  // (see the GitHub stars script in BaseLayout) and replaces this value.
  stars: "0",
  downloads: "10M+",
  reqPerSec: 30_000,
};

export const NAV = [
  { label: "Docs", href: "/docs/latest" },
  { label: "Ecosystem", href: "/ecosystem/" },
  { label: "Benchmarks", href: "/benchmarks/" },
  { label: "Organizations", href: "/organizations/" },
  { label: "Blog", href: "/blog/" },
];

export type Feature = {
  title: string;
  metric: string;
  body: string;
  icon: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Highly performant",
    metric: "30k req/s",
    body: "One of the fastest web frameworks in town. Depending on code complexity, Fastify can serve up to 30 thousand requests per second.",
    icon: "bolt",
  },
  {
    title: "Extensible",
    metric: "hooks · plugins",
    body: "Fully extensible via its hooks, plugins, and decorators. Encapsulation keeps your components isolated and reusable.",
    icon: "plug",
  },
  {
    title: "Schema based",
    metric: "JSON Schema",
    body: "Use JSON Schema to validate routes and serialize outputs. Internally Fastify compiles the schema into a highly performant function.",
    icon: "schema",
  },
  {
    title: "Logging",
    metric: "Pino built-in",
    body: "Logs are important but costly. We chose the fastest logger, Pino, to almost entirely remove that cost.",
    icon: "log",
  },
  {
    title: "Developer friendly",
    metric: "DX first",
    body: "Expressive by design, built to help developers in daily use without sacrificing performance or security.",
    icon: "heart",
  },
  {
    title: "TypeScript ready",
    metric: "types included",
    body: "We work hard to maintain a TypeScript type declaration file to support the growing TypeScript community.",
    icon: "ts",
  },
];

export type Bench = { name: string; reqs: number; self?: boolean };

// Requests/sec from the official fastify/benchmarks suite, refreshed at build
// time by `scripts/download-benchmarks.mjs` (see `prebuild` / `predev`).
export const BENCHMARKS: Bench[] = benchmarksData.frameworks.map(({ name, requests }) => ({
  name,
  reqs: requests,
  self: name === "Fastify",
}));

export type Sponsor = { name: string; url: string; tier: "org" | "sponsor" };

export const SPONSORS: Sponsor[] = [
  { name: "HospitalRun", url: "https://hospitalrun.io/", tier: "org" },
  { name: "Nearform", url: "https://nearform.com", tier: "org" },
  { name: "Platformatic", url: "https://platformatic.dev", tier: "org" },
  { name: "val town", url: "https://www.val.town/", tier: "sponsor" },
  {
    name: "Handsontable",
    url: "https://handsontable.com/docs/react-data-grid/?utm_source=Fastify_homepage&utm_medium=sponsorship&utm_campaign=library_sponsorship_2024",
    tier: "sponsor",
  },
  { name: "SerpApi", url: "https://serpapi.com/?utm_source=fastify", tier: "sponsor" },
  { name: "kogiQA", url: "https://kogiqa.com/", tier: "sponsor" },
  { name: "Lokalise", url: "https://lokalise.com/", tier: "sponsor" },
  { name: "Photon", url: "https://photon.codes/", tier: "sponsor" },
  { name: "N-iX", url: "https://www.n-ix.com/", tier: "sponsor" },
];

export type Person = { name: string; github: string; role?: string };

export const LEADS: Person[] = [
  { name: "Matteo Collina", github: "mcollina" },
  { name: "Tomas Della Vedova", github: "delvedor" },
  { name: "KaKa Ng", github: "climba03003" },
  { name: "Manuel Spigolon", github: "eomm" },
  { name: "James Sumners", github: "jsumners" },
];

export const COLLABORATORS: Person[] = [
  { name: "Carlos Fuentes", github: "metcoder95" },
  { name: "Evan Shortiss", github: "evanshortiss" },
  { name: "Luciano Mammino", github: "lmammino" },
  { name: "Maksim Sinik", github: "fox1t" },
  { name: "Frazer Smith", github: "Fdawgs" },
  { name: "Igor Savin", github: "kibertoad" },
  { name: "Vincent Le Goff", github: "zekth" },
  { name: "Aras Abbasi", github: "uzlopak" },
  { name: "Gürgün Dayıoğlu", github: "gurgunday" },
  { name: "Dan Castillo", github: "dancastillo" },
  { name: "Jean Michelet", github: "jean-michelet" },
  { name: "Harry Brundage", github: "airhorns" },
  { name: "Luis Orbaiceta", github: "luisorbaiceta" },
];

export const PAST_COLLABORATORS: Person[] = [
  { name: "Ayoub El Khattabi", github: "AyoubElk" },
  { name: "Dustin Deus", github: "StarpTech" },
  { name: "Rafael Gonzaga", github: "RafaelGSS" },
  { name: "David Clements", github: "davidmarkclements" },
  { name: "Salman Mitha", github: "salmanm" },
  { name: "Tommaso Allevi", github: "allevo" },
  { name: "Ethan Arrowood", github: "Ethan-Arrowood" },
  { name: "Çağatay Çalı", github: "cagataycali" },
  { name: "Cemre Mengu", github: "cemremengu" },
  { name: "Nathan Woltman", github: "nwoltman" },
  { name: "Trivikram Kamat", github: "trivikr" },
];
