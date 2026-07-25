# AI Project Skill Maker

[日本語版](README.ja.md)

Generate durable project maintainer skills and instruction bundles for AI coding agents.

AI Project Skill Maker is a meta-skill: it helps create project-specific maintainer guidance that future AI sessions can use to understand a repository, make changes in the right style, run the right checks, preserve project intent, and avoid editing generated or sensitive files casually.

It is designed to be platform-neutral. The default template can be used as an AI project maintainer skill, and the reference adapters describe how to emit formats such as Codex skills, `AGENTS.md`, `CLAUDE.md`, Cursor rules, and future assistant instruction files.

## Source of Truth and Installation

This repository is the canonical source for the `ai-project-skill-maker` skill. When using it as a local Codex personal skill, install or sync the repository contents to:

```text
~/.codex/skills/ai-project-skill-maker
```

Avoid keeping an older `~/.codex/skills/project-skill-maker` installation active at the same time. If both are present, Codex may discover the stale skill name and use older instructions.

## Modes

### Genesis Mode

Use genesis mode for a new project that does not have meaningful repository evidence yet.

The maker interviews the developer about:

- comfortable language and locale preferences
- product goals and non-goals
- target users
- technical preferences and constraints
- documentation and public voice
- quality bar and verification expectations
- release posture
- first implementation milestones

The output is a day-one maintainer skill that records declared intent and recommended standards without pretending they are observed repository facts.

#### Language and Locale Setup

Genesis mode starts by asking what language the author thinks and reviews best in. It then asks whether the rest of the interview and generated project-facing references should use that language.

If the author opts in, the maker continues in that language and biases generated references toward the author's language and locale profile. For example, Japanese projects can choose `です・ます`, `だ・である`, or a mixed technical documentation style, and can target domestic Japan, global Japanese readers, or bilingual engineers.

If the author does not want to use their comfortable language for the project, the maker asks them to choose interview and output languages explicitly. When there is no preference, the default is English.

### Repo Mode

Use repo mode for an existing repository.

The maker scans repository signals first, then asks a smaller set of follow-up questions about future maintenance goals. It looks at files such as:

- `README*`, docs, contribution, changelog, and license files
- `package.json`, lockfiles, TypeScript/build/test configs
- CI workflows
- scripts, tests, source entry points, and generated-file signals
- commit and style signals when available

The output is a long-term maintainer skill grounded in observed project facts.

## Evidence Model

Generated project references separate claims into:

- `observed_fact`: evidence from repository files, commands, CI, tests, metadata, or history
- `declared_intent`: goals, constraints, and preferences explicitly provided by the maintainer
- `recommended_standard`: standards selected because they fit the project type
- `inferred_assumption`: cautious assumptions made from incomplete information

Observed facts should cite source files whenever possible.

## Generated Output

A project maintainer skill includes:

```text
SKILL.md
agents/openai.yaml
references/project-intent.md
references/project-map.md
references/architecture.md
references/coding-standards.md
references/content-style.md
references/workflows.md
references/verification.md
references/release.md
references/generated-files.md
scripts/health-check.* optional
```

Generated Markdown files include a preserved manual block:

```markdown
<!-- BEGIN USER RULES -->
<!-- Add durable project-specific rules here. This block is preserved on refresh. -->
<!-- END USER RULES -->
```

Refresh workflows preserve the content inside those markers.

## Scripts

Collect repository signals:

```bash
node scripts/collect-repo-signals.mjs /path/to/repo > repo-signals.json
```

Render a project maintainer skill from a JSON config:

```bash
node scripts/render-project-skill.mjs \
  --input config.json \
  --output ./my-project-maintainer
```

See `references/config-schema.md` for supported fields. Starter configs are available at:

```text
assets/examples/genesis-config.json
assets/examples/repo-config.json
```

You can also print starters or the schema from the renderer:

```bash
node scripts/render-project-skill.mjs --init-config genesis > config.json
node scripts/render-project-skill.mjs --init-config repo > config.json
node scripts/render-project-skill.mjs --print-schema
```

Validate a generated maintainer skill. Validate the rendered output directory, not the raw `assets/templates/project-skill` template:

```bash
node scripts/validate-project-skill.mjs ./my-project-maintainer
```

For Codex skill compatibility, you can also run the skill-creator `quick_validate.py` script on the rendered output. That script depends on `PyYAML` in the Python environment.

Install or sync the local Codex personal skill:

```bash
node scripts/install-local-skill.mjs
```

Run the repository self-check:

```bash
node scripts/self-check.mjs
node scripts/self-check.mjs --check-installed
```

## Current Focus

The first version prioritizes:

- Astro and documentation sites
- TypeScript and Node OSS projects
- documentation-heavy projects
- reusable maintainer workflows for AI coding agents

The design intentionally leaves room for more adapters, including `.github/copilot-instructions.md` and other platform-specific instruction formats.

Current adapter references include Codex skills, `AGENTS.md`, `CLAUDE.md`, Cursor rules, and `.github/copilot-instructions.md`. See `references/adapters/output-contract.md` for shared adapter expectations.

## License

Apache-2.0
