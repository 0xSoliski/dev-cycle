# Third-party sources

This plugin packages selected skills from the following repositories.

- [obra/superpowers](https://github.com/obra/superpowers), by Jesse Vincent (`obra`), at commit [`bb92a77741419a4ab5f06e711a283343f1ada0c3`](https://github.com/obra/superpowers/commit/bb92a77741419a4ab5f06e711a283343f1ada0c3)
  - brainstorming
  - writing-plans
  - executing-plans
  - test-driven-development
  - systematic-debugging
  - requesting-code-review
  - receiving-code-review
  - verification-before-completion
  - using-git-worktrees
  - finishing-a-development-branch
  - subagent-driven-development
  - dispatching-parallel-agents
  - writing-skills
  - diagnosing-superpowers (packaged as `diagnosing-dev-cycle`)
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), by Addy Osmani, at commit [`1be8e34187e34647bb83adc3a1323b26ae6f6abe`](https://github.com/addyosmani/agent-skills/commit/1be8e34187e34647bb83adc3a1323b26ae6f6abe)
  - code-simplification
  - security-and-hardening
  - performance-optimization
  - browser-testing-with-devtools
  - documentation-and-adrs

Upstream license texts are preserved in `licenses/`.

Packaging note: `executing-plans` keeps the upstream platform reference files inside its own
`references/` directory, with the corresponding relative link adjusted for Codex plugin validation.

Packaging note: internal cross-skill namespace references for bundled skills are rewritten from `superpowers:` to `dev-cycle:` so they resolve when installed in either Claude Code or Codex.

Packaging note: `writing-skills` is included because `test-driven-development` references it. Its required skill references resolve to skills already bundled here. Duplicate Codex/Gemini platform reference copies were removed so Codex runtime guidance has a single canonical location under `executing-plans/references/`.

Packaging note: compatibility adaptations replace upstream operational paths and package branding with `dev-cycle` equivalents. Claude Code and Codex share one skills directory, with separate marketplace/plugin manifests and runtime mappings. Subagent prompts use the active client's tool schema, browser testing documents both MCP CLIs, and project guidance distinguishes `CLAUDE.md` from `AGENTS.md`. The visual companion reads version metadata from either plugin manifest.

Packaging note: stale development-only artifacts (`systematic-debugging/CREATION-LOG.md` and the Claude-specific `writing-skills/examples/CLAUDE_MD_TESTING.md`) are omitted from the packaged plugin. The large copied Anthropic authoring-guide snapshot in `writing-skills/anthropic-best-practices.md` is reduced to a concise platform-specific pointer plus portable principles. These packaging changes do not change the upstream attribution or preserved MIT license texts.

Packaging note: the v7.0.0 workflow refresh replaces the old spec reviewer with
`brainstorming/builder-check-prompt.md` and removes the unused plan reviewer.
Inline execution includes `task-start` and `task-done`; their internal helper
calls use Bash so marketplace archives need not preserve executable bits.
Diagnostics use the dev-cycle namespace, project scratch directory, and this
repository's issue tracker, without assuming upstream labels or templates.

Testing provenance: regression suites under `tests/brainstorm-server/`,
`tests/claude-code/`, and `tests/diagnosing-dev-cycle/` are adapted from the same
pinned obra/superpowers commit. Changes relocate skill paths and scratch names.
Upstream telemetry-branding tests are not imported because dev-cycle deliberately
uses its own local branding; dual-manifest rendering is covered by our packaging
tests. The upstream MIT license in `licenses/obra-superpowers-LICENSE` in the packaged plugin covers these tests.

Local lifecycle correction: `stop-server.sh` recognizes zombie processes as exited and rechecks the per-start identity while waiting and before SIGKILL. The imported lifecycle and PID-ownership tests cover the behavior.
