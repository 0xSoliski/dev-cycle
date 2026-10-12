const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const plugin = path.join(root, 'plugins/dev-cycle');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const codex = readJson(path.join(plugin, '.codex-plugin/plugin.json'));
const claude = readJson(path.join(plugin, '.claude-plugin/plugin.json'));

test('both marketplaces resolve to the shared plugin and matching manifests', () => {
  const marketplaces = [
    [readJson(path.join(root, '.agents/plugins/marketplace.json')), '.codex-plugin'],
    [readJson(path.join(root, '.claude-plugin/marketplace.json')), '.claude-plugin'],
  ];
  for (const [marketplace, manifestDir] of marketplaces) {
    assert.equal(marketplace.name, 'dev-cycle');
    assert.equal(marketplace.plugins.length, 1);
    const entry = marketplace.plugins[0];
    const source = typeof entry.source === 'string' ? entry.source : entry.source.path;
    assert.ok(source.startsWith('./'));
    const resolved = fs.realpathSync(path.resolve(root, source));
    assert.equal(resolved, plugin);
    assert.equal(readJson(path.join(resolved, manifestDir, 'plugin.json')).name, entry.name);
  }
  for (const key of ['name', 'version', 'description', 'author', 'skills']) {
    assert.deepEqual(claude[key], codex[key], `shared metadata differs: ${key}`);
  }
  assert.match(claude.version, /^\d+\.\d+\.\d+$/);
});

test('both clients discover all 19 skills with valid bundled skill references', () => {
  const discovered = [codex, claude].map(manifest => {
    assert.ok(manifest.skills.startsWith('./'));
    const skillsPath = fs.realpathSync(path.resolve(plugin, manifest.skills));
    assert.equal(skillsPath, path.join(plugin, 'skills'));
    return fs.readdirSync(skillsPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const text = fs.readFileSync(path.join(skillsPath, entry.name, 'SKILL.md'), 'utf8');
        const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
        assert.ok(frontmatter, `missing frontmatter: ${entry.name}`);
        assert.equal(frontmatter[1].match(/^name:\s*(\S+)\s*$/m)?.[1], entry.name);
        assert.match(frontmatter[1], /^description:\s*\S.+$/m);
        return entry.name;
      }).sort();
  });
  assert.deepEqual(discovered[0], discovered[1]);
  assert.equal(discovered[0].length, 19);
  const names = new Set(discovered[0]);
  function checkReferences(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) checkReferences(file);
      else if (entry.name.endsWith('.md')) {
        const text = fs.readFileSync(file, 'utf8');
        for (const match of text.matchAll(/(?<![\w-])dev-cycle:([a-z][a-z0-9-]*)/g)) {
          assert.ok(names.has(match[1]), `unbundled skill ${match[1]} referenced in ${file}`);
        }
      }
    }
  }
  checkReferences(path.join(plugin, 'skills'));
});

function get(port, route, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: route, headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    });
    req.setTimeout(3000, () => req.destroy(new Error('HTTP check timed out')));
    req.on('error', reject);
  });
}

for (const manifestDir of ['.codex-plugin', '.claude-plugin']) {
  test(`visual companion serves branded HTML with only ${manifestDir}`, { timeout: 15000 }, async t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-cycle-packaging-'));
    let child;
    let exit;
    t.after(async () => {
      try {
        if (child) {
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
          await exit;
        }
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    });
    const scripts = path.join(fixture, 'skills/brainstorming/scripts');
    fs.cpSync(path.join(plugin, 'skills/brainstorming/scripts'), scripts, { recursive: true });
    fs.mkdirSync(path.join(fixture, manifestDir));
    fs.copyFileSync(path.join(plugin, manifestDir, 'plugin.json'), path.join(fixture, manifestDir, 'plugin.json'));
    const session = path.join(fixture, 'session');
    const content = path.join(session, 'content');
    fs.mkdirSync(content, { recursive: true });
    fs.writeFileSync(path.join(content, 'test.html'), '<h2>Shared plugin smoke check</h2>');
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key.startsWith('BRAINSTORM_')) delete env[key];
    }
    env.BRAINSTORM_DIR = session;
    env.BRAINSTORM_HOST = '127.0.0.1';
    child = spawn(process.execPath, [path.join(scripts, 'server.cjs')], {
      env, stdio: ['ignore', 'ignore', 'pipe'],
    });
    exit = once(child, 'exit');
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    const infoFile = path.join(session, 'state/server-info');
    for (let attempt = 0; attempt < 100 && !fs.existsSync(infoFile); attempt++) {
      assert.equal(child.exitCode, null, `server exited: ${stderr}`);
      await delay(50);
    }
    assert.ok(fs.existsSync(infoFile), `server did not become ready: ${stderr}`);
    const info = readJson(infoFile); // Contains a key: keep it out of test output.
    assert.equal((await get(info.port, '/')).status, 403);
    const bootstrap = await get(info.port, '/' + new URL(info.url).search);
    assert.equal(bootstrap.status, 200);
    const cookie = bootstrap.headers['set-cookie'][0].split(';', 1)[0];
    const page = await get(info.port, '/', { Cookie: cookie });
    assert.equal(page.status, 200);
    assert.ok(page.body.includes(`Dev Cycle v${codex.version}`));
    assert.ok(page.body.includes('Shared plugin smoke check'));
    assert.ok(!page.body.includes('Dev Cycle vunknown'));
  });
}
