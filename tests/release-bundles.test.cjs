const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const version = require('../plugins/dev-cycle/.codex-plugin/plugin.json').version;

test('release archives are reproducible, complete, isolated, and runnable after extraction', { timeout: 30000 }, async t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-cycle-release-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const output of ['first', 'second']) {
    execFileSync('python3', [path.join(root, 'scripts/build-release.py'), '--output-dir', path.join(fixture, output)]);
  }
  execFileSync('python3', ['-c', String.raw`
import hashlib, json, pathlib, sys, zipfile
base, source = map(pathlib.Path, sys.argv[1:])
first, second = base / 'first', base / 'second'
for file in first.iterdir():
    assert file.read_bytes() == (second / file.name).read_bytes(), file.name
for line in (first / 'SHA256SUMS').read_text().splitlines():
    digest, name = line.split('  ')
    assert hashlib.sha256((first / name).read_bytes()).hexdigest() == digest
for file in first.glob('*.zip'):
    with zipfile.ZipFile(file) as archive:
        assert archive.testzip() is None
        names = archive.namelist()
        assert len(names) == len(set(names))
        prefix = file.stem + '/'
        for name in names:
            assert name.startswith(prefix) and '..' not in pathlib.PurePosixPath(name).parts
            assert not set(pathlib.PurePosixPath(name).parts) & {'node_modules', '.git', 'tests', '__pycache__'}
        inventory = json.loads(archive.read(prefix + 'BUNDLE.json'))
        assert len(inventory['skills']) == 19
        assert set(names) == {prefix + n for n in inventory['files']} | {prefix + 'BUNDLE.json'}
        client = inventory['client']
        manifest_dir = '.codex-plugin' if client == 'codex' else '.claude-plugin'
        other = '.claude-plugin' if client == 'codex' else '.codex-plugin'
        assert not any(other in pathlib.PurePosixPath(n).parts for n in names)
        marketplace_path = '.agents/plugins/marketplace.json' if client == 'codex' else '.claude-plugin/marketplace.json'
        marketplace = json.loads(archive.read(prefix + marketplace_path))
        entry = marketplace['plugins'][0]
        location = entry['source']
        if isinstance(location, dict): location = location['path']
        manifest = json.loads(archive.read(prefix + location.removeprefix('./') + '/' + manifest_dir + '/plugin.json'))
        assert manifest['version'] == inventory['version']
        assert manifest['skills'] == './skills/'
        for name, digest in inventory['files'].items():
            data = archive.read(prefix + name)
            assert hashlib.sha256(data).hexdigest() == digest, name
            if name.startswith('plugins/'):
                assert data == (source / name).read_bytes(), name
            if data.startswith(b'#!'):
                assert archive.getinfo(prefix + name).external_attr >> 16 & 0o111
        assert len([n for n in names if '/licenses/' in n]) == 2
        archive.extractall(base / 'extracted')
`, fixture, root]);

  for (const client of ['codex', 'claude-code']) {
    const extracted = path.join(fixture, 'extracted', `dev-cycle-${client}-${version}`);
    const session = path.join(fixture, `session-${client}`);
    fs.mkdirSync(path.join(session, 'content'), { recursive: true });
    fs.writeFileSync(path.join(session, 'content/test.html'), '<h2>Extracted release smoke check</h2>');
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('BRAINSTORM_')));
    Object.assign(env, { BRAINSTORM_DIR: session, BRAINSTORM_HOST: '127.0.0.1' });
    const child = spawn(process.execPath, [path.join(extracted, 'plugins/dev-cycle/skills/brainstorming/scripts/server.cjs')], { env, stdio: 'ignore' });
    const exit = once(child, 'exit');
    try {
      const infoFile = path.join(session, 'state/server-info');
      for (let i = 0; i < 100 && !fs.existsSync(infoFile); i++) await delay(50);
      assert.ok(fs.existsSync(infoFile), `${client} companion did not start`);
      const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
      const url = `http://127.0.0.1:${info.port}/`;
      const get = (route, headers) => fetch(route, { headers, signal: AbortSignal.timeout(3000) });
      assert.equal((await get(url)).status, 403);
      const bootstrap = await get(url + new URL(info.url).search);
      assert.equal(bootstrap.status, 200);
      const cookie = bootstrap.headers.get('set-cookie').split(';', 1)[0];
      const page = await get(url, { Cookie: cookie });
      assert.equal(page.status, 200);
      const body = await page.text();
      assert.ok(body.includes(`Dev Cycle v${version}`));
      assert.ok(body.includes('Extracted release smoke check'));
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
      await exit;
    }
  }
});
