#!/usr/bin/env node
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);
const checkInstalled = process.argv.includes("--check-installed");

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  return result;
}

function assertOk(label, result) {
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(result.status || 1);
  }
  console.log(`OK ${label}`);
}

function assertFailIncludes(label, result, text) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !output.includes(text)) {
    console.error(`FAIL ${label}`);
    console.error(output.trim());
    process.exit(1);
  }
  console.log(`OK ${label}`);
}

function assertFileIncludes(label, path, text) {
  const content = readFileSync(path, "utf8");
  if (!content.includes(text)) {
    console.error(`FAIL ${label}`);
    console.error(`${path} does not include expected text`);
    process.exit(1);
  }
  console.log(`OK ${label}`);
}

function listFiles(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) listFiles(full, root, out);
    else out.push(relative(root, full));
  }
  return out;
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fileHashMap(root) {
  return new Map(listFiles(root).sort().map((file) => [file, hashFile(join(root, file))]));
}

const temp = mkdtempSync(join(tmpdir(), "ai-project-skill-maker-self-check-"));

try {
  assertOk("collect repo signals", run(["scripts/collect-repo-signals.mjs", "."]));
  assertOk("print schema", run(["scripts/render-project-skill.mjs", "--print-schema"]));
  const draftedConfig = run(["scripts/draft-project-config.mjs", "--repo", "."]);
  assertOk("draft repo config", draftedConfig);
  JSON.parse(draftedConfig.stdout);

  const rawTemplate = run(["scripts/validate-project-skill.mjs", "assets/templates/project-skill"]);
  assertFailIncludes("raw template validation fails clearly", rawTemplate, "Render it first");

  for (const mode of ["genesis", "repo"]) {
    const configPath = join(temp, `${mode}.json`);
    const config = run(["scripts/render-project-skill.mjs", "--init-config", mode]);
    assertOk(`init ${mode} config`, config);
    JSON.parse(config.stdout);
    writeFileSync(configPath, config.stdout);
    const outDir = join(temp, `${mode}-maintainer`);
    assertOk(`render ${mode} output`, run(["scripts/render-project-skill.mjs", "--input", configPath, "--output", outDir]));
    assertOk(`validate ${mode} output`, run(["scripts/validate-project-skill.mjs", outDir]));
  }

  const refreshConfigPath = join(temp, "refresh.json");
  const refreshConfig = run(["scripts/render-project-skill.mjs", "--init-config", "genesis"]);
  assertOk("init refresh config", refreshConfig);
  writeFileSync(refreshConfigPath, refreshConfig.stdout);
  const refreshOutDir = join(temp, "refresh-maintainer");
  const preservedRule = "- declared_intent: Preserve this self-check user rule.";
  const intentPath = join(refreshOutDir, "references", "project-intent.md");
  assertOk("render refresh output first pass", run(["scripts/render-project-skill.mjs", "--input", refreshConfigPath, "--output", refreshOutDir]));
  const intent = readFileSync(intentPath, "utf8");
  writeFileSync(
    intentPath,
    intent.replace(
      "<!-- BEGIN USER RULES -->\n<!-- Add durable project-specific rules here. This block is preserved on refresh. -->\n<!-- END USER RULES -->",
      `<!-- BEGIN USER RULES -->\n${preservedRule}\n<!-- END USER RULES -->`
    )
  );
  assertOk("render refresh output second pass", run(["scripts/render-project-skill.mjs", "--input", refreshConfigPath, "--output", refreshOutDir]));
  assertFileIncludes("refresh preserves user rules", intentPath, preservedRule);
  assertOk("validate refresh output", run(["scripts/validate-project-skill.mjs", refreshOutDir]));

  const skill = readFileSync(join(repoRoot, "SKILL.md"), "utf8");
  if (!skill.includes("## Mode Selection") || !skill.includes("## Core Workflow")) {
    console.error("FAIL SKILL.md workflow sections");
    process.exit(1);
  }
  console.log("OK SKILL.md workflow sections");

  const installed = process.env.HOME ? join(process.env.HOME, ".codex", "skills", "ai-project-skill-maker") : null;
  if (checkInstalled && installed && existsSync(installed)) {
    const repoFiles = fileHashMap(repoRoot);
    const installedFiles = fileHashMap(installed);
    const missing = [...repoFiles.keys()].filter((file) => !installedFiles.has(file));
    const extra = [...installedFiles.keys()].filter((file) => !repoFiles.has(file));
    const changed = [...repoFiles.keys()].filter((file) => installedFiles.has(file) && installedFiles.get(file) !== repoFiles.get(file));
    if (missing.length || extra.length || changed.length) {
      console.error("FAIL installed skill differs from repo");
      for (const [label, files] of [["missing", missing], ["extra", extra], ["changed", changed]]) {
        for (const file of files.slice(0, 8)) console.error(`- ${label}: ${file}`);
        if (files.length > 8) console.error(`- ${label}: ...and ${files.length - 8} more`);
      }
      process.exit(1);
    }
    console.log("OK installed skill content matches repo");
  } else if (checkInstalled) {
    console.log("SKIP installed skill check");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
