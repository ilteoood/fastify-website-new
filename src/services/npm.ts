const DOWNLOADS_CACHE_KEY = "fastify-downloads";

export async function getMonthlyDownloads(
	packageName: string,
): Promise<number> {
	const cached = Number(sessionStorage.getItem(DOWNLOADS_CACHE_KEY));
	if (cached) return cached;

	const res = await fetch(
		`https://api.npmjs.org/downloads/point/last-month/${packageName}`,
	);
	if (!res.ok) throw new Error(`npm API returned ${res.status}`);
	const data = await res.json();
	if (typeof data?.downloads !== "number") {
		throw new Error("npm API response missing downloads");
	}
	try {
		sessionStorage.setItem(DOWNLOADS_CACHE_KEY, String(data.downloads));
	} catch {}
	return data.downloads;
}
