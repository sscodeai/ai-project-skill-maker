---
name: ai-project-skill-maker
description: Create or refresh reusable AI project maintainer skills and instruction bundles for specific software projects. Use when the user wants a new project-specific maintainer guide for AI coding agents, including genesis-mode instructions for new projects from developer intent, repo-mode instructions based on existing repository evidence, adapter output for Codex skills/AGENTS.md/CLAUDE.md/Cursor rules, or refreshes that preserve user-authored rules.
---

# AI Project Skill Maker

## Purpose

Create project-specific maintainer instructions that future AI coding agents can use to understand, modify, verify, document, and release a software project. This is a meta-skill: its output is another project maintainer skill or instruction bundle, not ordinary project documentation.

Keep this `SKILL.md` small. Load only the references needed for the requested mode, standards, and output adapters.

## Mode Selection

- Use **genesis mode** when the project does not exist yet or has too little repository evidence. Read `references/modes/genesis.md`, `references/checklists/genesis-intake.md`, and `references/rules/language-policy.md`.
- Use **repo mode** when a repository already exists. Run `scripts/collect-repo-signals.mjs`, then read `references/modes/repo.md` and `references/checklists/repo-scan.md`.
- Use **refresh workflow** when updating an existing project maintainer skill or instruction bundle. Preserve user-authored rules and read `references/workflows/refresh.md`, `references/output-schema.md`, `references/rules/evidence-vs-recommendation.md`, and the relevant mode file.

If the mode is ambiguous, infer it from available artifacts. Ask only when the choice affects output structure or user intent.

## Core Workflow

1. Establish the language and locale profile for the author, project references, and public expression. Keep core reusable agent instructions in English. Read `references/rules/language-policy.md`.
2. Gather evidence and intent.
   - In genesis mode, interview the developer before rendering.
   - In repo mode, scan the repo before asking follow-up questions.
3. Separate every claim into one of: observed facts, declared user intent, recommended standards, inferred assumptions. Read `references/rules/evidence-vs-recommendation.md`.
4. Choose applicable standards. First release supports Astro/docs sites, TypeScript/Node OSS, and documentation-heavy projects. Load only relevant files under `references/standards/`.
5. Choose output adapters. Default to a project maintainer skill folder; read adapter references only when requested.
6. Validate finished configs with `scripts/validate-config.mjs --strict` when the output is meant to be durable rather than a rough draft.
7. Render the project maintainer skill from `assets/templates/project-skill/` with `scripts/render-project-skill.mjs`.
8. Validate the rendered output with `scripts/validate-project-skill.mjs`. Run platform-specific compatibility checks when relevant.
9. Report the final path, generated files, preserved user areas, validation result, and suggested invocation prompt.

## Required Output Shape

Read `references/output-schema.md` before rendering. A project maintainer skill must include at least:

- `SKILL.md`
- `agents/openai.yaml`
- `references/project-intent.md`
- `references/project-map.md`
- `references/architecture.md`
- `references/coding-standards.md`
- `references/content-style.md`
- `references/workflows.md`
- `references/verification.md`
- `references/release.md`
- `references/generated-files.md`
- optional `scripts/health-check.*`

Do not stuff detailed maintenance rules into the generated `SKILL.md`; put durable details in `references/`.

## Config Inputs

Read `references/config-schema.md` before writing or editing a render config. Use `assets/examples/genesis-config.json` for intent-first projects and `assets/examples/repo-config.json` for existing repositories. You can also run `scripts/render-project-skill.mjs --init-config genesis|repo` or `scripts/render-project-skill.mjs --print-schema`.

## Adapters

Default output is platform-neutral project maintainer guidance. When the user requests a specific assistant artifact, read the matching adapter:

- `references/adapters/output-contract.md`
- `references/adapters/codex-skill.md`
- `references/adapters/agents-md.md`
- `references/adapters/claude-md.md`
- `references/adapters/cursor-rules.md`
- `references/adapters/copilot-instructions.md`

Use the shared output contract before emitting adapter-specific files.

## Scripts

- `scripts/collect-repo-signals.mjs <repo>`: collect package, docs, CI, test, script, lockfile, style, and commit signals as JSON.
- `scripts/draft-project-config.mjs --repo <repo>`: draft a repo-mode render config from collected repository signals.
- `scripts/render-adapter.mjs --input config.json --adapter agents|claude|cursor|copilot --output <path-or-dir>`: render platform-specific instruction files.
- `scripts/validate-config.mjs --input config.json [--mode genesis|repo] [--strict]`: check config shape, evidence labels, strict-mode coverage, and repo-mode observed fact citations.
- `scripts/render-project-skill.mjs --input config.json --output <skill-dir> [--template <dir>] [--strict]`: render or refresh a maintainer skill while preserving manual blocks.
- `scripts/validate-project-skill.mjs <skill-dir>`: verify required files, metadata, evidence labels, and manual preservation markers.
- `scripts/self-check.mjs [--check-installed]`: run repository health checks for render, validation, template failure behavior, and optional installed skill sync.
- `scripts/install-local-skill.mjs [--skills-dir <dir>]`: sync this repository to the local Codex personal skills directory.

Read scripts only when debugging or changing behavior; they are designed to run directly.

<!-- BEGIN USER RULES -->
<!-- Add durable project-specific rules here. This block is preserved on refresh. -->
<!-- END USER RULES -->
