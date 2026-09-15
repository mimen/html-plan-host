import importlib.machinery
import importlib.util
import json
from pathlib import Path
import plistlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

TOOL = Path(__file__).resolve().parent.parent / 'bin/refresh-agent'
SPEC = importlib.util.spec_from_file_location(
    'refresh_agent', TOOL, loader=importlib.machinery.SourceFileLoader('refresh_agent', str(TOOL)))
REFRESH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REFRESH)

OLD = 'a' * 40
NEW = 'b' * 40
URL = 'https://plans.example'
TOKEN_REF = 'op://Test/Plan/token'


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.config = self.root / 'config.json'
        self.current = self.root / 'agent-current'
        self.commands = []
        for item in [patch.object(REFRESH, 'CONFIG', self.config),
                     patch.object(REFRESH, 'CURRENT', self.current),
                     patch.object(REFRESH, 'DATA', self.root / 'data'),
                     patch.object(REFRESH, 'LAUNCH_AGENTS', self.root / 'LaunchAgents')]:
            item.start()
            self.addCleanup(item.stop)

    def record(self, command, **kwargs):
        self.commands.append([str(part) for part in command])
        return subprocess.CompletedProcess(command, 0)

    def write_config(self, settings=None):
        self.config.write_text(json.dumps({'url': URL, 'tokenRef': TOKEN_REF} if settings is None else settings))

    def install_package(self, revision):
        (self.current / 'bin').mkdir(parents=True, exist_ok=True)
        (self.current / '.release-revision').write_text(revision + '\n')
        for tool in ['bootstrap-agent', 'refresh-agent']:
            (self.current / 'bin' / tool).write_text('#!/usr/bin/env python3\n')

    def refresh(self, tip):
        with patch.object(REFRESH, 'fetch_tip', return_value=tip), \
                patch.object(REFRESH.subprocess, 'run', self.record):
            return REFRESH.refresh()

    def test_matching_pin_leaves_the_host_untouched(self):
        self.write_config()
        self.install_package(OLD)
        self.assertEqual(self.refresh(OLD), 'up to date at ' + OLD)
        self.assertEqual(self.commands, [])
        self.assertEqual((self.current / '.release-revision').read_text(), OLD + '\n')

    def test_new_tip_installs_it_with_the_configured_url_and_token(self):
        self.write_config()
        self.install_package(OLD)
        self.assertEqual(self.refresh(NEW), 'updated {} -> {}'.format(OLD, NEW))
        self.assertEqual(self.commands, [['/usr/bin/python3', str(self.current / 'bin/bootstrap-agent'),
                                          '--revision', NEW, '--url', URL, '--token-ref', TOKEN_REF]])

    def test_missing_config_reports_the_config_step(self):
        self.install_package(OLD)
        with self.assertRaises(SystemExit) as caught:
            self.refresh(NEW)
        self.assertTrue(str(caught.exception).startswith('config: '), caught.exception)
        self.assertIn('bootstrap this host first', str(caught.exception))
        self.assertEqual(self.commands, [])

    def test_missing_package_reports_the_installed_step(self):
        self.write_config()
        with self.assertRaises(SystemExit) as caught:
            self.refresh(NEW)
        self.assertTrue(str(caught.exception).startswith('installed: '), caught.exception)
        self.assertIn('bootstrap this host first', str(caught.exception))
        self.assertEqual(self.commands, [])

    def test_install_schedules_the_hub_wrapped_hourly_job(self):
        self.install_package(OLD)
        hub = self.root / 'run'
        hub.write_text('#!/bin/zsh\n')
        with patch.object(REFRESH, 'HUB_RUN', hub), patch.object(REFRESH.subprocess, 'run', self.record):
            REFRESH.install('mini.launchd.html-plan-agent-refresh')
        plist = plistlib.loads((self.root / 'LaunchAgents' / (REFRESH.LABEL + '.plist')).read_bytes())
        self.assertEqual(plist['ProgramArguments'], ['/bin/zsh', str(hub), 'mini.launchd.html-plan-agent-refresh',
                                                     '--', '/usr/bin/python3', str(self.current / 'bin/refresh-agent')])
        self.assertEqual(plist['StartInterval'], 3600)
        self.assertEqual(plist['Label'], 'com.mimen.html-plan-host.agent-refresh')

    def test_install_refuses_a_plist_it_did_not_write(self):
        self.install_package(OLD)
        hub = self.root / 'run'
        hub.write_text('#!/bin/zsh\n')
        target = self.root / 'LaunchAgents' / (REFRESH.LABEL + '.plist')
        target.parent.mkdir(parents=True)
        foreign = {'Label': REFRESH.LABEL, 'ProgramArguments': ['/bin/echo', 'another-owner']}
        target.write_bytes(plistlib.dumps(foreign))
        with patch.object(REFRESH, 'HUB_RUN', hub), patch.object(REFRESH.subprocess, 'run', self.record):
            with self.assertRaises(SystemExit) as caught:
                REFRESH.install('mini.launchd.html-plan-agent-refresh')
        self.assertIn('belongs to another owner', str(caught.exception))
        self.assertEqual(plistlib.loads(target.read_bytes()), foreign)
        self.assertEqual(self.commands, [])


if __name__ == '__main__':
    unittest.main()
