# Repo Scan Checklist

Use this checklist after running `scripts/collect-repo-signals.mjs`.

## Files to Inspect

- `README*`, `docs/**`, `CONTRIBUTING*`, `CHANGELOG*`, `LICENSE*`.
- `package.json`, lockfiles, workspace config, `tsconfig*`, build configs.
- `.github/workflows/**`, CI config, deploy config.
- Test config and representative tests.
- Lint/format config.
- Source entry points, content collections, route files, CLI entry points, or package exports.
- Generated artifacts, public assets, schema files, snapshots, vendored code.

## Signals to Extract

- Package manager and Node/runtime version signals.
- Framework and deployment platform.
- Build, lint, typecheck, test, docs, preview, and release scripts.
- Documentation structure and public voice.
- Naming conventions and file organization.
- Existing quality gaps or missing checks.
- Commit history style if available.

## Follow-Up Questions

Ask only after scanning:

- What maintenance problems should the skill optimize for?
- Are any conventions missing from the repo but important?
- Should the maintainer skill encode current practice, desired future practice, or both?
- What should be preserved during refresh?
