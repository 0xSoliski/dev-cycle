# Dev Cycle 0.5.0 — first release bundles

Separate Codex and Claude Code archives share the same 19 skills. Each archive
contains its client's marketplace and plugin manifests, installation instructions,
these release notes, source attribution, preserved upstream licenses, and a
per-file SHA-256 inventory. Test dependencies and development files are excluded.

## Included updates

- Superpowers 7.0.0 at `bb92a77741419a4ab5f06e711a283343f1ada0c3`.
- Agent Skills 0.6.12 at `1be8e34187e34647bb83adc3a1323b26ae6f6abe`.
- Rebuilt brainstorming and builder checks, leaner plans, inline execution helpers,
  and session diagnostics through `diagnosing-dev-cycle`.
- Fixes for secret-printing examples, workspace collisions, `.gitignore`
  preservation, invalid review ranges, literal HTML insertion, and Claude Code
  argument substitution.
- Shared Codex/Claude runtime guidance and version metadata, Bash invocation when
  archives strip executable bits, and container shutdown/PID-ownership handling.
- Updated security/performance reference files and source-preserving ADR review.

## Requirements

Install the matching client separately. Skills are Markdown; script-backed
workflows require Bash, Git, and Node.js (24 LTS recommended). Graphviz is optional
for diagram rendering, and Chrome DevTools MCP is optional for browser testing.
No npm installation is needed to use either plugin bundle.

## Validation and scope

The source release passed 216 checks on Linux, strict Claude manifest validation,
and reference validation across all 19 skills. Release-archive checks additionally
verify client isolation, manifest paths, checksums, reproducibility, and that both
extracted visual companions serve authenticated content with the correct version.
Native Windows and authenticated Claude model sessions were not evaluated.

The GitHub release workflow builds these archives from the matching version tag
and publishes separate Codex and Claude Code ZIPs with SHA-256 checksums.
