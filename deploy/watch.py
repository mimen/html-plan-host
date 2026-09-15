#!/usr/bin/env python3
"""Pull-based deploy watcher for html-plan-host, run resident on the Mini.

Every tick: fetch the clone at ~/Programming/Repos/html-plan-host, resolve
origin/main, and if that sha is not the one already recorded as fully
deployed, stage it into releases/<sha> the way bin/mini does and hand it to
deploy/mini-host.py activate. The sha is recorded only after activation exits
zero, so any failure retries the entire chain on the next tick.

The recorded sha is the record of intent, not the `current` symlink. A manual
`bin/mini deploy <older-sha>` is the documented rollback path, so the watcher
must not undo it. It reports the disagreement as `diverged` and leaves it
alone rather than redeploying main over a deliberate rollback.

activate takes a non-blocking flock, so a manual bin/mini deploy in flight
makes it exit nonzero. That is an ordinary failed tick here, not a crash.
"""

import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback

IDENTITY = 'html-plan-host:deploy-watch@personal'
HOME = Path.home()
CLONE = HOME / 'Programming/Repos/html-plan-host'
ROOT = HOME / 'Programming/Deployments/html-plan-host'
RELEASES = ROOT / 'releases'
DATA = HOME / '.local/share/html-plan-host'
STATUS = DATA / 'deploy-status.json'
GIT = '/usr/bin/git'
TAR = '/usr/bin/tar'
PYTHON = '/usr/bin/python3'
COMMIT = re.compile('[0-9a-f]{40}')
INTERVAL = float(os.environ.get('HTML_PLAN_WATCH_INTERVAL', 60))


class StepError(Exception):
    def __init__(self, step, message):
        super().__init__(message)
        self.step = step


def run(step, args, input=None):
    command = [str(a) for a in args]
    done = subprocess.run(command, input=input, capture_output=True)
    if done.returncode:
        tail = (done.stdout + done.stderr).decode('utf-8', 'replace').strip()[-2000:]
        raise StepError(step, '{}: {} exited {}\n{}'.format(step, ' '.join(command), done.returncode, tail))
    return done.stdout


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def read_status():
    try:
        return json.loads(STATUS.read_text())
    except (OSError, ValueError):
        return {}


def write_status(previous, status, sha, **fields):
    record = {'status': status, 'sha': sha, 'step': None, 'error': None,
              'deployed_sha': previous.get('deployed_sha'),
              'deployed_at': previous.get('deployed_at')}
    record.update(fields)
    record['checked_at'] = now()
    DATA.mkdir(parents=True, exist_ok=True)
    pending = STATUS.with_suffix('.pending')
    pending.write_text(json.dumps(record, indent=2) + '\n')
    os.replace(pending, STATUS)
    print(json.dumps(record), flush=True)
    return record


def live_sha():
    """What `current` actually points at, which a manual deploy can move."""
    try:
        value = (ROOT / 'current' / '.release-revision').read_text().strip()
    except OSError:
        return None
    return value if COMMIT.fullmatch(value) else None


def stage_release(sha):
    release = RELEASES / sha
    marker = release / '.release-revision'
    if release.exists():
        if not marker.is_file() or marker.read_text().strip() != sha:
            raise StepError('stage', 'stage: {} exists and is not a prepared release for {}'.format(release, sha))
        return release
    RELEASES.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.stage.', dir=RELEASES))
    try:
        run('stage', [TAR, '-xf', '-', '-C', stage], input=run('stage', [GIT, '-C', CLONE, 'archive', sha]))
        (stage / '.release-revision').write_text(sha + '\n')
        os.rename(stage, release)
    except BaseException:
        shutil.rmtree(stage, ignore_errors=True)
        raise
    return release


