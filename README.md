# dev-cycle

A Codex plugin that bundles a focused software-development workflow from two MIT-licensed skill repositories:

- [obra/superpowers](https://github.com/obra/superpowers), by Jesse Vincent (`obra`), pinned at `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), by Addy Osmani, pinned at `6ca0cd7db39b41b1c37e26d335c507ee92382c6d`

This repository repackages selected upstream skills for Codex. It does not claim authorship of the upstream skill content. See [`THIRD_PARTY_SOURCES.md`](plugins/dev-cycle/THIRD_PARTY_SOURCES.md) and [`plugins/dev-cycle/licenses/`](plugins/dev-cycle/licenses/) for exact provenance and preserved upstream MIT license texts.

## Included skills

From `obra/superpowers`:

1. `brainstorming`
2. `writing-plans`
3. `executing-plans`
4. `test-driven-development`
5. `systematic-debugging`
6. `requesting-code-review`
7. `receiving-code-review`
8. `verification-before-completion`
9. `using-git-worktrees`
10. `finishing-a-development-branch`
11. `subagent-driven-development`
12. `dispatching-parallel-agents`
13. `writing-skills`

From `addyosmani/agent-skills`:

14. `code-simplification`
15. `security-and-hardening`
16. `performance-optimization`
17. `browser-testing-with-devtools`
18. `documentation-and-adrs`

## Install in Codex

```bash
codex plugin marketplace add 0xSoliski/dev-cycle --ref main
codex plugin add dev-cycle@dev-cycle
```

Start a new Codex task after installation so the new skills are loaded into the task context.

## Packaging adaptations

A small number of references were adjusted so the selected upstream skills work as a standalone Codex plugin:

- Cross-skill references between bundled Superpowers skills use the `dev-cycle:` namespace.
- `executing-plans` platform references are kept under that skill's `references/` directory to satisfy Codex plugin validation.
- Skill references are closed transitively: if a bundled skill requires another upstream skill, that skill is bundled too.
- Supporting platform-reference files used by a skill are copied into that skill's own `references/` directory when needed for Codex validation.

See [`plugins/dev-cycle/THIRD_PARTY_SOURCES.md`](plugins/dev-cycle/THIRD_PARTY_SOURCES.md) for details.
