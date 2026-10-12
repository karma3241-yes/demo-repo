"""Package the separate solo sandbox and verify the original multiplayer ZIP."""
from pathlib import Path
import hashlib,json,zipfile,sys,re
tools=Path(__file__).resolve().parent
root=tools.parent.parent
original=root/'dist/skyline-guardian-playgama.zip'
expected='e716b388dbeb91f28dddd9c99cf95248692c6be86d4b02148e4a22a73c657f94'
assert hashlib.sha256(original.read_bytes()).hexdigest()==expected
dist=root/'dist/playgama-sandbox'
version=sys.argv[1] if len(sys.argv)>1 else '2026.10.12.1'
assert re.fullmatch(r'[A-Za-z0-9.-]+',version), 'Use a Latin build version'
archive=root/f'dist/skyline-guardian-playgama-sandbox-{version}.zip'
files=[dist/'index.html',dist/'playgama-bridge-config.json']+sorted(p for p in (dist/'assets').rglob('*') if p.is_file())
assert all(p.is_file() for p in files), 'Build the solo sandbox before packaging it'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in files:z.write(p,p.relative_to(dist).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert all(z.read(p.relative_to(dist).as_posix())==p.read_bytes() for p in files)
record={'archive':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'entries':[p.relative_to(dist).as_posix() for p in files],'originalMultiplayerArchiveUnchanged':True}
(tools/'evidence/sandbox-package.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print(json.dumps(record,indent=2))
