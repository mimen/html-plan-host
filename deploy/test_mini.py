import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import io

SPEC = importlib.util.spec_from_file_location('mini_host', Path(__file__).with_name('mini-host.py'))
HOST = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HOST)
REPO = Path(__file__).resolve().parent.parent


class ActivationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.data = self.root / 'data'
        self.data.mkdir()
        self.patches = [patch.object(HOST, 'ROOT', self.root), patch.object(HOST, 'DATA', self.data),
                        patch.object(HOST, 'run'), patch.object(HOST, 'database'),
                        patch.object(HOST, 'backup'), patch.object(HOST, 'expose'),
                        patch.object(HOST.subprocess, 'run')]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)
        for revision in ['old', 'new']:
            release = self.root / 'releases' / revision
            release.mkdir(parents=True)
            (release / '.release-revision').write_text(revision)

    def test_database_reconciles_when_cluster_already_exists(self):
        (self.data / 'postgres').mkdir()
        (self.data / 'postgres/PG_VERSION').write_text('17')
        response = io.BytesIO(json.dumps({'revision': 'new'}).encode())
        with patch.object(HOST, 'load_job'), patch.object(HOST.urllib.request, 'urlopen', return_value=response):
            HOST.activate('new')
        HOST.database.assert_called_once()

    def test_bootstrap_failure_restores_previous_release(self):
        current = self.root / 'current'
        previous = self.root / 'releases/old'
        current.symlink_to(previous)
        with patch.object(HOST, 'load_job', side_effect=[RuntimeError('bootstrap failed'), None]) as jobs:
            with self.assertRaisesRegex(RuntimeError, 'bootstrap failed'):
                HOST.activate('new')
            self.assertEqual(jobs.call_count, 2)
        self.assertEqual(current.resolve(), previous)

    def test_first_bootstrap_failure_removes_failed_selection(self):
        with patch.object(HOST, 'load_job', side_effect=RuntimeError('bootstrap failed')):
            with self.assertRaisesRegex(RuntimeError, 'bootstrap failed'):
                HOST.activate('new')
        self.assertFalse((self.root / 'current').is_symlink())
        HOST.subprocess.run.assert_called()


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / 'home'
        self.home.mkdir()
        self.release = self.root / 'package'
        (self.release / 'bin').mkdir(parents=True)
        (self.release / '.release-revision').write_text('a' * 40)
        shutil.copy2(REPO / 'bin/install-agent', self.release / 'bin/install-agent')
        self.command = ['python3', str(self.release / 'bin/install-agent'), '--url', 'https://plans.example', '--token-ref', 'op://Test/Plan/token']

    def install(self):
        return subprocess.run(self.command, env={**os.environ, 'HOME': str(self.home)}, capture_output=True, text=True)

    def test_broken_config_symlink_is_not_followed(self):
        config = self.home / '.config/html-plan-host/config.json'
        config.parent.mkdir(parents=True)
        victim = self.root / 'must-not-exist'
        config.symlink_to(victim)
        self.assertNotEqual(self.install().returncode, 0)
        self.assertFalse(victim.exists())
        self.assertFalse((self.home / '.local/share/html-plan-host/agent-current').exists())

    def test_broken_launcher_symlink_is_not_followed(self):
        launcher = self.home / '.local/bin/html-plan'
        launcher.parent.mkdir(parents=True)
        victim = self.root / 'must-not-exist'
        launcher.symlink_to(victim)
        self.assertNotEqual(self.install().returncode, 0)
        self.assertFalse(victim.exists())

    def test_install_is_idempotent(self):
        self.assertEqual(self.install().returncode, 0)
        self.assertEqual(self.install().returncode, 0)
        config = json.loads((self.home / '.config/html-plan-host/config.json').read_text())
        self.assertEqual(config['tokenRef'], 'op://Test/Plan/token')
        self.assertEqual((self.home / '.codex/skills/html-plan').readlink(), self.home / '.local/share/html-plan-host/agent-current/skills/html-plan')


if __name__ == '__main__':
    unittest.main()
