# Genesis Mode

Use genesis mode when there is no existing repo or the repo is too empty to reveal real maintenance patterns.

## Goal

Turn developer intent into a project maintainer skill that can guide day-one implementation without pretending there are repository facts.

## Procedure

1. Interview the developer using `references/checklists/genesis-intake.md`.
2. Ask in the developer's preferred language, but record core skill instructions in English.
3. Capture constraints as declared intent, not observed facts.
4. Convert uncertain choices into inferred assumptions only when the user wants momentum.
5. Select recommended standards from the relevant files under `references/standards/`.
6. Render the skill with explicit "day-one" workflows: create scaffold, establish checks, write docs, and define release posture.
7. Include a clear "First Repository Tasks" section in `references/workflows.md`.

## Genesis-Specific Rules

- Do not cite files that do not exist.
- Do not claim framework, architecture, test runner, or release process as fact unless the user declares it.
- Prefer crisp defaults over broad option lists once the user has provided enough preference.
- Include "questions to revisit after first implementation" in `references/project-intent.md`.

## Minimum Interview Coverage

Collect:

- Product goal and non-goals.
- Target users and public positioning.
- Project language for docs, UI, comments, and release notes.
- Preferred stack and hard exclusions.
- Expected repo shape.
- Quality bar and verification budget.
- Dependency and licensing posture.
- Release model.
- Maintenance style: conservative, exploratory, fast-moving, compliance-heavy, documentation-first, or another declared style.
