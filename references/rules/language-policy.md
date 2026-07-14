# Language Policy

## Core Principle

Write reusable agent instructions in English so future AI coding agent sessions can reliably execute them. Ask interview questions and generate project-facing reference content in the user's selected project language when that improves usefulness.

## Language Fields to Capture

- `instruction_language`: English by default for `SKILL.md` and procedural agent instructions.
- `project_docs_language`: language for docs and generated reference files.
- `public_voice_language`: language for website, README, release notes, and social/public copy.
- `developer_interview_language`: language used while asking the creator questions.

## Rules

- Preserve product names, command names, API identifiers, paths, and code symbols in their original language.
- If the user mixes languages, ask whether generated project references should be bilingual or primarily one language.
- For multilingual projects, record which language belongs to docs, UI text, commit messages, comments, and releases.
- Do not translate legal, license, or policy text unless explicitly requested.
