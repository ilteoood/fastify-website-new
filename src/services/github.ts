const STARS_CACHE_KEY = "fastify-stars";

export async function getRepoStars(
	owner: string,
	repo: string,
): Promise<number> {
	const cached = Number(sessionStorage.getItem(STARS_CACHE_KEY));
	if (cached) return cached;

	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
	if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
	const data = await res.json();
	if (typeof data?.stargazers_count !== "number") {
		throw new Error("GitHub API response missing stargazers_count");
	}
	try {
		sessionStorage.setItem(STARS_CACHE_KEY, String(data.stargazers_count));
	} catch {}
	return data.stargazers_count;
}
