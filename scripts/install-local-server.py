"""Reproduce/update the per-user macOS server. --dry-run changes nothing."""
import argparse
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
mode = parser.add_mutually_exclusive_group(required=True)
mode.add_argument('--dry-run', action='store_true')
mode.add_argument('--install', action='store_true')
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
destination = Path.home() / 'Library/Application Support/ClearTree'
agent = Path.home() / 'Library/LaunchAgents/io.clear-tree.local-server.plist'
label = 'io.clear-tree.local-server'
domain = f'gui/{os.getuid()}'
for name in ('manifest.json', 'App.css', 'index.js', 'index.html', 'inline_tree-sandbox.js'):
    if not (source / 'dist' / name).is_file():
        parser.error(f'Missing dist/{name}; build the plugin first.')
if sys.platform != 'darwin':
    parser.error('This installer is for macOS.')
config = {
    'Label': label,
    'ProgramArguments': [str(Path(sys.executable).resolve()), '-u', str(destination / 'serve.py')],
    'WorkingDirectory': str(destination),
    'RunAtLoad': True, 'KeepAlive': True, 'ThrottleInterval': 10,
    'ProcessType': 'Background',
    'StandardOutPath': str(destination / 'logs/server.stdout.log'),
    'StandardErrorPath': str(destination / 'logs/server.stderr.log'),
}
print(f'Files: {destination}\nLaunchAgent: {agent}\nPython: {config["ProgramArguments"][0]}')
if args.dry_run:
    print('Dry run only; no files or services changed.')
    sys.exit(0)
(destination / 'dist').mkdir(parents=True, exist_ok=True)
(destination / 'logs').mkdir(exist_ok=True)
agent.parent.mkdir(parents=True, exist_ok=True)
for item in [source / 'serve.py', *sorted((source / 'dist').iterdir())]:
    if not item.is_file():
        continue
    target = destination / ('dist/' + item.name if item.parent.name == 'dist' else item.name)
    temp = target.with_name(target.name + '.updating')
    shutil.copy2(item, temp)
    os.replace(temp, target)
temp_agent = agent.with_suffix('.plist.updating')
temp_agent.write_bytes(plistlib.dumps(config))
os.replace(temp_agent, agent)
loaded = subprocess.run(['launchctl', 'print', f'{domain}/{label}'], capture_output=True).returncode == 0
if loaded:
    subprocess.run(['launchctl', 'bootout', f'{domain}/{label}'], check=True)
subprocess.run(['launchctl', 'bootstrap', domain, str(agent)], check=True)
subprocess.run(['launchctl', 'print', f'{domain}/{label}'], check=True)
print('Installed. Check http://localhost:8080/manifest.json before using RemNote.')