def tick():
    previous = read_status()
    observed = None
    try:
        run('fetch', [GIT, '-C', CLONE, 'fetch', '--quiet', 'origin', 'main'])
        observed = run('resolve', [GIT, '-C', CLONE, 'rev-parse', '--verify', 'origin/main^{commit}']).decode().strip()
        if not COMMIT.fullmatch(observed):
            raise StepError('resolve', 'resolve: origin/main did not resolve to a commit: ' + observed[:200])
        # The LaunchAgent runs this file out of the clone, so keeping the clone on
        # main is what lets this watcher's own source update with the repo.
        if run('head', [GIT, '-C', CLONE, 'rev-parse', '--verify', 'HEAD']).decode().strip() != observed:
            run('sync', [GIT, '-C', CLONE, 'merge', '--ff-only', 'origin/main'])
        if observed == previous.get('deployed_sha'):
            current = live_sha()
            if current and current != observed:
                return write_status(previous, 'diverged', observed, step='compare',
                                    error='current is {} but origin/main is {}; leaving the manual deploy in place'.format(current, observed))
            return write_status(previous, 'healthy', observed)
        write_status(previous, 'deploying', observed, step='stage')
        release = stage_release(observed)
        write_status(previous, 'deploying', observed, step='activate')
        run('activate', [PYTHON, release / 'deploy/mini-host.py', 'activate', observed])
        return write_status(previous, 'healthy', observed, deployed_sha=observed, deployed_at=now())
    except Exception as failure:
        return write_status(previous, 'failed', observed or previous.get('deployed_sha'),
                            step=getattr(failure, 'step', 'watch'), error=str(failure)[-2000:])


def demo():
    global CLONE, ROOT, RELEASES, DATA, STATUS, run
    root = Path(tempfile.mkdtemp(prefix='deploy-watch-demo.'))
    CLONE, ROOT, DATA = root / 'clone', root / 'deploy', root / 'data'
    RELEASES = ROOT / 'releases'
    STATUS = DATA / 'deploy-status.json'
    first_sha, second_sha, corrupt_sha = 'a' * 40, 'b' * 40, 'c' * 40
    remote = {'sha': first_sha}
    activate_fails = {'now': True}

    def fake_run(step, args, input=None):
        if step in ('resolve', 'head'):
            return (remote['sha'] + '\n').encode()
        if step == 'activate' and activate_fails['now']:
            raise StepError('activate', 'activate: exited 1\nBlockingIOError: [Errno 35] Resource temporarily unavailable')
        return b''

    run = fake_run
    try:
        failed = tick()
        assert failed['status'] == 'failed', failed
        assert failed['step'] == 'activate', failed
        assert failed['deployed_sha'] is None, failed
        assert 'Resource temporarily unavailable' in failed['error'], failed
        assert (RELEASES / first_sha / '.release-revision').read_text() == first_sha + '\n'

        activate_fails['now'] = False
        deployed = tick()
        assert deployed['status'] == 'healthy', deployed
        assert deployed['deployed_sha'] == first_sha, deployed
        assert deployed['deployed_at'], deployed

        idle = tick()
        assert idle['status'] == 'healthy', idle
        assert idle['deployed_at'] == deployed['deployed_at'], idle
        assert idle['checked_at'] >= deployed['checked_at'], idle

        remote['sha'] = second_sha
        moved = tick()
        assert moved['deployed_sha'] == second_sha, moved
        assert (RELEASES / second_sha / '.release-revision').read_text() == second_sha + '\n'

        # A manual rollback moved `current`. Report it; do not redeploy over it.
        (ROOT / 'current').mkdir(parents=True, exist_ok=True)
        (ROOT / 'current' / '.release-revision').write_text(first_sha + '\n')
        diverged = tick()
        assert diverged['status'] == 'diverged', diverged
        assert diverged['deployed_sha'] == second_sha, diverged
        assert first_sha in diverged['error'], diverged
        shutil.rmtree(ROOT / 'current')

        (RELEASES / corrupt_sha).mkdir()
        (RELEASES / corrupt_sha / '.release-revision').write_text('d' * 40 + '\n')
        remote['sha'] = corrupt_sha
        rejected = tick()
        assert rejected['status'] == 'failed', rejected
        assert rejected['step'] == 'stage', rejected
        assert rejected['deployed_sha'] == second_sha, rejected

        assert json.loads(STATUS.read_text()) == rejected
        assert [p.name for p in RELEASES.iterdir() if p.name.startswith('.stage.')] == []
        print('self-check passed')
    finally:
        shutil.rmtree(root, ignore_errors=True)


if __name__ == '__main__':
    if '--self-check' in sys.argv:
        demo()
        raise SystemExit(0)
    # ps shows this process as the interpreter, not as IDENTITY: /usr/bin/python3 is a
    # shim that re-execs the framework binary and overwrites argv[0] with its own path,
    # discarding whatever argv[0] this process or its launcher supplied. serve.zsh's
    # `exec -a` works because bun is a plain binary. The log line below is the identity.
    print(IDENTITY, flush=True)
    once = '--once' in sys.argv
    while True:
        try:
            record = tick()
        except Exception:
            traceback.print_exc()
            record = None
        if once:
            raise SystemExit(0 if record and record['status'] == 'healthy' else 1)
        time.sleep(INTERVAL)
