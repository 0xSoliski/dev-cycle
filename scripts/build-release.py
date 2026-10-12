#!/usr/bin/env python3
"""Build deterministic, client-specific plugin ZIPs from the working tree."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import stat
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'plugins/dev-cycle'
CLIENTS = {
    'codex': ('.agents/plugins/marketplace.json', '.codex-plugin'),
    'claude-code': ('.claude-plugin/marketplace.json', '.claude-plugin'),
}
EXCLUDED = {'.git', '.dev-cycle', 'node_modules', '__pycache__', '.DS_Store'}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_file(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError(f'Expected a regular, non-symlink file: {path}')
    return path.read_bytes()


def install_readme(client, version, folder):
    label = 'Codex' if client == 'codex' else 'Claude Code'
    if client == 'codex':
        install = '''From the extracted directory, run:

```bash
codex plugin marketplace add "$PWD"
codex plugin add dev-cycle@dev-cycle
codex plugin list --marketplace dev-cycle --json
```

Start a new Codex task to load the installed skills. The configuration directory
must be writable; do not redirect CODEX_HOME and mistake that for updating the
active client.
'''
    else:
        install = '''Inside Claude Code, register the absolute path to this extracted directory:

```text
/plugin marketplace add /absolute/path/to/EXTRACTED_DIRECTORY
/plugin install dev-cycle@dev-cycle
```

Start a new session, then use `/dev-cycle:brainstorming` or another bundled skill.
For a session-only local trial, run from the extracted directory:

```bash
claude --plugin-dir ./plugins/dev-cycle
```
'''.replace('EXTRACTED_DIRECTORY', folder)
    return f'''# Dev Cycle {version} for {label}

Extract `{folder}.zip` completely, including hidden manifest directories.
Keep the extracted directory: it is the local marketplace source.

{install}
If `dev-cycle` is already registered at another path, inspect the client's
marketplace list and deliberately switch that registration before installing.
The two bundles target separate clients; each uses the name `dev-cycle`.

The plugin contains 19 skills, shared references, and runtime helpers. See
`RELEASE_NOTES.md` for requirements and changes, and
`plugins/dev-cycle/THIRD_PARTY_SOURCES.md` for attribution. The preserved MIT
license texts are under `plugins/dev-cycle/licenses/`.

No package installation or model API call is needed to unpack this bundle.
`BUNDLE.json` lists every payload file's SHA-256 hash (excluding itself).
Use the separately supplied `SHA256SUMS` to verify the downloaded ZIP before
extracting it; the internal inventory is an integrity check, not a signature.
'''.encode()


def build(client, version):
    marketplace_path, manifest_dir = CLIENTS[client]
    folder = f'dev-cycle-{client}-{version}'
    files = {}
    manifest = json.loads(read_file(PLUGIN / manifest_dir / 'plugin.json'))
    marketplace_data = read_file(ROOT / marketplace_path)
    marketplace = json.loads(marketplace_data)
    entries = marketplace['plugins']
    if len(entries) != 1 or entries[0]['name'] != manifest['name']:
        raise ValueError('Marketplace must select the dev-cycle plugin')
    source = entries[0]['source']
    source_path = source['path'] if isinstance(source, dict) else source
    if source_path != './plugins/dev-cycle' or manifest['skills'] != './skills/':
        raise ValueError('Unexpected marketplace or skills path')

    def add(path, data):
        files[path] = (data, 0o755 if data.startswith(b'#!') else 0o644)

    add(marketplace_path, marketplace_data)
    add(f'plugins/dev-cycle/{manifest_dir}/plugin.json', read_file(PLUGIN / manifest_dir / 'plugin.json'))
    add('plugins/dev-cycle/THIRD_PARTY_SOURCES.md', read_file(PLUGIN / 'THIRD_PARTY_SOURCES.md'))
    for directory in ['skills', 'references', 'licenses']:
        base = PLUGIN / directory
        if base.is_symlink():
            raise ValueError(f'Symlinked package directory: {base}')
        for path in sorted(base.rglob('*')):
            relative = path.relative_to(PLUGIN)
            if any(part in EXCLUDED for part in relative.parts):
                continue
            if path.is_symlink():
                raise ValueError(f'Symlinked package entry: {path}')
            if path.is_file():
                add('plugins/dev-cycle/' + relative.as_posix(), read_file(path))
    skills = sorted(path.split('/')[-2] for path in files if path.endswith('/SKILL.md'))
    if len(skills) != 19:
        raise ValueError(f'Expected 19 skills, found {len(skills)}')
    add('README.md', install_readme(client, version, folder))
    notes = read_file(ROOT / 'RELEASE_NOTES.md')
    if not notes.startswith(f'# Dev Cycle {version} '.encode()):
        raise ValueError('Release notes do not match the plugin version')
    add('RELEASE_NOTES.md', notes)
    inventory = {
        'name': 'dev-cycle', 'version': version, 'client': client,
        'source': 'working-tree', 'skills': skills,
        'files': {name: sha256(data) for name, (data, _) in sorted(files.items())},
    }
    add('BUNDLE.json', (json.dumps(inventory, indent=2, sort_keys=True) + '\n').encode())
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, (data, mode) in sorted(files.items()):
            entry = zipfile.ZipInfo(f'{folder}/{name}', date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = (stat.S_IFREG | mode) << 16
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, data, compresslevel=9)
    return f'{folder}.zip', buffer.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, help='Default: dist/<version>')
    parser.add_argument('--force', action='store_true', help='Replace existing artifacts with different contents')
    args = parser.parse_args()
    manifests = [json.loads(read_file(PLUGIN / dirname / 'plugin.json')) for _, dirname in CLIENTS.values()]
    for field in ('name', 'version', 'description', 'author', 'skills'):
        if manifests[0][field] != manifests[1][field]:
            raise ValueError(f'Client metadata differs: {field}')
    version = manifests[0]['version']
    if manifests[0]['name'] != 'dev-cycle' or not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Unexpected plugin name or version')
    artifacts = dict(build(client, version) for client in CLIENTS)
    artifacts['SHA256SUMS'] = ''.join(f'{sha256(data)}  {name}\n' for name, data in sorted(artifacts.items())).encode()
    artifacts['RELEASE_NOTES.md'] = read_file(ROOT / 'RELEASE_NOTES.md')
    output = args.output_dir or ROOT / 'dist' / version
    output.mkdir(parents=True, exist_ok=True)
    for name, data in artifacts.items():
        target = output / name
        if target.is_symlink():
            raise ValueError(f'Refusing symlink output: {target}')
        if target.exists() and target.read_bytes() != data and not args.force:
            raise ValueError(f'Artifact already exists with different contents: {target}; use --force to replace intentionally')
    for name, data in artifacts.items():
        target = output / name
        temporary = output / (name + '.tmp')
        with temporary.open('xb') as stream:
            stream.write(data)
        os.replace(temporary, target)
        print(f'{target}: {len(data)} bytes')


if __name__ == '__main__':
    main()
