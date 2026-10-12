# dev-cycle

A plugin for Claude Code and Codex that bundles a focused software-development workflow from two MIT-licensed skill repositories:

- [obra/superpowers](https://github.com/obra/superpowers), by Jesse Vincent (`obra`), pinned at `bb92a77741419a4ab5f06e711a283343f1ada0c3`
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), by Addy Osmani, pinned at `1be8e34187e34647bb83adc3a1323b26ae6f6abe`

Both clients use the same skills under `plugins/dev-cycle/skills/`, with separate marketplace and plugin manifests. This repository does not claim authorship of the upstream skill content. See [`THIRD_PARTY_SOURCES.md`](plugins/dev-cycle/THIRD_PARTY_SOURCES.md) and [`plugins/dev-cycle/licenses/`](plugins/dev-cycle/licenses/) for exact provenance and preserved upstream MIT license texts.

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
14. `diagnosing-dev-cycle` (adapted from `diagnosing-superpowers`)

From `addyosmani/agent-skills`:

15. `code-simplification`
16. `security-and-hardening`
17. `performance-optimization`
18. `browser-testing-with-devtools`
19. `documentation-and-adrs`

## Install in Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add 0xSoliski/dev-cycle
/plugin install dev-cycle@dev-cycle
```

Start a new Claude Code session after installation. Invoke a skill with, for example,
`/dev-cycle:brainstorming` or `/dev-cycle:executing-plans`. Claude can also select
skills based on their descriptions.

To try local changes before publishing, run from the repository root:

```bash
claude --plugin-dir ./plugins/dev-cycle
```

## Install in Codex

```bash
codex plugin marketplace add 0xSoliski/dev-cycle --ref main
codex plugin add dev-cycle@dev-cycle
```

Start a new Codex task after installation so the new skills are loaded into the task context.

To install or refresh this local checkout before publishing, run from the repository root:

```bash
codex plugin marketplace add "$PWD"
codex plugin add dev-cycle@dev-cycle
codex plugin list --marketplace dev-cycle --json
```

These commands need a writable Codex configuration directory. If a marketplace with
this name already points elsewhere, inspect `codex plugin marketplace list --json`
and resolve that source explicitly before installing. Do not change `CODEX_HOME`
to a separate directory and mistake that for updating the active client's plugin.

## Development and validation

The shipped Markdown skills and helpers have no package dependencies or build step. Bundled helpers use
Bash, Git, and Node.js; use Node.js 24 LTS for the checks below and JavaScript helpers.
Graphviz (`dot`) is optional for rendering skill diagrams. Chrome DevTools MCP is
optional; its skill documents setup separately for Claude Code and Codex.

From the repository root:

```bash
npm ci --prefix tests/brainstorm-server --ignore-scripts --no-audit --no-fund
bash tests/run-all.sh
claude plugin validate . --strict
claude plugin validate ./plugins/dev-cycle --strict
```

The packaging checks verify both clients expose the same 19 skills and version.
The imported upstream suites cover WebSocket framing, HTTP authentication, rendering,
reloads, lifecycle, PID ownership, SDD workspace collisions, review ranges, and
inline execution. The only test dependency is the lockfile-pinned `ws` client under
`tests/brainstorm-server/`; it is not shipped with the plugin. Run suites sequentially
because the server fixtures share ports. Linux/macOS run `tests/run-all.sh`; the
Windows/Git Bash lifecycle check is `bash tests/brainstorm-server/windows-lifecycle.test.sh`.
The Claude Code CLI checks marketplace and plugin schemas; it must be installed
for the final two commands. These checks do not require a model API call.

Keep the version and shared metadata in `.codex-plugin/plugin.json` and
`.claude-plugin/plugin.json` synchronized inside `plugins/dev-cycle/`. Runtime
guidance is in [Codex](plugins/dev-cycle/skills/executing-plans/references/codex-tools.md)
and [Claude Code](plugins/dev-cycle/skills/executing-plans/references/claude-code-tools.md)
references; the skill content and scripts are shared.

## Upstream refresh (0.5.0)

This version incorporates Superpowers 7.0.0 and Agent Skills 0.6.12 at the exact
commits above. It adds the rebuilt brainstorming/builder check, leaner planning,
inline execution with task ledgers, and `diagnosing-dev-cycle` for session reports.
It includes fixes for secret-printing examples, plan-workspace collisions,
`.gitignore` preservation, invalid review ranges, literal HTML insertion, and
Claude Code argument substitution. Security and performance examples now live in
skill-local reference files; ADR/prose review preserves source details.

Local adaptations keep the two client manifests synchronized, use the runtime's
model/delegation policies, and run helper scripts through Bash even when an archive
strips executable bits. Companion shutdown also recognizes exited zombie processes
in containers and rechecks PID ownership before escalating a stop.

## Release bundles

Build the separate Codex and Claude Code ZIPs with Python 3 (standard library only):

```bash
python3 scripts/build-release.py
cd dist/0.5.0
sha256sum -c SHA256SUMS
```

Each ZIP includes its client's marketplace and plugin manifests, all 19 skills,
installation instructions, release notes, upstream licenses, and a per-file hash
inventory. Extract the complete archive, including hidden directories, and follow
its `README.md`. Runtime use requires no npm installation. Build outputs stay in
the ignored `dist/<version>/` directory; generating them does not publish a release.
The builder is reproducible and refuses to replace differing artifacts unless
`--force` is supplied. Archive tests run as part of `tests/run-all.sh` and require
Python 3 in addition to Node.js.

To publish a release, commit the release source and push its matching `v<version>`
tag. The `Release plugin bundles` GitHub Actions workflow checks the version and
packaging, rebuilds both ZIPs, and uploads them with checksums and release notes to
GitHub Releases. Repository Actions must be enabled for automatic publication.

## Packaging adaptations

A small number of references and runtime assumptions were adjusted so the selected upstream skills work as a standalone plugin in both clients:

- Cross-skill references between bundled Superpowers skills use the `dev-cycle:` namespace.
- `executing-plans` platform references are kept under that skill's `references/` directory to satisfy Codex plugin validation.
- Skill references are closed transitively: if a bundled skill requires another upstream skill, that skill is bundled too.
- Operational scratch/workflow paths use `.dev-cycle/` and `docs/dev-cycle/` instead of upstream package-specific paths.
- Subagent guidance uses each client's live tool schema rather than hard-coded pseudo-syntax, model names, or timeout assumptions.
- `browser-testing-with-devtools` documents both clients' MCP setup commands.
- Project guidance distinguishes Codex's `AGENTS.md` from Claude Code's `CLAUDE.md`. The retained `AGENTS_MD_TESTING.md` example is explicitly Codex-specific; stale historical artifacts are omitted.
- Runtime mappings are centralized under `executing-plans/references/`, including separate Codex and Claude Code guides.
- The large copied Anthropic skill-authoring documentation snapshot was replaced with a concise pointer and portable principles; upstream provenance and license attribution remain preserved.

See [`plugins/dev-cycle/THIRD_PARTY_SOURCES.md`](plugins/dev-cycle/THIRD_PARTY_SOURCES.md) for details.
