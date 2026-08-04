// @ts-check
/**
 * Build a rolling 30-day activity leaderboard for public fastify/* repositories.
 *
 * Authenticated installs refresh `src/data/contributors.json`. Installs without a
 * GitHub token keep a previously generated snapshot so local builds stay frictionless.
 */
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pino from "pino";

export const ORGANIZATION = "fastify";
export const WINDOW_DAYS = 30;
export const RESULT_LIMIT = 20;
export const WEIGHTS = Object.freeze({
	commits: 1,
	pullRequestsOpened: 3,
	pullRequestsMerged: 2,
	reviews: 2,
	issuesOpened: 1,
});

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "src/data/contributors.json");
const REST_API = "https://api.github.com";
const GRAPHQL_API = "https://api.github.com/graphql";
const SEARCH_PAGE_SIZE = 100;
const SEARCH_RESULT_CAP = 1_000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const MAX_RETRY_WAIT_MS = 60_000;

const log = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: {
		target: "pino-pretty",
		options: { colorize: true },
	},
});

const PULL_REQUEST_SEARCH = `
  query RecentPullRequests($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      issueCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          id
          number
          createdAt
          mergedAt
          updatedAt
          author { __typename login avatarUrl url }
          repository { nameWithOwner isPrivate }
          reviews(first: 100) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              submittedAt
              author { __typename login avatarUrl url }
            }
          }
        }
      }
    }
  }
`;

const ISSUE_SEARCH = `
  query RecentIssues($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      issueCount
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Issue {
          id
          createdAt
          author { __typename login avatarUrl url }
          repository { nameWithOwner isPrivate }
        }
      }
    }
  }
`;

const MORE_REVIEWS = `
  query MoreReviews($id: ID!, $cursor: String) {
    node(id: $id) {
      ... on PullRequest {
        reviews(first: 100, after: $cursor) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            submittedAt
            author { __typename login avatarUrl url }
          }
        }
      }
    }
  }
`;

/** @param {Date | string} value */
export function toDateKey(value) {
	return new Date(value).toISOString().slice(0, 10);
}

/** @param {Date} now */
export function createPeriod(now = new Date()) {
	const to = new Date(now);
	const from = new Date(to.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1_000);
	return { from: from.toISOString(), to: to.toISOString(), days: WINDOW_DAYS };
}

/** @param {string | null | undefined} value @param {{ from: string; to: string }} period */
export function isInPeriod(value, period) {
	if (!value) return false;
	const time = Date.parse(value);
	return (
		Number.isFinite(time) &&
		time >= Date.parse(period.from) &&
		time <= Date.parse(period.to)
	);
}

/**
 * @param {{ login?: string; type?: string; __typename?: string } | null | undefined} actor
 */
export function isHumanActor(actor) {
	if (!actor?.login) return false;
	if (
		actor.type === "Bot" ||
		actor.__typename === "Bot" ||
		actor.type === "Organization" ||
		actor.__typename === "Organization"
	) {
		return false;
	}
	return !actor.login.toLowerCase().endsWith("[bot]");
}

/** @param {string} fromDate @param {string} toDate */
export function splitDateRange(fromDate, toDate) {
	const start = Date.parse(`${fromDate}T00:00:00.000Z`);
	const end = Date.parse(`${toDate}T00:00:00.000Z`);
	if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
		return null;
	}
	const day = 24 * 60 * 60 * 1_000;
	const midpoint = start + Math.floor((end - start) / day / 2) * day;
	return [
		[fromDate, new Date(midpoint).toISOString().slice(0, 10)],
		[new Date(midpoint + day).toISOString().slice(0, 10), toDate],
	];
}

/**
 * @param {{
 *   token: string;
 *   fetchImpl?: typeof fetch;
 *   sleep?: (ms: number) => Promise<unknown>;
 *   timeoutMs?: number;
 *   maxRetries?: number;
 *   nowMs?: () => number;
 * }} options
 */
