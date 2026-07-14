#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const repo = process.argv[2] || process.cwd();

function rel(path) {
  return relative(repo, path) || ".";
}

function safeJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function exists(path) {
  return existsSync(join(repo, path));
}

function walk(dir, maxDepth = 4, depth = 0, out = []) {
  if (depth > maxDepth || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", "dist", "build", ".astro", ".next", "coverage"].includes(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, maxDepth, depth + 1, out);
    else out.push(rel(full));
  }
  return out;
}

function git(args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

const files = walk(repo, 5).sort();
const pkg = exists("package.json") ? safeJson(join(repo, "package.json")) : null;
const lockfiles = ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock"].filter(exists);
const readmes = files.filter((f) => /^readme(\.|$)/i.test(f));
const docs = files.filter((f) => /^(docs|documentation)\//i.test(f) || /^src\/content\//i.test(f)).slice(0, 80);
const ci = files.filter((f) => /^\.github\/workflows\//.test(f) || /(^|\/)(circleci|gitlab-ci|buildkite|azure-pipelines)/i.test(f));
const configs = files.filter((f) =>
  /(^|\/)(astro|vite|next|nuxt|tsconfig|eslint|prettier|biome|vitest|jest|playwright|rollup|tsup|unbuild|changeset|release-it|semantic-release|typedoc|docusaurus|starlight)/i.test(f)
).slice(0, 120);
const sourceRoots = ["src", "app", "packages", "lib", "bin", "cli", "content", "public"].filter(exists);
const generatedHints = files.filter((f) =>
  /(^|\/)(dist|build|coverage|generated|__snapshots__|snapshots|schema|schemas|vendor|vendored)\//i.test(f) ||
  /\.(snap|lock|generated\.[cm]?[jt]s|d\.ts)$/.test(f)
).slice(0, 120);

const recentCommits = git(["log", "--oneline", "-n", "12"]).split("\n").filter(Boolean);

const signals = {
  repo,
  collectedAt: new Date().toISOString(),
  files: {
    readmes,
    docs,
    ci,
    configs,
    sourceRoots,
    lockfiles,
    generatedHints,
  },
  package: pkg
    ? {
        name: pkg.name,
        type: pkg.type,
        packageManager: pkg.packageManager,
        engines: pkg.engines,
        scripts: pkg.scripts || {},
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        exports: pkg.exports,
        bin: pkg.bin,
        license: pkg.license,
      }
    : null,
  frameworkHints: {
    astro: exists("astro.config.mjs") || exists("astro.config.ts") || Boolean(pkg?.dependencies?.astro || pkg?.devDependencies?.astro),
    typescript: files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx")) || exists("tsconfig.json"),
    node: Boolean(pkg),
    docsHeavy: docs.length >= 8 || readmes.length > 0,
  },
  recentCommits,
};

console.log(JSON.stringify(signals, null, 2));
