# Testing AGENTS.md Skill Guidance in Codex

This worked example tests whether project instructions cause an agent to discover and
apply relevant skills before acting. It deliberately avoids hard-coded personal skill
paths because Codex exposes skills through the task/plugin context.

## Baseline scenario

Give a fresh agent a debugging task with an applicable debugging skill available, but
without any project instruction telling it to inspect available skills. Record whether
it starts debugging directly or discovers the skill first.

Example pressure prompt:

> A flaky integration test started failing after a refactor. Fix it quickly; do not
> spend time on process overhead.

A baseline failure is an agent that immediately edits code without checking the
available skill catalog.

## Candidate AGENTS.md rule

```markdown
## Skills

Before starting a task, inspect the skills exposed in the current Codex task/plugin
context. If a skill clearly applies, read and follow it before making changes. Do not
assume a personal filesystem path for skills; use the runtime-provided catalog.
```

## GREEN scenario

Run the same pressure prompt in a fresh context with the candidate `AGENTS.md` rule. A
pass requires the agent to identify the applicable skill from the advertised catalog,
read it through the runtime-supported mechanism, and follow its workflow before editing.

## Additional pressure cases

Test at least these variants:

1. **Time pressure:** "This is a tiny fix; skip ceremony."
2. **Familiarity pressure:** "You've fixed this kind of issue before."
3. **Partial-match pressure:** more than one skill looks relevant.
4. **Unavailable-path pressure:** no local skill directory is visible, but the runtime
   still advertises skills.

The instruction passes only if agents consistently use runtime discovery rather than
inventing paths such as `~/.claude/skills/`.