export function createGitHubClient({
	token,
	fetchImpl = fetch,
	sleep = delay,
	timeoutMs = REQUEST_TIMEOUT_MS,
	maxRetries = MAX_RETRIES,
	nowMs = Date.now,
}) {
	const baseHeaders = {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${token}`,
		"User-Agent": "fastify-website-contributors",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	/** @param {string} url @param {RequestInit} [init] */
	async function request(url, init = {}) {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const response = await fetchImpl(url, {
					...init,
					headers: { ...baseHeaders, ...init.headers },
					signal: AbortSignal.timeout(timeoutMs),
				});
				if (response.ok) return response.json();

				const body = await response.text();
				const retryable =
					response.status === 429 ||
					response.status >= 500 ||
					(response.status === 403 &&
						(response.headers.get("retry-after") !== null ||
							response.headers.get("x-ratelimit-remaining") === "0"));
				if (!retryable || attempt === maxRetries) {
					throw new Error(
						`GitHub API ${response.status} for ${url}: ${body.slice(0, 300)}`,
					);
				}

				const retryAfter = Number(response.headers.get("retry-after"));
				const reset = Number(response.headers.get("x-ratelimit-reset"));
				const waitMs =
					Number.isFinite(retryAfter) && retryAfter > 0
						? retryAfter * 1_000
						: Number.isFinite(reset) && reset > 0
							? Math.max(reset * 1_000 - nowMs(), 1_000)
							: attempt * 1_500;
				if (waitMs > MAX_RETRY_WAIT_MS) {
					throw new Error(
						`GitHub rate limit will not reset for ${Math.ceil(waitMs / 1_000)} seconds`,
					);
				}
				await sleep(waitMs);
			} catch (error) {
				if (
					attempt === maxRetries ||
					(error instanceof Error &&
						(error.message.startsWith("GitHub API") ||
							error.message.startsWith("GitHub rate limit")))
				) {
					throw error;
				}
				await sleep(attempt * 1_000);
			}
		}
		throw new Error(`GitHub request failed for ${url}`);
	}

	return {
		/** @param {string} pathname */
		rest(pathname) {
			return request(`${REST_API}${pathname}`);
		},
		/** @param {string} query @param {Record<string, unknown>} variables */
		async graphql(query, variables) {
			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				const data = await request(GRAPHQL_API, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ query, variables }),
				});
				if (Array.isArray(data?.errors) && data.errors.length > 0) {
					const messages = data.errors.map(
						(/** @type {any} */ item) => item?.message ?? "Unknown error",
					);
					const rateLimited = data.errors.some(
						(/** @type {any} */ item) =>
							item?.type === "RATE_LIMITED" ||
							/rate limit|secondary rate|abuse/i.test(item?.message ?? ""),
					);
					if (rateLimited && attempt < maxRetries) {
						await sleep(attempt * 1_500);
						continue;
					}
					throw new Error(`GitHub GraphQL error: ${messages.join("; ")}`);
				}
				if (!data?.data) {
					throw new Error("GitHub GraphQL response missing data");
				}
				return data.data;
			}
			throw new Error("GitHub GraphQL request exhausted its retries");
		},
	};
}

/**
 * @param {{ rest: (pathname: string) => Promise<any> }} client
 * @param {string} organization
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {Promise<any[]>}
 */
export async function fetchCommitRange(client, organization, fromDate, toDate) {
	const search = `org:${organization} author-date:${fromDate}..${toDate}`;
	const getPage = (/** @type {number} */ page) =>
		client.rest(
			`/search/commits?q=${encodeURIComponent(search)}&sort=author-date&order=asc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`,
		);
	const first = await getPage(1);
	if (
		!Number.isInteger(first.total_count) ||
		first.total_count < 0 ||
		typeof first.incomplete_results !== "boolean" ||
		!Array.isArray(first.items)
	) {
		throw new Error("GitHub commit search response is invalid");
	}
	if (first.incomplete_results) {
		throw new Error(
			`GitHub returned incomplete commit results for ${fromDate}..${toDate}`,
		);
	}
	if (first.total_count > SEARCH_RESULT_CAP) {
		const split = splitDateRange(fromDate, toDate);
		if (!split) {
			throw new Error(`Commit search exceeds 1,000 results on ${fromDate}`);
		}
		const [left, right] = await Promise.all(
			split.map(([from, to]) =>
				fetchCommitRange(client, organization, from, to),
			),
		);
		return [...left, ...right];
	}

	const items = [...(first.items ?? [])];
	const pages = Math.ceil(first.total_count / SEARCH_PAGE_SIZE);
	for (let page = 2; page <= pages; page++) {
		const result = await getPage(page);
		if (
			typeof result.incomplete_results !== "boolean" ||
			!Array.isArray(result.items)
		) {
			throw new Error(`GitHub commit search page ${page} is invalid`);
		}
		if (result.incomplete_results) {
			throw new Error(
				`GitHub returned incomplete commit results on page ${page}`,
			);
		}
		items.push(...(result.items ?? []));
	}
	if (items.length !== first.total_count) {
		throw new Error(
			`GitHub commit search returned ${items.length} of ${first.total_count} results`,
		);
	}
	return items;
}

/**
 * @param {{ graphql: (query: string, variables: Record<string, unknown>) => Promise<any> }} client
 * @param {{ organization: string; kind: "pr" | "issue"; qualifier: "updated" | "created"; fromDate: string; toDate: string; document: string }} options
 * @returns {Promise<any[]>}
 */
export async function fetchGraphqlSearchRange(client, options) {
	const { organization, kind, qualifier, fromDate, toDate, document } = options;
	const searchQuery = `org:${organization} is:${kind} ${qualifier}:${fromDate}..${toDate}`;
	const firstData = await client.graphql(document, {
		searchQuery,
		cursor: null,
	});
	const first = firstData.search;
	if (
		!first ||
		!Number.isInteger(first.issueCount) ||
		first.issueCount < 0 ||
		!Array.isArray(first.nodes) ||
		!first.pageInfo ||
		typeof first.pageInfo.hasNextPage !== "boolean"
	) {
		throw new Error("GitHub GraphQL search response is invalid");
	}
	if (first.issueCount > SEARCH_RESULT_CAP) {
		const split = splitDateRange(fromDate, toDate);
		if (!split) {
			throw new Error(`${kind} search exceeds 1,000 results on ${fromDate}`);
		}
		const [left, right] = await Promise.all(
			split.map(([from, to]) =>
				fetchGraphqlSearchRange(client, {
					...options,
					fromDate: from,
					toDate: to,
				}),
			),
		);
		return [...left, ...right];
	}

	const nodes = [...(first.nodes ?? [])].filter(Boolean);
	let pageInfo = first.pageInfo;
	while (pageInfo?.hasNextPage) {
		const data = await client.graphql(document, {
			searchQuery,
			cursor: pageInfo.endCursor,
		});
		if (
			!data.search?.pageInfo ||
			typeof data.search.pageInfo.hasNextPage !== "boolean" ||
			!Array.isArray(data.search.nodes)
		) {
			throw new Error("GitHub GraphQL search page is invalid");
		}
		nodes.push(...(data.search.nodes ?? []).filter(Boolean));
		pageInfo = data.search.pageInfo;
	}
	if (nodes.some((node) => typeof node.id !== "string" || !node.id)) {
		throw new Error("GitHub GraphQL search returned a result without an ID");
	}
	const uniqueNodes = [
		...new Map(nodes.map((node) => [node.id, node])).values(),
	];
	if (uniqueNodes.length < first.issueCount) {
		throw new Error(
			`GitHub GraphQL search returned ${uniqueNodes.length} of ${first.issueCount} results`,
		);
	}
	return uniqueNodes;
}

/**
 * @param {{ graphql: (query: string, variables: Record<string, unknown>) => Promise<any> }} client
 * @param {any} pullRequest
 */
export async function fetchAdditionalReviews(client, pullRequest) {
	if (
		!pullRequest.reviews ||
		!Number.isInteger(pullRequest.reviews.totalCount) ||
		!Array.isArray(pullRequest.reviews.nodes) ||
		!pullRequest.reviews.pageInfo
	) {
		throw new Error(`Reviews are invalid for pull request ${pullRequest.id}`);
	}
	const reviews = [...(pullRequest.reviews?.nodes ?? [])].filter(Boolean);
	let pageInfo = pullRequest.reviews?.pageInfo;
	while (pageInfo?.hasNextPage) {
		const data = await client.graphql(MORE_REVIEWS, {
			id: pullRequest.id,
			cursor: pageInfo.endCursor,
		});
		const page = data.node?.reviews;
		if (
			!page?.pageInfo ||
			typeof page.pageInfo.hasNextPage !== "boolean" ||
			!Array.isArray(page.nodes) ||
			page.totalCount !== pullRequest.reviews.totalCount
		) {
			throw new Error(
				`Review page is missing for pull request ${pullRequest.id}`,
			);
		}
		reviews.push(...(page.nodes ?? []).filter(Boolean));
		pageInfo = page.pageInfo;
	}
	if (reviews.length !== pullRequest.reviews.totalCount) {
		throw new Error(
			`GitHub returned ${reviews.length} of ${pullRequest.reviews.totalCount} reviews for pull request ${pullRequest.id}`,
		);
	}
	return { ...pullRequest, reviews: { nodes: reviews } };
}

/** @param {any[]} items @param {number} concurrency @param {(item: any) => Promise<any>} mapper */
async function mapWithConcurrency(items, concurrency, mapper) {
	const output = new Array(items.length);
	let nextIndex = 0;
	async function worker() {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			output[index] = await mapper(items[index]);
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
	);
	return output;
}

/**
 * @param {{ rest: (pathname: string) => Promise<any>; graphql: (query: string, variables: Record<string, unknown>) => Promise<any> }} client
 * @param {{ from: string; to: string }} period
 * @param {string} [organization]
 */
export async function collectGitHubActivity(
	client,
	period,
	organization = ORGANIZATION,
) {
	const fromDate = toDateKey(period.from);
	const toDate = toDateKey(period.to);
	const [commits, pullRequests, issues] = await Promise.all([
		fetchCommitRange(client, organization, fromDate, toDate),
		fetchGraphqlSearchRange(client, {
			organization,
			kind: "pr",
			qualifier: "updated",
			fromDate,
			toDate,
			document: PULL_REQUEST_SEARCH,
		}),
		fetchGraphqlSearchRange(client, {
			organization,
			kind: "issue",
			qualifier: "created",
			fromDate,
			toDate,
			document: ISSUE_SEARCH,
		}),
	]);

	const pullRequestsWithReviews = await mapWithConcurrency(
		pullRequests,
		5,
		(pullRequest) => fetchAdditionalReviews(client, pullRequest),
	);
	return { commits, pullRequests: pullRequestsWithReviews, issues };
}

/**
 * @param {{ commits?: any[]; pullRequests?: any[]; issues?: any[] }} activity
 * @param {{ from: string; to: string }} period
 * @param {number} [limit]
 */
export function aggregateContributors(activity, period, limit = RESULT_LIMIT) {
	/** @type {Map<string, any>} */
	const people = new Map();
	const seenCommits = new Set();
	const seenPullRequests = new Set();
	const seenIssues = new Set();
	const seenReviews = new Set();

	/** @param {any} actor */
	function getPerson(actor) {
		if (!isHumanActor(actor)) return null;
		const key = actor.login.toLowerCase();
		let person = people.get(key);
		if (!person) {
			person = {
				login: actor.login,
				avatarUrl:
					actor.avatarUrl ??
					actor.avatar_url ??
					`https://avatars.githubusercontent.com/${actor.login}`,
				profileUrl:
					actor.html_url ?? actor.url ?? `https://github.com/${actor.login}`,
				activity: {
					commits: 0,
					pullRequestsOpened: 0,
					pullRequestsMerged: 0,
					reviews: 0,
					issuesOpened: 0,
				},
			};
			people.set(key, person);
		}
		return person;
	}

	for (const commit of activity.commits ?? []) {
		if (commit.repository?.private === true) continue;
		const repository =
			commit.repository?.full_name ?? commit.repository?.nameWithOwner;
		const key = `${repository ?? "unknown"}:${commit.sha}`;
		if (
			seenCommits.has(key) ||
			!isInPeriod(commit.commit?.author?.date, period)
		) {
			continue;
		}
		seenCommits.add(key);
		const person = getPerson(commit.author);
		if (person) person.activity.commits++;
	}

	for (const pullRequest of activity.pullRequests ?? []) {
		if (pullRequest.repository?.isPrivate === true) continue;
		if (!seenPullRequests.has(pullRequest.id)) {
			seenPullRequests.add(pullRequest.id);
			const person = getPerson(pullRequest.author);
			if (person && isInPeriod(pullRequest.createdAt, period)) {
				person.activity.pullRequestsOpened++;
			}
			if (person && isInPeriod(pullRequest.mergedAt, period)) {
				person.activity.pullRequestsMerged++;
			}
		}
		for (const review of pullRequest.reviews?.nodes ?? []) {
			if (
				seenReviews.has(review.id) ||
				!isInPeriod(review.submittedAt, period)
			) {
				continue;
			}
			seenReviews.add(review.id);
			const person = getPerson(review.author);
			if (person) person.activity.reviews++;
		}
	}

	for (const issue of activity.issues ?? []) {
		if (issue.repository?.isPrivate === true) continue;
		if (seenIssues.has(issue.id) || !isInPeriod(issue.createdAt, period)) {
			continue;
		}
		seenIssues.add(issue.id);
		const person = getPerson(issue.author);
		if (person) person.activity.issuesOpened++;
	}

	return [...people.values()]
		.map((person) => ({
			...person,
			score: Object.entries(WEIGHTS).reduce(
				(total, [key, weight]) => total + person.activity[key] * weight,
				0,
			),
		}))
		.filter((person) => person.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				a.login.localeCompare(b.login, "en", { sensitivity: "base" }) ||
				a.login.localeCompare(b.login, "en"),
		)
		.slice(0, limit)
		.map((person, index) => ({ rank: index + 1, ...person }));
}

