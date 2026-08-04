import type { ProfileCardPerson } from "~/components/ProfileCard.astro";
import benchmarksData from "~/data/benchmarks.json" with { type: "json" };

export const SITE = {
	name: "Fastify",
	tagline: "Fast and low overhead web framework, for Node.js",
	description:
		"Fastify is a web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.",
	url: "https://fastify.dev",
	repo: "https://github.com/fastify/fastify",
	version: "v5.x",
	// Fallback shown on first paint; the live count is fetched client-side
	// (see the stats scripts in BaseLayout) and replaces these values.
	stars: "0",
	downloads: "0",
};

export const NAV = [
	{ label: "Docs", href: "/docs/latest" },
	{ label: "Ecosystem", href: "/ecosystem/" },
	{ label: "Benchmarks", href: "/benchmarks/" },
	{ label: "Organizations", href: "/organizations/" },
	{ label: "Community", href: "/community/" },
	{ label: "Support", href: "/docs/latest/Reference/LTS/" },
];

export type Bench = {
	name: string;
	reqs: number;
	latency: number;
	throughput: number;
	version: string;
	self?: boolean;
};

// Requests/sec from the official fastify/benchmarks suite, refreshed at build
// time by `scripts/download-benchmarks.mjs` (see `prebuild` / `predev`).
export const BENCHMARKS: Bench[] = benchmarksData.frameworks.map(
	({ name, requests, version, latency, throughput }) => ({
		name,
		reqs: requests,
		latency,
		throughput,
		version,
		self: name === "Fastify",
	}),
);

export const formatMetric = (n: number, decimals = 0) =>
	n.toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});

// Derived metrics shared by every benchmark surface (gauge, bars, summary
// tiles). Computed once at module load so callers stay in sync if the data
// ever changes.
export const BENCHMARK_STATS = {
	date: benchmarksData.date,
	self: BENCHMARKS.find((b) => b.self) ?? BENCHMARKS[0],
	max: Math.max(...BENCHMARKS.map((b) => b.reqs)),
	maxLatency: Math.max(...BENCHMARKS.map((b) => b.latency)),
	maxThroughput: Math.max(...BENCHMARKS.map((b) => b.throughput)),
	peers: BENCHMARKS.filter((b) => !b.self),
	express: BENCHMARKS.find((b) => b.name === "Express") ?? null,
	get multiplier(): string | null {
		return this.express
			? (this.self.reqs / this.express.reqs).toFixed(1)
			: null;
	},
	get latencyMultiplier(): string | null {
		return this.express && this.self.latency > 0
			? (this.express.latency / this.self.latency).toFixed(1)
			: null;
	},
	get throughputMultiplier(): string | null {
		return this.express && this.express.throughput > 0
			? (this.self.throughput / this.express.throughput).toFixed(1)
			: null;
	},
};

export type Feature = {
	title: string;
	metric: string;
	body: string;
	icon: string;
};

const fastifyReqPerSecK = Math.round(BENCHMARK_STATS.self.reqs / 1000);

