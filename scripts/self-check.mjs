#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);
const checkInstalled = process.argv.includes("--check-installed");
const skillPayload = ["SKILL.md", "agents", "references", "assets", "scripts"];

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  return result;
}

function runScriptFrom(cwd, args) {
  return spawnSync(process.execPath, [join(repoRoot, args[0]), ...args.slice(1)], {
    cwd,
    encoding: "utf8",
  });
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

function assertFileNotExists(label, path) {
  if (existsSync(path)) {
    console.error(`FAIL ${label}`);
    console.error(`${path} should not exist`);
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

function listPayloadFiles(root) {
  const files = [];
  for (const name of skillPayload) {
    const full = join(root, name);
    if (!existsSync(full)) continue;
    if (statSync(full).isDirectory()) listFiles(full, root, files);
    else files.push(name);
  }
  return files.sort();
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fileHashMap(root) {
  return new Map(listPayloadFiles(root).map((file) => [file, hashFile(join(root, file))]));
}

const temp = mkdtempSync(join(tmpdir(), "ai-project-skill-maker-self-check-"));

try {
  assertOk("collect repo signals", run(["scripts/collect-repo-signals.mjs", "."]));
  const signals = run(["scripts/collect-repo-signals.mjs", "."]);
  assertOk("collect enriched repo signals", signals);
  const parsedSignals = JSON.parse(signals.stdout);
  if (
    !parsedSignals.tooling?.scriptsByCategory ||
    !parsedSignals.files?.agentInstructionFiles ||
    !parsedSignals.files?.skillFiles?.includes("SKILL.md") ||
    !parsedSignals.files?.scriptFiles?.includes("scripts/self-check.mjs") ||
    !parsedSignals.files?.testFiles ||
    !parsedSignals.files?.typeScriptFiles ||
    !parsedSignals.files?.skippedDirs ||
    typeof parsedSignals.frameworkHints?.hasReadme !== "boolean" ||
    typeof parsedSignals.frameworkHints?.docsHeavy !== "boolean" ||
    parsedSignals.frameworkHints?.skillRepo !== true
  ) {
    console.error("FAIL enriched repo signals shape");
    process.exit(1);
  }
  console.log("OK enriched repo signals shape");
  assertOk("print schema", run(["scripts/render-project-skill.mjs", "--print-schema"]));
  assertOk("validate genesis config strict", run(["scripts/validate-config.mjs", "--input", "assets/examples/genesis-config.json", "--mode", "genesis", "--strict"]));
  assertOk("validate repo config strict", run(["scripts/validate-config.mjs", "--input", "assets/examples/repo-config.json", "--mode", "repo", "--strict"]));
  const invalidConfigPath = join(temp, "invalid-config.json");
  writeFileSync(invalidConfigPath, "{}");
  assertFailIncludes("invalid config fails clearly", run(["scripts/validate-config.mjs", "--input", invalidConfigPath, "--strict"]), "projectName is required");
  const nullConfigPath = join(temp, "null-config.json");
  writeFileSync(nullConfigPath, "null");
  assertFailIncludes("null config fails clearly", run(["scripts/validate-config.mjs", "--input", nullConfigPath, "--strict"]), "Config must be a JSON object");
  const weakCitationConfigPath = join(temp, "weak-citation-config.json");
  const weakCitationConfig = {
    mode: "repo",
    projectName: "Weak Citation",
    projectPurpose: "- observed_fact: `notapath` claims a fact.",
    audience: "- declared_intent: Confirm audience.",
    constraints: "- declared_intent: Confirm constraints.",
    maintenanceGoals: "- declared_intent: Confirm maintenance goals.",
    importantPaths: "- observed_fact: `README.md` is a source file.",
    entryPoints: "- observed_fact: `package.json` is a source file.",
    systemShape: "- observed_fact: `src/` is a source root.",
    stylePatterns: "- recommended_standard: Follow existing style.",
    verificationCommands: "- recommended_standard: Run available checks.",
    generatedOutput: "- recommended_standard: Avoid generated output.",
    editRestrictions: "- recommended_standard: Confirm before generated-file edits.",
    evidenceLedger: "- observed_fact: `notapath` is not a valid path citation.\n- declared_intent: Confirm maintainer intent.",
  };
  writeFileSync(weakCitationConfigPath, JSON.stringify(weakCitationConfig, null, 2));
  assertFailIncludes("weak observed citation fails clearly", run(["scripts/validate-config.mjs", "--input", weakCitationConfigPath, "--mode", "repo", "--strict"]), "should cite a source path");
  const bareRootCitationPath = join(temp, "bare-root-citation-config.json");
  const bareRootCitationConfig = {
    ...weakCitationConfig,
    projectPurpose: "- observed_fact: `build` is a script name, not a source path.",
    importantPaths: "- observed_fact: `README.md` is a source file.",
    evidenceLedger: "- observed_fact: `README.md` is valid evidence.\n- declared_intent: Confirm maintainer intent.",
  };
  writeFileSync(bareRootCitationPath, JSON.stringify(bareRootCitationConfig, null, 2));
  assertFailIncludes("bare repo root citation fails clearly", run(["scripts/validate-config.mjs", "--input", bareRootCitationPath, "--mode", "repo", "--strict"]), "should cite a source path");
  const noObservedRepoConfigPath = join(temp, "no-observed-repo-config.json");
  const noObservedRepoConfig = {
    mode: "repo",
    projectName: "No Observed Repo",
    projectPurpose: "- declared_intent: Maintain this repository.",
    audience: "- declared_intent: Confirm audience.",
    constraints: "- declared_intent: Confirm constraints.",
    maintenanceGoals: "- declared_intent: Confirm maintenance goals.",
    importantPaths: "- declared_intent: Confirm important paths.",
    entryPoints: "- declared_intent: Confirm entry points.",
    systemShape: "- declared_intent: Confirm architecture.",
    stylePatterns: "- recommended_standard: Follow existing style.",
    verificationCommands: "- declared_intent: Confirm verification.",
    generatedOutput: "- declared_intent: Confirm generated files.",
    editRestrictions: "- recommended_standard: Confirm before generated-file edits.",
    evidenceLedger: "- declared_intent: Repo config should not pass without observed facts.\n- recommended_standard: Repo mode requires source-backed facts.",
  };
  writeFileSync(noObservedRepoConfigPath, JSON.stringify(noObservedRepoConfig, null, 2));
  assertFailIncludes("render strict honors repo mode", run(["scripts/render-project-skill.mjs", "--input", noObservedRepoConfigPath, "--output", join(temp, "no-observed-repo"), "--strict"]), "Repo strict mode requires at least one observed_fact");
  const draftedConfig = run(["scripts/draft-project-config.mjs", "--repo", "."]);
  assertOk("draft repo config", draftedConfig);
  JSON.parse(draftedConfig.stdout);
  const adapterConfigPath = join(temp, "adapter-config.json");
  writeFileSync(adapterConfigPath, draftedConfig.stdout);
  assertOk("draft repo config validates strict", run(["scripts/validate-config.mjs", "--input", adapterConfigPath, "--mode", "repo", "--strict"]));
  for (const adapter of ["agents", "claude", "cursor", "copilot"]) {
    assertOk(`render ${adapter} adapter`, run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", adapter, "--output", join(temp, "adapters")]));
  }
  const longAdapterConfigPath = join(temp, "long-adapter-config.json");
  const longAdapterConfig = JSON.parse(readFileSync(adapterConfigPath, "utf8"));
  longAdapterConfig.importantPaths = Array.from({ length: 10 }, (_, index) => `- observed_fact: \`path-${index}.md\` is an important path.`).join("\n");
  longAdapterConfig.entryPoints = "- observed_fact: `entry-point.md` must survive adapter rendering.";
  writeFileSync(longAdapterConfigPath, JSON.stringify(longAdapterConfig, null, 2));
  assertOk("render long adapter without truncation", run(["scripts/render-adapter.mjs", "--input", longAdapterConfigPath, "--adapter", "agents", "--output", join(temp, "long-adapter")]));
  assertFileIncludes("adapter keeps merged entry points", join(temp, "long-adapter", "AGENTS.md"), "`entry-point.md` must survive adapter rendering.");
  const agentsPath = join(temp, "adapters", "AGENTS.md");
  const existingAgents = readFileSync(agentsPath, "utf8");
  const keepText = "USER KEEP: adapter refresh should preserve this section.";
  writeFileSync(agentsPath, `${existingAgents}\n${keepText}\n`);
  assertOk("refresh agents adapter preserves user text", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "agents", "--output", join(temp, "adapters")]));
  assertFileIncludes("agents adapter kept user text", agentsPath, keepText);
  const unsafeAdapterPath = join(temp, "unsafe", "AGENTS.md");
  mkdirSync(dirname(unsafeAdapterPath), { recursive: true });
  writeFileSync(unsafeAdapterPath, "Existing human instructions without maker markers.\n");
  assertFailIncludes("adapter refuses unsafe overwrite", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "agents", "--output", join(temp, "unsafe")]), "--force");
  assertOk("adapter force overwrite", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "agents", "--output", join(temp, "unsafe"), "--force"]));
  const cursorRulesDir = join(temp, "cursor-direct", ".cursor", "rules");
  assertOk("render cursor adapter to rules dir", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "cursor", "--output", cursorRulesDir]));
  assertFileIncludes("cursor adapter direct path exists", join(cursorRulesDir, "project.mdc"), "alwaysApply: true");
  assertFileNotExists("cursor adapter avoids nested rules dir", join(cursorRulesDir, ".cursor", "rules", "project.mdc"));
  const cursorPath = join(temp, "adapters", ".cursor", "rules", "project.mdc");
  const cursorFirst = readFileSync(cursorPath, "utf8");
  writeFileSync(cursorPath, `${cursorFirst}\n${keepText}\n`);
  assertOk("refresh cursor adapter preserves user text", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "cursor", "--output", join(temp, "adapters")]));
  const cursorSecond = readFileSync(cursorPath, "utf8");
  const cursorFrontmatterCount = (cursorSecond.match(/^---$/gm) || []).length;
  if (cursorFrontmatterCount !== 2) {
    console.error("FAIL cursor adapter refresh does not duplicate frontmatter");
    console.error(`Expected 2 frontmatter delimiters, got ${cursorFrontmatterCount}`);
    process.exit(1);
  }
  console.log("OK cursor adapter refresh does not duplicate frontmatter");
  assertFileIncludes("cursor adapter kept user text", cursorPath, keepText);
  const githubDir = join(temp, "github-direct", ".github");
  assertOk("render copilot adapter to .github dir", run(["scripts/render-adapter.mjs", "--input", adapterConfigPath, "--adapter", "copilot", "--output", githubDir]));
  assertFileIncludes("copilot adapter direct path exists", join(githubDir, "copilot-instructions.md"), "Copilot Instructions");
  assertFileNotExists("copilot adapter avoids nested .github dir", join(githubDir, ".github", "copilot-instructions.md"));

  const tsOnlyRepo = join(temp, "ts-only-repo");
  mkdirSync(join(tsOnlyRepo, "src"), { recursive: true });
  writeFileSync(join(tsOnlyRepo, "src", "index.ts"), "export const value: number = 1;\n");
  const tsOnlyConfig = run(["scripts/draft-project-config.mjs", "--repo", tsOnlyRepo]);
  assertOk("draft ts-only repo config", tsOnlyConfig);
  const tsOnlyConfigPath = join(temp, "ts-only-config.json");
  writeFileSync(tsOnlyConfigPath, tsOnlyConfig.stdout);
  assertFileIncludes("ts-only draft cites actual ts file", tsOnlyConfigPath, "`src/index.ts`");
  const tsOnlyText = readFileSync(tsOnlyConfigPath, "utf8");
  if (tsOnlyText.includes("`tsconfig.json`")) {
    console.error("FAIL ts-only draft does not cite missing tsconfig");
    process.exit(1);
  }
  console.log("OK ts-only draft does not cite missing tsconfig");
  assertOk("ts-only draft validates strict", run(["scripts/validate-config.mjs", "--input", tsOnlyConfigPath, "--mode", "repo", "--strict"]));

  const relativeRepo = join(temp, "relative-repo");
  mkdirSync(join(relativeRepo, "src"), { recursive: true });
  writeFileSync(join(relativeRepo, "package.json"), JSON.stringify({
    name: "relative-target",
    scripts: { build: "tsc" },
    devDependencies: { typescript: "^5.5.0" },
  }, null, 2));
  writeFileSync(join(relativeRepo, "src", "index.ts"), "export const value: number = 1;\n");
  const relativeDraft = runScriptFrom(relativeRepo, ["scripts/draft-project-config.mjs", "--repo", "."]);
  assertOk("draft relative repo path", relativeDraft);
  const relativeConfigPath = join(temp, "relative-config.json");
  writeFileSync(relativeConfigPath, relativeDraft.stdout);
  assertFileIncludes("relative draft uses target package", relativeConfigPath, "\"projectName\": \"relative-target\"");
  assertFileIncludes("relative draft cites package versions", relativeConfigPath, "`package.json` indicates framework/tool versions");
  assertOk("relative draft validates strict", run(["scripts/validate-config.mjs", "--input", relativeConfigPath, "--mode", "repo", "--strict"]));

  const rawTemplate = run(["scripts/validate-project-skill.mjs", "assets/templates/project-skill"]);
  assertFailIncludes("raw template validation fails clearly", rawTemplate, "Render it first");

  for (const mode of ["genesis", "repo"]) {
    const configPath = join(temp, `${mode}.json`);
    const config = run(["scripts/render-project-skill.mjs", "--init-config", mode]);
    assertOk(`init ${mode} config`, config);
    JSON.parse(config.stdout);
    writeFileSync(configPath, config.stdout);
    const outDir = join(temp, `${mode}-maintainer`);
    assertOk(`render ${mode} output`, run(["scripts/render-project-skill.mjs", "--input", configPath, "--output", outDir, "--strict"]));
    assertOk(`validate ${mode} output`, run(["scripts/validate-project-skill.mjs", outDir]));
  }

  const yamlConfigPath = join(temp, "yaml-project.json");
  const yamlConfig = JSON.parse(run(["scripts/render-project-skill.mjs", "--init-config", "genesis"]).stdout);
  yamlConfig.projectName = 'Quoted: "Project"';
  yamlConfig.shortDescription = 'Maintain "quoted" project';
  writeFileSync(yamlConfigPath, JSON.stringify(yamlConfig, null, 2));
  const yamlOutDir = join(temp, "yaml-maintainer");
  assertOk("render yaml-safe project output", run(["scripts/render-project-skill.mjs", "--input", yamlConfigPath, "--output", yamlOutDir, "--strict"]));
  assertFileIncludes("yaml-safe project frontmatter quoted", join(yamlOutDir, "SKILL.md"), 'description: "Maintain Quoted: \\"Project\\"');
  assertFileIncludes("yaml-safe project metadata quoted", join(yamlOutDir, "agents", "openai.yaml"), 'short_description: "Maintain \\"quoted\\" project"');
  assertOk("validate yaml-safe project output", run(["scripts/validate-project-skill.mjs", yamlOutDir]));
  mkdirSync(join(yamlOutDir, "assets"), { recursive: true });
  writeFileSync(join(yamlOutDir, "assets", "sample-template.md"), "# {{title}}\n\nTemplate asset without maintainer evidence blocks.\n");
  assertOk("validate project output with markdown asset template", run(["scripts/validate-project-skill.mjs", yamlOutDir]));
  writeFileSync(join(yamlOutDir, "agents", "openai.yaml"), 'interface:\n  display_name: "Quoted Project"\n  short_description: "Maintain "quoted" project"\n  default_prompt: "Use the project skill."\n');
  assertFailIncludes("broken project metadata YAML fails", run(["scripts/validate-project-skill.mjs", yamlOutDir]), "invalid quoted string");

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
  assertFileIncludes("SKILL.md links forward tests", join(repoRoot, "SKILL.md"), "references/evals/forward-tests.md");
  assertFileIncludes("forward tests include genesis prompt", join(repoRoot, "references", "evals", "forward-tests.md"), "## Genesis Mode Prompt");
  assertFileIncludes("forward tests include repo prompt", join(repoRoot, "references", "evals", "forward-tests.md"), "## Repo Mode Prompt");
  assertFileIncludes("forward tests include refresh prompt", join(repoRoot, "references", "evals", "forward-tests.md"), "## Refresh Workflow Prompt");

  const installed = process.env.HOME ? join(process.env.HOME, ".codex", "skills", "ai-project-skill-maker") : null;
  if (checkInstalled && installed && existsSync(installed)) {
    const repoFiles = fileHashMap(repoRoot);
    const installedFiles = fileHashMap(installed);
    const forbidden = ["README.md", "README.ja.md", "LICENSE"].filter((file) => existsSync(join(installed, file)));
    const missing = [...repoFiles.keys()].filter((file) => !installedFiles.has(file));
    const extra = [...installedFiles.keys()].filter((file) => !repoFiles.has(file));
    const changed = [...repoFiles.keys()].filter((file) => installedFiles.has(file) && installedFiles.get(file) !== repoFiles.get(file));
    if (missing.length || extra.length || changed.length || forbidden.length) {
      console.error("FAIL installed skill differs from repo");
      for (const [label, files] of [["missing", missing], ["extra", extra], ["changed", changed]]) {
        for (const file of files.slice(0, 8)) console.error(`- ${label}: ${file}`);
        if (files.length > 8) console.error(`- ${label}: ...and ${files.length - 8} more`);
      }
      for (const file of forbidden) console.error(`- forbidden repo doc in installed skill: ${file}`);
      process.exit(1);
    }
    console.log("OK installed skill payload matches repo");
    assertOk("installed install script is self-safe", spawnSync(process.execPath, ["scripts/install-local-skill.mjs"], {
      cwd: installed,
      encoding: "utf8",
    }));
    assertFileIncludes("installed skill survived self-install", join(installed, "SKILL.md"), "name: ai-project-skill-maker");
  } else if (checkInstalled) {
    console.log("SKIP installed skill check");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
