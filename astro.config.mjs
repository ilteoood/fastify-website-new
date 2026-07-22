// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import astroInference from "astro-inference";

// https://astro.build/config
export default defineConfig({
	site: "https://fastify.dev",
	base: "/fastify-website-new",
	integrations: [
		mdx(),
		sitemap(),
		astroInference({
			exclude: ["resources/**", "benchmarks/**", "organizations/**"],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
