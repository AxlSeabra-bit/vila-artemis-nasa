"""Check that distributable packages contain the exact final web build."""
from pathlib import Path
from zipfile import ZipFile
import hashlib

root = Path(__file__).resolve().parent.parent
packages = [
    ('android/app/build/outputs/apk/debug/app-debug.apk', 'assets/public/'),
    ('android/app/build/outputs/bundle/release/app-release.aab', 'base/assets/public/'),
]
for relative, prefix in packages:
    path = root / relative
    with ZipFile(path) as archive:
        assert archive.testzip() is None, f'Corrupt archive: {relative}'
        files = [p for p in (root/'dist').rglob('*') if p.is_file()]
        for source in files:
            entry = prefix + source.relative_to(root/'dist').as_posix()
            assert archive.read(entry) == source.read_bytes(), f'Outdated asset: {entry}'
        signatures = [n for n in archive.namelist() if n.upper().startswith('META-INF/') and n.upper().endswith(('.RSA','.DSA','.EC','.SF'))]
        if path.suffix == '.aab':
            assert not signatures, 'Unexpected release signing configuration'
    print(f'{path.name}: {len(files)} web files match, {path.stat().st_size} bytes, SHA-256 {hashlib.sha256(path.read_bytes()).hexdigest()}')
print('ANDROID PACKAGE CHECKS PASSED; release bundle requires owner signing')
