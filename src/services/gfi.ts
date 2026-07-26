export type GoodFirstIssue = {
	url: string;
	title: string;
	comments: number;
	state: string;
	project: { name: string; url: string };
	labels: string[];
};

export async function getGoodFirstIssues(
	org: string,
): Promise<GoodFirstIssue[] | null> {
	try {
		const res = await fetch(
			`https://goodfirstissue.fastify.io/api/find-issues?org=${org}`,
		);
		if (!res.ok) return null;
		const data = await res.json();
		return Array.isArray(data?.results) ? data.results : [];
	} catch {
		return null;
	}
}
