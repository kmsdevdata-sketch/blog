import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";
import { readdirSync, readFileSync } from "node:fs";
import { join, parse } from "node:path";

// Last-modified date per post (modDatetime, else pubDatetime), keyed by
// "<lang>:<file name>", so the sitemap can tell crawlers when a post changed.
function readPostDates(dir = "src/content/posts"): Map<string, string> {
  const dates = new Map<string, string>();
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const text = readFileSync(join(entry.parentPath, entry.name), "utf8");
    const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const field = (key: string) =>
      front.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, "m"))?.[1]?.trim();
    const date = field("modDatetime") || field("pubDatetime");
    if (!date || Number.isNaN(Date.parse(date))) continue;
    const lang = field("lang") ?? "ko";
    dates.set(`${lang}:${parse(entry.name).name.toLowerCase()}`, new Date(date).toISOString());
  }
  return dates;
}

const postDates = readPostDates();

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        !page.endsWith("/search/") &&
        !page.endsWith("/404/") &&
        (config.features?.showArchives !== false ||
          !page.endsWith("/archives/")),
      serialize(item) {
        const { pathname } = new URL(item.url);
        const match = pathname.match(/^\/(en\/)?posts\/(?:.+\/)?([^/]+)\/$/);
        const lastmod = match && postDates.get(`${match[1] ? "en" : "ko"}:${match[2]}`);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  i18n: {
    locales: ["ko", "en"],
    defaultLocale: "ko",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
