export async function getMonthlyDownloads(
	packageName: string,
): Promise<number | null> {
	try {
		const res = await fetch(
			`https://api.npmjs.org/downloads/point/last-month/${packageName}`,
		);
		if (!res.ok) return null;
		const data = await res.json();
		return typeof data?.downloads === "number" ? data.downloads : null;
	} catch {
		return null;
	}
}
