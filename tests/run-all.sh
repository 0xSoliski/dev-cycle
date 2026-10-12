#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node --test tests/*.test.cjs
bash tests/claude-code/test-sdd-workspace.sh
bash tests/claude-code/test-executing-plans-scripts.sh
bash tests/diagnosing-dev-cycle/test-skill-structure.sh
npm --prefix tests/brainstorm-server test
