const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('inline execution works when plugin archives strip every executable bit', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-cycle-no-exec-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const skills = path.join(temp, 'plugin/skills');
  const repo = path.join(temp, 'project with spaces');
  fs.mkdirSync(repo);
  for (const skill of ['executing-plans', 'subagent-driven-development']) {
    const dest = path.join(skills, skill, 'scripts');
    fs.cpSync(path.resolve(__dirname, '../plugins/dev-cycle/skills', skill, 'scripts'), dest, { recursive: true });
    for (const name of fs.readdirSync(dest)) fs.chmodSync(path.join(dest, name), 0o644);
  }
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  git('init', '-q', '-b', 'main');
  const plan = path.join(repo, 'plan with spaces.md');
  fs.writeFileSync(plan, '# Plan\n\n## Task 1: Verify the package\n\nRead the actual brief.\n');
  git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture');
  const scripts = path.join(skills, 'executing-plans/scripts');
  const start = spawnSync('bash', [path.join(scripts, 'task-start'), plan, '1'], { cwd: repo, encoding: 'utf8' });
  assert.equal(start.status, 0, start.stderr);
  const brief = start.stdout.match(/^brief: (.+)$/m)?.[1];
  const base = start.stdout.match(/^base: (.+)$/m)?.[1];
  assert.ok(brief);
  assert.equal(base, git('rev-parse', 'HEAD'));
  assert.match(fs.readFileSync(brief, 'utf8'), /Read the actual brief/);
  const done = spawnSync('bash', [path.join(scripts, 'task-done'), plan, '1', base, '--', 'bash', '-c', ':'], { cwd: repo, encoding: 'utf8' });
  assert.equal(done.status, 0, done.stderr);
  assert.match(fs.readFileSync(path.join(path.dirname(brief), 'progress.md'), 'utf8'), /Task 1: complete.*\(no output\)/);
});
