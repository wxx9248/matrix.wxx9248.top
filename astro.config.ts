import { defineConfig } from "astro/config";

export default defineConfig({
  compressHTML: true,
  site: "https://matrix.wxx9248.top",
  trailingSlash: "always",
  vite: {
    css: {
      lightningcss: { drafts: { customMedia: true } },
      transformer: "lightningcss"
    }
  }
});
