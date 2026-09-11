# Anthropic skill-authoring reference

This file replaces the large copied Anthropic documentation snapshot that was bundled
with the upstream `obra/superpowers` `writing-skills` skill. The original upstream
source remains attributed in `THIRD_PARTY_SOURCES.md` and the preserved MIT license.

For the current Anthropic guidance, consult Anthropic's official Agent Skills
documentation. It is Claude-specific and should not be treated as Codex runtime
configuration.

The portable principles relevant to this plugin are:

- Keep a skill's trigger and scope explicit.
- Put the minimum necessary workflow in `SKILL.md`; move detailed examples and
  references to supporting files.
- Prefer concrete steps, exact commands, and verifiable outputs over vague advice.
- Test skills against realistic failure/pressure scenarios before relying on them.
- Keep bundled scripts deterministic and make dependencies explicit.
- Treat platform-specific tool names, filesystem locations, and model names as runtime
  details; inspect the active environment instead of hard-coding another agent's
  conventions.

Codex-specific behavior in this plugin is documented by the plugin's own skills and
`executing-plans/references/codex-tools.md`.
