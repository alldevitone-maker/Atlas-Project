from pathlib import Path
import json, sys, hashlib
from jsonschema import Draft202012Validator, FormatChecker
ROOT=Path(__file__).resolve().parents[1]
schema=json.loads((ROOT/'schemas/dataset.schema.json').read_text())
validator=Draft202012Validator(schema, format_checker=FormatChecker())
files=sorted((ROOT/'data/territories').rglob('*.dataset.json'))
fail=[]
for path in files:
    descriptor=json.loads(path.read_text())
    errors=list(validator.iter_errors(descriptor))
    payload=path.parent/descriptor['uri']
    if not payload.is_file() or hashlib.sha256(payload.read_bytes()).hexdigest()!=descriptor['checksum']:
        fail.append(f'{path.relative_to(ROOT)}: missing payload or checksum mismatch')
    if errors: fail.append(f'{path.relative_to(ROOT)}: {errors[0].message}')
if fail:
    print('\n'.join(fail),file=sys.stderr); raise SystemExit(1)
print(f'generated datasets: OK ({len(files)})')