export const FEATURES: Feature[] = [
	{
		title: "Highly performant",
		metric: `~${fastifyReqPerSecK}k req/s`,
		body: `One of the fastest web frameworks in town. Depending on code complexity, Fastify can serve around ${fastifyReqPerSecK} thousand requests per second.`,
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

// Financial supporters buy visibility: their logo is rendered larger the higher
// their tier. `collaborator` covers organizations run by Fastify collaborators.
export type SponsorTier = "collaborator" | "tier_3" | "tier_4";

export type Sponsor = {
	name: string;
	url: string;
	/** Logo filename served from `public/organizations/`. */
	image: string;
	tier: SponsorTier;
	/** Set when the logo is light-coloured and must be inverted on light tiles. */
	invert?: boolean;
};

export const SPONSORS: Sponsor[] = [
	{
		name: "HospitalRun",
		url: "https://hospitalrun.io/",
		image: "hospitalrun.svg",
		tier: "collaborator",
	},
	{
		name: "Nearform",
		url: "https://nearform.com",
		image: "nearform.svg",
		tier: "collaborator",
	},
	{
		name: "Platformatic",
		url: "https://platformatic.dev",
		image: "platformatic.svg",
		tier: "collaborator",
	},
	{
		name: "val town",
		url: "https://www.val.town/",
		image: "val-town.svg",
		tier: "tier_3",
	},
	{
		name: "Handsontable",
		url: "https://handsontable.com/docs/react-data-grid/?utm_source=Fastify_homepage&utm_medium=sponsorship&utm_campaign=library_sponsorship_2024",
		image: "handsontable.svg",
		tier: "tier_3",
	},
	{
		name: "SerpApi",
		url: "https://serpapi.com/?utm_source=fastify",
		image: "serpapi.svg",
		tier: "tier_4",
	},
	{
		name: "kogiQA",
		url: "https://kogiqa.com/",
		image: "kogiQALogo.svg",
		tier: "tier_3",
	},
	{
		name: "Lokalise",
		url: "https://lokalise.com/",
		image: "lokalise.svg",
		tier: "tier_3",
	},
	{
		name: "Photon",
		url: "https://photon.codes/",
		image: "photon.svg",
		tier: "tier_3",
		invert: true,
	},
	{
		name: "N-iX",
		url: "https://www.n-ix.com/",
		image: "n-ix.svg",
		tier: "tier_3",
	},
];

export const LEADS: ProfileCardPerson[] = [
	{
		name: "Matteo Collina",
		login: "mcollina",
		avatarUrl: "https://avatars.githubusercontent.com/mcollina?s=120",
		profileUrl: "https://github.com/mcollina",
	},
	{
		name: "Tomas Della Vedova",
		login: "delvedor",
		avatarUrl: "https://avatars.githubusercontent.com/delvedor?s=120",
		profileUrl: "https://github.com/delvedor",
	},
	{
		name: "KaKa Ng",
		login: "climba03003",
		avatarUrl: "https://avatars.githubusercontent.com/climba03003?s=120",
		profileUrl: "https://github.com/climba03003",
	},
	{
		name: "Manuel Spigolon",
		login: "eomm",
		avatarUrl: "https://avatars.githubusercontent.com/eomm?s=120",
		profileUrl: "https://github.com/eomm",
	},
	{
		name: "James Sumners",
		login: "jsumners",
		avatarUrl: "https://avatars.githubusercontent.com/jsumners?s=120",
		profileUrl: "https://github.com/jsumners",
	},
];

export const COLLABORATORS: ProfileCardPerson[] = [
	{
		name: "Carlos Fuentes",
		login: "metcoder95",
		avatarUrl: "https://avatars.githubusercontent.com/metcoder95?s=120",
		profileUrl: "https://github.com/metcoder95",
	},
	{
		name: "Evan Shortiss",
		login: "evanshortiss",
		avatarUrl: "https://avatars.githubusercontent.com/evanshortiss?s=120",
		profileUrl: "https://github.com/evanshortiss",
	},
	{
		name: "Luciano Mammino",
		login: "lmammino",
		avatarUrl: "https://avatars.githubusercontent.com/lmammino?s=120",
		profileUrl: "https://github.com/lmammino",
	},
	{
		name: "Maksim Sinik",
		login: "fox1t",
		avatarUrl: "https://avatars.githubusercontent.com/fox1t?s=120",
		profileUrl: "https://github.com/fox1t",
	},
	{
		name: "Frazer Smith",
		login: "Fdawgs",
		avatarUrl: "https://avatars.githubusercontent.com/Fdawgs?s=120",
		profileUrl: "https://github.com/Fdawgs",
	},
	{
		name: "Igor Savin",
		login: "kibertoad",
		avatarUrl: "https://avatars.githubusercontent.com/kibertoad?s=120",
		profileUrl: "https://github.com/kibertoad",
	},
	{
		name: "Vincent Le Goff",
		login: "zekth",
		avatarUrl: "https://avatars.githubusercontent.com/zekth?s=120",
		profileUrl: "https://github.com/zekth",
	},
	{
		name: "Aras Abbasi",
		login: "uzlopak",
		avatarUrl: "https://avatars.githubusercontent.com/uzlopak?s=120",
		profileUrl: "https://github.com/uzlopak",
	},
	{
		name: "Gürgün Dayıoğlu",
		login: "gurgunday",
		avatarUrl: "https://avatars.githubusercontent.com/gurgunday?s=120",
		profileUrl: "https://github.com/gurgunday",
	},
	{
		name: "Dan Castillo",
		login: "dancastillo",
		avatarUrl: "https://avatars.githubusercontent.com/dancastillo?s=120",
		profileUrl: "https://github.com/dancastillo",
	},
	{
		name: "Jean Michelet",
		login: "jean-michelet",
		avatarUrl: "https://avatars.githubusercontent.com/jean-michelet?s=120",
		profileUrl: "https://github.com/jean-michelet",
	},
	{
		name: "Harry Brundage",
		login: "airhorns",
		avatarUrl: "https://avatars.githubusercontent.com/airhorns?s=120",
		profileUrl: "https://github.com/airhorns",
	},
	{
		name: "Luis Orbaiceta",
		login: "luisorbaiceta",
		avatarUrl: "https://avatars.githubusercontent.com/luisorbaiceta?s=120",
		profileUrl: "https://github.com/luisorbaiceta",
	},
	{
		name: "Matteo Pietro Dazzi",
		login: "ilteoood",
		avatarUrl: "https://avatars.githubusercontent.com/ilteoood?s=120",
		profileUrl: "https://github.com/ilteoood",
	},
];

export const PAST_COLLABORATORS: ProfileCardPerson[] = [
	{
		name: "Ayoub El Khattabi",
		login: "AyoubElk",
		avatarUrl: "https://avatars.githubusercontent.com/AyoubElk?s=120",
		profileUrl: "https://github.com/AyoubElk",
	},
	{
		name: "Dustin Deus",
		login: "StarpTech",
		avatarUrl: "https://avatars.githubusercontent.com/StarpTech?s=120",
		profileUrl: "https://github.com/StarpTech",
	},
	{
		name: "Rafael Gonzaga",
		login: "RafaelGSS",
		avatarUrl: "https://avatars.githubusercontent.com/RafaelGSS?s=120",
		profileUrl: "https://github.com/RafaelGSS",
	},
	{
		name: "David Clements",
		login: "davidmarkclements",
		avatarUrl: "https://avatars.githubusercontent.com/davidmarkclements?s=120",
		profileUrl: "https://github.com/davidmarkclements",
	},
	{
		name: "Salman Mitha",
		login: "salmanm",
		avatarUrl: "https://avatars.githubusercontent.com/salmanm?s=120",
		profileUrl: "https://github.com/salmanm",
	},
	{
		name: "Tommaso Allevi",
		login: "allevo",
		avatarUrl: "https://avatars.githubusercontent.com/allevo?s=120",
		profileUrl: "https://github.com/allevo",
	},
	{
		name: "Ethan Arrowood",
		login: "Ethan-Arrowood",
		avatarUrl: "https://avatars.githubusercontent.com/Ethan-Arrowood?s=120",
		profileUrl: "https://github.com/Ethan-Arrowood",
	},
	{
		name: "Çağatay Çalı",
		login: "cagataycali",
		avatarUrl: "https://avatars.githubusercontent.com/cagataycali?s=120",
		profileUrl: "https://github.com/cagataycali",
	},
	{
		name: "Cemre Mengu",
		login: "cemremengu",
		avatarUrl: "https://avatars.githubusercontent.com/cemremengu?s=120",
		profileUrl: "https://github.com/cemremengu",
	},
	{
		name: "Nathan Woltman",
		login: "nwoltman",
		avatarUrl: "https://avatars.githubusercontent.com/nwoltman?s=120",
		profileUrl: "https://github.com/nwoltman",
	},
	{
		name: "Trivikram Kamat",
		login: "trivikr",
		avatarUrl: "https://avatars.githubusercontent.com/trivikr?s=120",
		profileUrl: "https://github.com/trivikr",
	},
];
