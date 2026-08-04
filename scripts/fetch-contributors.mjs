// @ts-check
/**
 * Build a rolling 30-day activity leaderboard for public fastify/* repositories.
 *
 * The implementation lives in `scripts/contributors/`; this file is the CLI
 * entry point wired into the `postinstall` script.
 */
import { log } from "./contributors/config.mjs";
import { runGenerator } from "./contributors/run.mjs";

runGenerator({
	token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
}).catch((error) => {
	log.error(error);
	process.exitCode = 1;
});
