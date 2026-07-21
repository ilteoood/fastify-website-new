export const SITE = {
  name: 'Fastify',
  tagline: 'Fast and low overhead web framework, for Node.js',
  description:
    'Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.',
  url: 'https://fastify.dev',
  repo: 'https://github.com/fastify/fastify',
  version: 'v5.x',
  stars: '36.7k',
  downloads: '10M+',
  reqPerSec: 30000,
  plugins: 297,
};

export const NAV = [
  { label: 'Docs', href: '/docs/' },
  { label: 'Ecosystem', href: '/ecosystem/' },
  { label: 'Benchmarks', href: '/benchmarks/' },
  { label: 'Organizations', href: '/organizations/' },
  { label: 'Blog', href: '/blog/' },
];

export type Feature = {
  title: string;
  metric: string;
  body: string;
  icon: string;
};

export const FEATURES: Feature[] = [
  {
    title: 'Highly performant',
    metric: '30k req/s',
    body: 'One of the fastest web frameworks in town. Depending on code complexity, Fastify can serve up to 30 thousand requests per second.',
    icon: 'bolt',
  },
  {
    title: 'Extensible',
    metric: 'hooks · plugins',
    body: 'Fully extensible via its hooks, plugins, and decorators. Encapsulation keeps your components isolated and reusable.',
    icon: 'plug',
  },
  {
    title: 'Schema based',
    metric: 'JSON Schema',
    body: 'Use JSON Schema to validate routes and serialize outputs. Internally Fastify compiles the schema into a highly performant function.',
    icon: 'schema',
  },
  {
    title: 'Logging',
    metric: 'Pino built-in',
    body: 'Logs are important but costly. We chose the fastest logger, Pino, to almost entirely remove that cost.',
    icon: 'log',
  },
  {
    title: 'Developer friendly',
    metric: 'DX first',
    body: 'Expressive by design, built to help developers in daily use without sacrificing performance or security.',
    icon: 'heart',
  },
  {
    title: 'TypeScript ready',
    metric: 'types included',
    body: 'We work hard to maintain a TypeScript type declaration file to support the growing TypeScript community.',
    icon: 'ts',
  },
];

export type Bench = { name: string; reqs: number; self?: boolean };

// Indicative requests/sec — illustrative comparison (higher is better).
export const BENCHMARKS: Bench[] = [
  { name: 'Fastify', reqs: 30271, self: true },
  { name: 'Koa', reqs: 20800 },
  { name: 'Restify', reqs: 18600 },
  { name: 'Hapi', reqs: 15100 },
  { name: 'Express', reqs: 9200 },
];

export type Sponsor = { name: string; url: string; tier: 'org' | 'sponsor' };

export const SPONSORS: Sponsor[] = [
  { name: 'Mercedes-Benz', url: 'https://github.com/mercedes-benz', tier: 'org' },
  { name: 'Microsoft', url: 'https://opensource.microsoft.com/', tier: 'org' },
  { name: 'Platformatic', url: 'https://platformatic.dev/', tier: 'sponsor' },
  { name: 'NearForm', url: 'https://nearform.com/', tier: 'sponsor' },
  { name: 'SerpApi', url: 'https://serpapi.com/', tier: 'org' },
  { name: 'Handsontable', url: 'https://handsontable.com/', tier: 'org' },
  { name: 'Val Town', url: 'https://www.val.town/', tier: 'org' },
  { name: 'N-iX', url: 'https://www.n-ix.com/', tier: 'org' },
  { name: 'kogiQA', url: 'https://kogiqa.com/', tier: 'org' },
];

export type Person = { name: string; github: string; role?: string };

export const LEADS: Person[] = [
  { name: 'Matteo Collina', github: 'mcollina' },
  { name: 'Tomas Della Vedova', github: 'delvedor' },
  { name: 'KaKa Ng', github: 'climba03003' },
  { name: 'Manuel Spigolon', github: 'eomm' },
  { name: 'James Sumners', github: 'jsumners' },
];

