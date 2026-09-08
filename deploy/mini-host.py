#!/usr/bin/env python3
import datetime
import json
import os
from pathlib import Path
import plistlib
import socket
import subprocess
import sys
import urllib.request

HOME = Path.home()
ROOT = HOME / 'Programming/Deployments/html-plan-host'
DATA = HOME / '.local/share/html-plan-host'
PG = Path('/opt/homebrew/opt/postgresql@17/bin')
LABEL = 'com.mimen.html-plan-host'
PG_LABEL = LABEL + '.postgres'
DOMAIN = f'gui/{os.getuid()}'


def run(*args, **kwargs):
    return subprocess.run([str(a) for a in args], check=True, **kwargs)


def load_job(label, arguments, restart=False):
    target = HOME / 'Library/LaunchAgents' / (label + '.plist')
    config = {'Label': label, 'ProgramArguments': [str(a) for a in arguments],
              'RunAtLoad': True, 'KeepAlive': True, 'ThrottleInterval': 15,
              'StandardOutPath': str(DATA / (label + '.log')),
              'StandardErrorPath': str(DATA / (label + '.error.log'))}
    if target.exists():
        previous = plistlib.loads(target.read_bytes())
        if previous.get('Label') != label or previous.get('StandardOutPath') != config['StandardOutPath']:
            raise SystemExit(f'Unrecognized service definition: {target}')
        loaded = subprocess.run(['/bin/launchctl', 'print', DOMAIN + '/' + label], capture_output=True)
        if not restart and previous == config and loaded.returncode == 0:
            return
        subprocess.run(['/bin/launchctl', 'bootout', DOMAIN, str(target)], capture_output=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(plistlib.dumps(config))
    run('/bin/launchctl', 'bootstrap', DOMAIN, target)


def check_database():
    result = run(PG / 'psql', '-h', '127.0.0.1', '-p', '5490', '-d', 'postgres', '-Atc',
                 'SHOW cluster_name', capture_output=True, text=True)
    if result.stdout.strip() != 'html-plan-host:postgres@personal':
        raise SystemExit('Port 5490 does not belong to the personal plan database')


def database():
    DATA.mkdir(parents=True, exist_ok=True, mode=0o700)
    cluster = DATA / 'postgres'
    if not cluster.exists():
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 5490))
        run(PG / 'initdb', '-D', cluster, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=trust')
    elif not (cluster / 'PG_VERSION').exists():
        raise SystemExit(f'Unrecognized database directory: {cluster}')
    load_job(PG_LABEL, ['/bin/zsh', '-c', 'exec -a html-plan-host:postgres@personal "$@"',
                        'html-plan-host:postgres@personal', PG / 'postgres', '-D', cluster,
                        '-h', '127.0.0.1', '-p', '5490', '-k', DATA,
                        '-c', 'cluster_name=html-plan-host:postgres@personal'])
    import time
    for _ in range(30):
        if subprocess.run([str(PG / 'pg_isready'), '-h', '127.0.0.1', '-p', '5490'], capture_output=True).returncode == 0:
            break
        time.sleep(1)
    else:
        raise SystemExit('Postgres did not become ready')
    check_database()
    result = run(PG / 'psql', '-h', '127.0.0.1', '-p', '5490', '-d', 'postgres', '-Atc',
                 "SELECT 1 FROM pg_database WHERE datname='html_plan_host'", capture_output=True, text=True)
    if result.stdout.strip() != '1':
        run(PG / 'createdb', '-h', '127.0.0.1', '-p', '5490', 'html_plan_host')


def backup():
    check_database()
    folder = DATA / 'backups'
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    target = folder / (stamp + '.dump')
    run(PG / 'pg_dump', '-h', '127.0.0.1', '-p', '5490', '-Fc', '-f', target, 'html_plan_host')
    run(PG / 'pg_restore', '--list', target, stdout=subprocess.DEVNULL)
    target.chmod(0o600)
    print(target)


def activate(revision):
    release = ROOT / 'releases' / revision
    if not (release / '.release-revision').is_file() or (release / '.release-revision').read_text().strip() != revision:
        raise SystemExit('Release is not prepared')
    run(HOME / '.bun/bin/bun', 'install', '--frozen-lockfile', cwd=release)
    run(HOME / '.bun/bin/bun', 'run', 'typecheck', cwd=release)
    run(HOME / '.bun/bin/bun', 'test', cwd=release)
    run('/usr/bin/python3', '-m', 'unittest', 'discover', '-s', 'deploy', '-p', 'test_*.py', cwd=release)
    database()
    backup()
    current = ROOT / 'current'
    if current.exists() and not current.is_symlink():
        raise SystemExit('Refusing to replace a non-symlink current path')
    if current.is_symlink() and (current.resolve().parent != ROOT / 'releases' or not (current.resolve() / '.release-revision').is_file()):
        raise SystemExit('Current link does not reference a recognized release')
    previous = current.resolve() if current.exists() else None
    pending = ROOT / 'current.pending'
    if pending.is_symlink():
        pending.unlink()
    pending.symlink_to(release)
    pending.replace(current)
    try:
        load_job(LABEL, ['/bin/zsh', current / 'deploy/serve.zsh'], restart=True)
        import time
        for _ in range(45):
            try:
                live = json.load(urllib.request.urlopen('http://127.0.0.1:3490/version', timeout=2))
                if live.get('revision') == revision:
                    expose()
                    print(json.dumps(live))
                    return
            except (OSError, ValueError):
                pass
            time.sleep(1)
        raise RuntimeError('Candidate did not report the expected release')
    except BaseException:
        subprocess.run(['/bin/launchctl', 'bootout', DOMAIN + '/' + LABEL], capture_output=True)
        current.unlink()
        if previous:
            current.symlink_to(previous)
            load_job(LABEL, ['/bin/zsh', current / 'deploy/serve.zsh'], restart=True)
        raise


def expose():
    raw = run('/opt/homebrew/bin/tailscale', 'serve', 'status', '--json', capture_output=True, text=True)
    status = json.loads(raw.stdout)
    if any(key.endswith(':8490') for key in status.get('Web', {})):
        hosts = [v for k, v in status['Web'].items() if k.endswith(':8490')]
        if any(v.get('Handlers', {}).get('/', {}).get('Proxy') != 'http://127.0.0.1:3490' for v in hosts):
            raise SystemExit('Tailscale port 8490 already belongs to another service')
    if any(enabled for key, enabled in status.get('AllowFunnel', {}).items() if key.endswith(':8490')):
        raise SystemExit('Port 8490 is public; refusing to adopt it')
    run('/opt/homebrew/bin/tailscale', 'serve', '--bg', '--https=8490', 'http://127.0.0.1:3490')


if __name__ == '__main__':
    os.umask(0o077)
    command = sys.argv[1]
    if command == 'activate':
        import fcntl
        DATA.mkdir(parents=True, exist_ok=True, mode=0o700)
        with (DATA / 'deploy.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            activate(sys.argv[2])
    elif command == 'backup':
        backup()
    elif command == 'status':
        for label in [LABEL, PG_LABEL]:
            run('/bin/launchctl', 'print', DOMAIN + '/' + label)
        run('/opt/homebrew/bin/tailscale', 'serve', 'status')
    else:
        raise SystemExit('Expected activate <revision>, backup, or status')
