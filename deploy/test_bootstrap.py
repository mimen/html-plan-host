import importlib.machinery
import importlib.util
import io
from pathlib import Path
import subprocess
import tarfile
import unittest

REPO = Path(__file__).resolve().parent.parent
TOOL = REPO / 'bin/bootstrap-agent'
SPEC = importlib.util.spec_from_file_location(
    'bootstrap_agent', TOOL, loader=importlib.machinery.SourceFileLoader('bootstrap_agent', str(TOOL)))
BOOTSTRAP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BOOTSTRAP)

TOPLEVEL = subprocess.run(['git', '-C', str(REPO), 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
IN_GIT = TOPLEVEL and Path(TOPLEVEL).resolve() == REPO


def crafted(*members):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w:gz') as archive:
        for member in members:
            archive.addfile(member, io.BytesIO(b'x') if member.isfile() else None)
    return tarfile.open(fileobj=io.BytesIO(buffer.getvalue()), mode='r:gz')


def entry(name, kind=tarfile.REGTYPE, target=''):
    member = tarfile.TarInfo(name)
    member.type, member.linkname = kind, target
    member.size = 1 if kind == tarfile.REGTYPE else 0
    return member


class ArchiveCheckTests(unittest.TestCase):
    @unittest.skipUnless(IN_GIT, 'needs the git checkout the package is archived from')
    def test_package_archive_of_head_passes_the_path_check(self):
        payload = subprocess.run(['git', '-C', str(REPO), 'archive', '--format=tar.gz', '--prefix=pkg/', 'HEAD'],
                                 capture_output=True, check=True).stdout
        with tarfile.open(fileobj=io.BytesIO(payload), mode='r:gz') as archive:
            names = [member.name for member in BOOTSTRAP.checked_members(archive)]
        self.assertIn('pkg/bin/install-agent', names)

    def test_unsafe_members_are_still_rejected(self):
        for unsafe in [entry('pkg/link', tarfile.SYMTYPE, '../../etc'),
                       entry('pkg/hard', tarfile.LNKTYPE, 'pkg/file'),
                       entry('pkg/../escape'),
                       entry('/etc/passwd'),
                       entry('other/file'),
                       entry('pkg/fifo', tarfile.FIFOTYPE)]:
            with self.subTest(unsafe.name), crafted(entry('pkg', tarfile.DIRTYPE), entry('pkg/file'), unsafe) as archive:
                with self.assertRaisesRegex(SystemExit, 'unsupported paths or links'):
                    BOOTSTRAP.checked_members(archive)


if __name__ == '__main__':
    unittest.main()
