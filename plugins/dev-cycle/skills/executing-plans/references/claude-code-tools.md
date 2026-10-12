# Claude Code runtime mapping

Use the tools exposed in the current Claude Code session and their live schemas.
Codex tool names and lifecycle operations do not apply to Claude Code.

## Skill discovery

Claude Code discovers this plugin's `skills/<name>/SKILL.md` files. Invoke a bundled
skill through the Skill tool with its namespaced name, such as
`dev-cycle:executing-plans`, or use `/dev-cycle:executing-plans` interactively.
Follow supporting-file paths relative to the loaded skill's directory. Installed
plugins can live in a versioned cache; do not assume `~/.claude/skills/` or the
original Git checkout is the installed plugin root.

Read the project's applicable instructions and any files they include. Current
Claude Code can use `AGENTS.md` when no `CLAUDE.md` exists; older versions may
require `CLAUDE.md`. Follow the files the installed runtime actually loads. The
retained `AGENTS_MD_TESTING.md` is a Codex-oriented worked example.

## Subagent dispatch

Use Claude Code's Agent tool (called Task in older releases). This plugin supplies
prompt templates, not custom agent definitions. Select an available agent type
with the capabilities required by the task, such as `general-purpose`; render the
template's placeholders and supply the task text, working directory, and relevant
context in the prompt. Do not use a skill name as an agent type.

Use the inherited/default model unless the user or active tool policy specifies
otherwise. For fix rounds, resume the returned agent identifier only when the
current tool supports it; otherwise dispatch a fresh agent with the prior report
and required context. Use the runtime's supported background completion mechanism
when available. Do not invent Codex spawn, message, wait, or close calls.

For independent parallel tasks, use multiple Agent calls only when permitted by
the session's tool and delegation policies. Track progress with the current
session's task tools, or the plan file if no task tool is exposed. If subagents
are unavailable, use the sequential workflow in `dev-cycle:executing-plans`.

## Scripts and visual companion

Resolve bundled scripts from the loaded skill's directory. Run shell helpers with
Bash and JavaScript helpers with Node; Graphviz is needed only for graph rendering.
Keep generated state in the target project's documented scratch directory.

The visual-companion launcher supports background operation as well as
`--foreground`. Choose the mode supported by the host's process tools; a remote
runtime may reap detached processes. Follow `brainstorming/visual-companion.md`
relative to the shared skills directory, including user approval before opening
a browser and keeping session keys private.

## Optional nested orchestration

When your human partner explicitly asks to reduce coordination cost and the live
Claude Code tool supports nesting, the whole subagent-driven plan can run under
one orchestrator child. Pass the plan, workspace, and reports; use only model
choices permitted by the session policy. Preserve the orchestrator's final
"Rulings I made" list verbatim. Do not assume a fixed nesting depth, create this
extra layer for a single task, or enable it without that request.