/**
 * @param {{ commits?: any[]; pullRequests?: any[]; issues?: any[] }} activity
 * @param {Date} [now]
 */
export function buildContributorsData(activity, now = new Date()) {
	const period = createPeriod(now);
	return {
		organization: ORGANIZATION,
		generatedAt: now.toISOString(),
		period,
		methodology: { weights: WEIGHTS },
		// Keep the complete ranking so the page can select 20 community contributors
		// without active maintainers consuming those positions.
		contributors: aggregateContributors(
			activity,
			period,
			Number.POSITIVE_INFINITY,
		),
	};
}

/** @param {unknown} data */
export function validateContributorsData(data) {
	if (!data || typeof data !== "object")
		throw new Error("Snapshot must be an object");
	const snapshot = /** @type {any} */ (data);
	if (snapshot.organization !== ORGANIZATION) {
		throw new Error(`Snapshot organization must be ${ORGANIZATION}`);
	}
	if (!Number.isFinite(Date.parse(snapshot.generatedAt))) {
		throw new Error("Snapshot generatedAt must be an ISO date");
	}
	if (
		snapshot.period?.days !== WINDOW_DAYS ||
		!Number.isFinite(Date.parse(snapshot.period?.from)) ||
		!Number.isFinite(Date.parse(snapshot.period?.to))
	) {
		throw new Error("Snapshot period is invalid");
	}
	if (
		Date.parse(snapshot.period.to) - Date.parse(snapshot.period.from) !==
		WINDOW_DAYS * 24 * 60 * 60 * 1_000
	) {
		throw new Error("Snapshot period must span exactly 30 days");
	}
	for (const [field, weight] of Object.entries(WEIGHTS)) {
		if (snapshot.methodology?.weights?.[field] !== weight) {
			throw new Error(`Snapshot methodology weight ${field} is invalid`);
		}
	}
	if (!Array.isArray(snapshot.contributors)) {
		throw new Error("Snapshot contributors must be an array");
	}
	const logins = new Set();
	for (const [index, contributor] of snapshot.contributors.entries()) {
		if (
			contributor.rank !== index + 1 ||
			typeof contributor.login !== "string" ||
			!contributor.login ||
			!URL.canParse(contributor.avatarUrl) ||
			!URL.canParse(contributor.profileUrl) ||
			!Number.isFinite(contributor.score) ||
			!contributor.activity
		) {
			throw new Error(`Snapshot contributor at rank ${index + 1} is invalid`);
		}
		const key = contributor.login.toLowerCase();
		if (logins.has(key))
			throw new Error(`Duplicate contributor ${contributor.login}`);
		logins.add(key);
		for (const field of Object.keys(WEIGHTS)) {
			if (
				!Number.isInteger(contributor.activity[field]) ||
				contributor.activity[field] < 0
			) {
				throw new Error(`Invalid ${field} count for ${contributor.login}`);
			}
		}
	}
	return snapshot;
}

