import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const distDir = join(root, "dist");
const host = "matrix.wxx9248.top";
const zone = "wxx9248.top";
const notFoundFile = "404.html";
const indexSuffix = "index.html";

type Route = { pattern: string; zone_name?: string };
type Config = {
  assets?: Record<string, unknown>;
  routes?: Route[];
  [key: string]: unknown;
};

// Drops // and /* */ comments, leaving string contents (such as URLs) alone.
const stripComments = (text: string): string => {
  let out = "";
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    const next = text.charAt(index + 1);
    if (inString) {
      out += char;
      if (char === "\\") {
        out += next;
        index += 1;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      out += char;
    } else if (char === "/" && next === "/") {
      while (index < text.length && text.charAt(index) !== "\n") {
        index += 1;
      }
      out += "\n";
    } else if (char === "/" && next === "*") {
      index = text.indexOf("*/", index + 2) + 1;
      if (index === 0) {
        throw new Error("Unterminated comment in wrangler.jsonc");
      }
    } else {
      out += char;
    }
  }
  return out;
};

const readConfig = (): Config =>
  JSON.parse(
    stripComments(readFileSync(join(root, "wrangler.jsonc"), "utf8"))
  ) as Config;

// The URL path Cloudflare serves a built file at.
const servedPath = (file: string): string => {
  if (file === indexSuffix) {
    return "/";
  }
  if (file.endsWith(`/${indexSuffix}`)) {
    return `/${file.slice(0, -indexSuffix.length)}`;
  }
  return `/${file}`;
};

/*
 * Mirrors Workers Routes: the host is dropped, a trailing * matches any
 * suffix, anything else matches the whole path (no query strings involved).
 */
const routeCovers = (pattern: string, path: string): boolean => {
  const withoutHost = pattern.slice(pattern.indexOf("/"));
  return withoutHost.endsWith("*")
    ? path.startsWith(withoutHost.slice(0, -1))
    : path === withoutHost;
};

const builtFiles = (): string[] => {
  if (!existsSync(distDir)) {
    throw new Error("dist/ is missing: run `pnpm build` first");
  }
  return readdirSync(distDir, { encoding: "utf8", recursive: true }).filter(
    (entry) => statSync(join(distDir, entry)).isFile()
  );
};

describe("routeCovers", () => {
  it("matches the root route only at the root", () => {
    expect(routeCovers(`${host}/`, "/")).toBe(true);
    expect(routeCovers(`${host}/`, "/en/")).toBe(false);
  });

  it("matches a trailing * as a prefix, including the bare prefix", () => {
    expect(routeCovers(`${host}/en*`, "/en")).toBe(true);
    expect(routeCovers(`${host}/en*`, "/en/")).toBe(true);
    expect(routeCovers(`${host}/en*`, "/ja/")).toBe(false);
  });
});

describe("servedPath", () => {
  it("maps built files to the URLs they are served at", () => {
    expect(servedPath("index.html")).toBe("/");
    expect(servedPath("en/index.html")).toBe("/en/");
    expect(servedPath("_astro/x.js")).toBe("/_astro/x.js");
    expect(servedPath("favicon.ico")).toBe("/favicon.ico");
  });
});

describe("wrangler.jsonc routes", () => {
  const config = readConfig();
  const routes = config.routes ?? [];
  const covered = (path: string): boolean =>
    routes.some(({ pattern }) => routeCovers(pattern, path));

  it("covers every file in dist/ except 404.html", () => {
    const unrouted = builtFiles()
      .filter((file) => file !== notFoundFile)
      .map(servedPath)
      .filter((path) => !covered(path));
    expect(unrouted).toEqual([]);
  });

  it("leaves Synapse's paths and the well-known files to nginx", () => {
    const paths = [
      "/_matrix/client/versions",
      "/_synapse/client/",
      "/.well-known/matrix/client",
      "/health"
    ];
    expect(paths.filter(covered)).toEqual([]);
  });

  it("attaches only matrix.wxx9248.top paths in the wxx9248.top zone", () => {
    expect(routes.length).toBeGreaterThan(0);
    for (const { pattern, zone_name: zoneName } of routes) {
      expect(pattern.startsWith(`${host}/`), pattern).toBe(true);
      expect(zoneName, pattern).toBe(zone);
    }
  });

  it("keeps static asset requests free: no Worker code, no cache", () => {
    expect(config).not.toHaveProperty("main");
    expect(config).not.toHaveProperty("cache");
    expect(config.assets).not.toHaveProperty("run_worker_first");
    expect(config.assets).not.toHaveProperty("cache");
  });

  it("serves 404.html for unknown paths under a page route", () => {
    expect(config.assets?.not_found_handling).toBe("404-page");
  });
});
