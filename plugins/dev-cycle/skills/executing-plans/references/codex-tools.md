# Codex runtime mapping

Codex multi-agent tool names and schemas can vary by model preset and runtime version.
Always inspect the tools actually available in the current task and obey their declared
schemas. Do not assume a particular multi-agent version.

## Subagent dispatch

If multi-agent tools are available, map the skill's actions to capabilities:

| Skill action | Codex capability |
|---|---|
| Dispatch a fresh subagent | Use the available `spawn_agent` tool (or equivalent) with a focused prompt and clean context when supported |
| Send a fix/re-review follow-up | Use the available existing-agent message/follow-up tool (`send_input`, `followup_task`, or equivalent) |
| Resume a closed agent | Use `resume_agent` when that capability exists |
| Wait for a result | Use the available wait tool and its declared timeout contract |
| Release an agent slot | Use `close_agent` only when the current runtime exposes it |

Current Codex installations may expose a V1-style set such as `spawn_agent`,
`send_input`, `wait_agent`, `resume_agent`, and `close_agent`. Other installations
may expose a different lifecycle. The live tool schema is authoritative.

### Dispatch rules

- Do not write literal `Subagent (general-purpose):` pseudo-syntax. Call the actual
  subagent tool.
- Start children with only the context required for the delegated task when the tool
  supports clean-context spawning.
- Do not force model or reasoning overrides unless the user requested them or the
  current tool contract explicitly permits that policy. Prefer the tool's inherited
  defaults.
- Reuse an existing implementer for fix rounds when the runtime supports messaging or
  resuming it.
- Close completed children when the runtime requires explicit lifecycle cleanup.

## Waiting

Use the wait tool exactly as documented by the current runtime. Some Codex transports
require a fixed short wait interval; others support longer event waits. A timeout is
not completion. While children run, continue independent local work and wait only when
the next step actually depends on the result.

## Skill discovery

Use the skill catalog injected into the Codex task or the installed plugin catalog.
Do not assume Claude-specific paths such as `~/.claude/skills/`.

## Environment detection

Skills that create worktrees or finish branches should detect their git environment
before changing it:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` means the checkout is already a linked worktree.
- An empty `BRANCH` means detached HEAD; follow the host application's supported
  branch/handoff workflow rather than assuming push/PR operations are available.
