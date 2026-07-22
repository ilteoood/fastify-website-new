// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import astroInference from "astro-inference";
import pagefind from "astro-pagefind";
import baseConfig from "./astro.base.config.mjs";

// https://astro.build/config
export default defineConfig({
	site: "https://fastify.dev",
	base: baseConfig.base,
	integrations: [
		mdx(),
		sitemap(),
		pagefind(),
		astroInference({
			exclude: ["resources/**", "benchmarks/**", "organizations/**"],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
