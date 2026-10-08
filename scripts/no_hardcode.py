from pathlib import Path
import re, sys, json

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT/'packages', ROOT/'apps']
# Domain-sensitive patterns. This is intentionally contextual and excludes docs/config/data/tests.
PATTERNS = [
    ('election-year-literal', re.compile(r"['\"](?:20(?:1[0-9]|2[0-9]|3[0-9]))['\"]")),
    ('ballot-number-key', re.compile(r"(?:candidate|ballot|party).{0,24}['\"](?:1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])['\"]", re.I)),
    ('municipality-slug', re.compile(r'jaragua[-_ ]do[-_ ]sul', re.I)),
    ('political-name', re.compile(r'\b(?:Lula|Bolsonaro|Flávio Bolsonaro)\b', re.I)),
]

violations=[]
for base in TARGETS:
    if not base.exists(): continue
    for path in base.rglob('*'):
        if any(part in {'node_modules', 'dist', 'test-results', 'playwright-report', 'e2e'} for part in path.parts) or '.test.' in path.name: continue
        if path.suffix not in {'.ts','.tsx','.js','.jsx'} or not path.is_file(): continue
        text=path.read_text(encoding='utf-8')
        for line_no,line in enumerate(text.splitlines(),1):
            for rule,rx in PATTERNS:
                if rx.search(line):
                    violations.append((path.relative_to(ROOT), line_no, rule, line.strip()))

if violations:
    for v in violations:
        print(f'{v[0]}:{v[1]} [{v[2]}] {v[3]}', file=sys.stderr)
    raise SystemExit(1)
print('no-hardcode: OK')
