export const githubAvatarUrl = (githubOrUrl: string, size: number): string => {
	const isFullUrl = githubOrUrl.startsWith("http");
	const url = new URL(isFullUrl ? githubOrUrl : `https://avatars.githubusercontent.com/${githubOrUrl}`);
	url.searchParams.set("s", String(size));
	return url.href;
};
