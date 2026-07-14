# Quality Gate

Before delivering a generated project maintainer skill:

- Required files exist.
- `SKILL.md` frontmatter has only `name` and `description`.
- `agents/openai.yaml` has quoted interface strings.
- Reference files include an `Evidence Ledger`.
- Manual preservation blocks exist in generated Markdown files.
- Observed facts cite source paths when repo evidence exists.
- Generated instructions are actionable for future AI-assisted maintenance.
- Verification commands are concrete or clearly marked as recommendations/assumptions.
- Generated files and edit restrictions are documented.
- Refresh did not remove content inside `BEGIN USER RULES` blocks.

Run:

```bash
node scripts/validate-project-skill.mjs <output-skill-dir>
python3 /path/to/skill-creator/scripts/quick_validate.py <output-skill-dir>
```
