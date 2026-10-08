from pathlib import Path
import json, sys
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / 'schemas'
FIXTURES = ROOT / 'tests' / 'fixtures' / 'contracts'
checker = FormatChecker()

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

schema_cache = {p.name.replace('.schema.json',''): load(p) for p in SCHEMAS.glob('*.schema.json')}

failures = []
for fixture in sorted(FIXTURES.glob('valid-*.json')):
    key = fixture.stem[len('valid-'):]
    schema = schema_cache[key]
    errors = list(Draft202012Validator(schema, format_checker=checker).iter_errors(load(fixture)))
    if errors:
        failures.append(f'{fixture.name} expected valid: {errors[0].message}')

invalid_cases = {
    'invalid-dataset-missing-revision.json':'dataset',
    'invalid-crosswalk-confidence.json':'crosswalk',
    'invalid-crosswalk-reviewed-without-evidence.json':'crosswalk',
    'invalid-dataset-official-without-proof.json':'dataset',
}
for filename, key in invalid_cases.items():
    errors = list(Draft202012Validator(schema_cache[key], format_checker=checker).iter_errors(load(FIXTURES/filename)))
    if not errors:
        failures.append(f'{filename} expected invalid but passed')

if failures:
    print('\n'.join(failures), file=sys.stderr)
    raise SystemExit(1)
print(f'contracts: OK ({len(list(FIXTURES.glob("valid-*.json")))} valid + {len(invalid_cases)} invalid fixtures)')