/** @param {string} output */
export async function readSnapshot(output = OUTPUT) {
	const raw = await readFile(output, "utf8");
	return validateContributorsData(JSON.parse(raw));
}

/** @param {unknown} data @param {string} output */
export async function writeSnapshot(data, output = OUTPUT) {
	validateContributorsData(data);
	const temporary = `${output}.${process.pid}.tmp`;
	try {
		await writeFile(temporary, `${JSON.stringify(data, null, "\t")}\n`);
		await rename(temporary, output);
	} catch (error) {
		await unlink(temporary).catch(() => {});
		throw error;
	}
}

/**
 * @param {{
 *   token?: string;
 *   now?: Date;
 *   output?: string;
 *   client?: ReturnType<typeof createGitHubClient>;
 *   collect?: typeof collectGitHubActivity;
 *   read?: typeof readSnapshot;
 *   write?: typeof writeSnapshot;
 *   logger?: Pick<typeof log, "info" | "warn">;
 * }} [options]
 */
export async function runGenerator(options = {}) {
	const token = options.token ?? "";
	const output = options.output ?? OUTPUT;
	const logger = options.logger ?? log;
	const read = options.read ?? readSnapshot;
	const write = options.write ?? writeSnapshot;
	if (!token) {
		try {
			const snapshot = await read(output);
			logger.warn(
				"GH_TOKEN is not set; keeping the existing generated contributor snapshot",
			);
			return { refreshed: false, data: snapshot };
		} catch (error) {
			if (
				!error ||
				typeof error !== "object" ||
				!("code" in error) ||
				error.code !== "ENOENT"
			) {
				throw error;
			}
		}

		const data = buildContributorsData({}, options.now ?? new Date());
		await write(data, output);
		logger.warn(
			"GH_TOKEN is not set; created an empty contributor snapshot for local builds",
		);
		return { refreshed: false, data };
	}

	const now = options.now ?? new Date();
	const period = createPeriod(now);
	const client = options.client ?? createGitHubClient({ token });
	logger.info(
		`Collecting ${ORGANIZATION} activity from ${period.from} through ${period.to}`,
	);
	const collect = options.collect ?? collectGitHubActivity;
	const activity = await collect(client, period, ORGANIZATION);
	const data = buildContributorsData(activity, now);
	await write(data, output);
	logger.info(
		`Wrote ${data.contributors.length} contributors to ${path.relative(ROOT, output)}`,
	);
	return { refreshed: true, data };
}

const isMain =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	runGenerator({
		token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
	}).catch((error) => {
		log.error(error);
		process.exitCode = 1;
	});
}
