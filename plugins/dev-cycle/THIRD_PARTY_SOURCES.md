# Third-party sources

This plugin packages selected skills from the following repositories.

- [obra/superpowers](https://github.com/obra/superpowers), by Jesse Vincent (`obra`), at commit [`b36e0829c6d0140e93cfef2ca599b1b07d4a7797`](https://github.com/obra/superpowers/commit/b36e0829c6d0140e93cfef2ca599b1b07d4a7797)
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
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), by Addy Osmani, at commit [`6ca0cd7db39b41b1c37e26d335c507ee92382c6d`](https://github.com/addyosmani/agent-skills/commit/6ca0cd7db39b41b1c37e26d335c507ee92382c6d)
  - code-simplification
  - security-and-hardening
  - performance-optimization
  - browser-testing-with-devtools
  - documentation-and-adrs

Upstream license texts are preserved in `licenses/`.

Packaging note: `executing-plans` keeps the upstream platform reference files inside its own
`references/` directory, with the corresponding relative link adjusted for Codex plugin validation.

Packaging note: internal cross-skill namespace references for bundled skills are rewritten from `superpowers:` to `dev-cycle:` so they resolve when installed as this Codex plugin.

Packaging note: `writing-skills` is included because `test-driven-development` references it. Its required skill references resolve to skills already bundled here, and its platform reference files are kept locally under `writing-skills/references/` for standalone validation.