export const COLLABORATORS: Person[] = [
  { name: 'Aras Abbasi', github: 'uzlopak' },
  { name: 'Dan Castillo', github: 'dancastillo' },
  { name: 'Gürgün Dayıoğlu', github: 'gurgunday' },
  { name: 'Carlos Fuentes', github: 'metcoder95' },
  { name: 'Luciano Mammino', github: 'lmammino' },
  { name: 'Jean Michelet', github: 'jean-michelet' },
  { name: 'Luis Orbaiceta', github: 'luisorbaiceta' },
  { name: 'Igor Savin', github: 'kibertoad' },
  { name: 'Frazer Smith', github: 'Fdawgs' },
  { name: 'Maksim Sinik', github: 'fox1t' },
];

export type Plugin = {
  name: string;
  description: string;
  category: string;
  official?: boolean;
  url: string;
};

export const PLUGIN_CATEGORIES = [
  'All',
  'Core',
  'Auth',
  'Database',
  'Validation',
  'Utilities',
  'View',
] as const;

export const PLUGINS: Plugin[] = [
  { name: '@fastify/cors', description: 'Enable CORS in a Fastify application.', category: 'Core', official: true, url: 'https://github.com/fastify/fastify-cors' },
  { name: '@fastify/helmet', description: 'Important security headers for Fastify.', category: 'Core', official: true, url: 'https://github.com/fastify/fastify-helmet' },
  { name: '@fastify/jwt', description: 'JWT utils for Fastify, internally uses fast-jwt.', category: 'Auth', official: true, url: 'https://github.com/fastify/fastify-jwt' },
  { name: '@fastify/auth', description: 'Run multiple auth functions in Fastify.', category: 'Auth', official: true, url: 'https://github.com/fastify/fastify-auth' },
  { name: '@fastify/oauth2', description: 'Wrap around simple-oauth2 for OAuth flows.', category: 'Auth', official: true, url: 'https://github.com/fastify/fastify-oauth2' },
  { name: '@fastify/postgres', description: 'Fastify PostgreSQL connection plugin using pg.', category: 'Database', official: true, url: 'https://github.com/fastify/fastify-postgres' },
  { name: '@fastify/mongodb', description: 'Fastify MongoDB connection plugin, shares pool across routes.', category: 'Database', official: true, url: 'https://github.com/fastify/fastify-mongodb' },
  { name: '@fastify/mysql', description: 'Fastify MySQL connection plugin.', category: 'Database', official: true, url: 'https://github.com/fastify/fastify-mysql' },
  { name: '@fastify/redis', description: 'Shared Redis connection across your Fastify server.', category: 'Database', official: true, url: 'https://github.com/fastify/fastify-redis' },
  { name: '@fastify/swagger', description: 'Serve Swagger/OpenAPI definitions from your routes.', category: 'Utilities', official: true, url: 'https://github.com/fastify/fastify-swagger' },
  { name: '@fastify/rate-limit', description: 'A low overhead rate limiter for your routes.', category: 'Core', official: true, url: 'https://github.com/fastify/fastify-rate-limit' },
  { name: '@fastify/static', description: 'Plugin for serving static files as fast as possible.', category: 'Utilities', official: true, url: 'https://github.com/fastify/fastify-static' },
  { name: '@fastify/multipart', description: 'Parse multipart/form-data content type.', category: 'Utilities', official: true, url: 'https://github.com/fastify/fastify-multipart' },
  { name: '@fastify/cookie', description: 'Parse and set cookie headers.', category: 'Core', official: true, url: 'https://github.com/fastify/fastify-cookie' },
  { name: '@fastify/websocket', description: 'WebSocket support for Fastify, built upon ws.', category: 'Utilities', official: true, url: 'https://github.com/fastify/fastify-websocket' },
  { name: '@fastify/view', description: 'Templating engine (ejs, pug, handlebars, and more).', category: 'View', official: true, url: 'https://github.com/fastify/point-of-view' },
  { name: '@fastify/env', description: 'Load and validate environment variables at startup.', category: 'Validation', official: true, url: 'https://github.com/fastify/fastify-env' },
  { name: 'fastify-type-provider-zod', description: 'Zod type provider for end-to-end type safety.', category: 'Validation', url: 'https://github.com/turkerdev/fastify-type-provider-zod' },
];
