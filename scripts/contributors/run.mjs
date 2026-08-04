// @ts-check
/**
 * Orchestrates the contributor snapshot refresh.
 *
 * Authenticated installs regenerate `src/data/contributors.json`. Installs
 * without a GitHub token keep a previously generated snapshot so local builds
 * stay frictionless.
 */
import path from "node:path";
import { buildContributorsData } from "./aggregate.mjs";
import { collectGitHubActivity } from "./collect.mjs";
import { log, ORGANIZATION, OUTPUT, ROOT } from "./config.mjs";
import { createPeriod } from "./dates.mjs";
import { createGitHubClient } from "./github.mjs";
import { readSnapshot, writeSnapshot } from "./snapshot.mjs";

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
