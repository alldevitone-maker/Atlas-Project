from pathlib import Path
import json, sys
from jsonschema import Draft202012Validator, FormatChecker
ROOT=Path(__file__).resolve().parents[1]
schema=json.loads((ROOT/'schemas/dataset.schema.json').read_text())
validator=Draft202012Validator(schema, format_checker=FormatChecker())
files=sorted((ROOT/'data/territories').rglob('*.dataset.json'))
fail=[]
for path in files:
    errors=list(validator.iter_errors(json.loads(path.read_text())))
    if errors: fail.append(f'{path.relative_to(ROOT)}: {errors[0].message}')
if fail:
    print('\n'.join(fail),file=sys.stderr); raise SystemExit(1)
print(f'generated datasets: OK ({len(files)})')
