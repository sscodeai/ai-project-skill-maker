---
name: ai-project-skill-maker
description: Create or refresh reusable AI project maintainer skills and instruction bundles for specific software projects. Use when the user wants a new project-specific maintainer guide for AI coding agents, including genesis-mode instructions for new projects from developer intent and repo-mode instructions based on existing repository evidence.
---

# AI Project Skill Maker

## Purpose

Create project-specific maintainer instructions that future AI coding agents can use to understand, modify, verify, document, and release a software project. This is a meta-skill: its output is another project maintainer skill or instruction bundle, not ordinary project documentation.

Keep this `SKILL.md` small. Put detailed mode rules, templates, standards, and adapters in references and assets.

## Initial Scope

- Support genesis mode for new projects driven by developer intent.
- Support repo mode for existing projects driven by repository evidence.
- Keep core instructions in English.
- Allow user interviews and generated project references to use the selected project language.
- Separate observed facts, declared user intent, recommended standards, and inferred assumptions.
- Preserve user-authored rules during refresh.
- Prefer platform-neutral output design, with adapters for Codex skills, `AGENTS.md`, `CLAUDE.md`, Cursor rules, and future assistant instruction formats.

<!-- BEGIN USER RULES -->
<!-- Add durable project-specific rules here. This block is preserved on refresh. -->
<!-- END USER RULES -->
