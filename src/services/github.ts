export async function getRepoStars(
	owner: string,
	repo: string,
): Promise<number | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
		if (!res.ok) return null;
		const data = await res.json();
		return typeof data?.stargazers_count === "number"
			? data.stargazers_count
			: null;
	} catch {
		return null;
	}
}
