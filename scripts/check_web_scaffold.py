from __future__ import annotations
from pathlib import Path
import json, unicodedata

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'apps' / 'web'
PUBLIC = WEB / 'public'


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def norm(value: object) -> str:
    text = str(value or '').strip().upper()
    return ''.join(ch for ch in unicodedata.normalize('NFD', text) if unicodedata.category(ch) != 'Mn')

required = [
    WEB/'package.json', WEB/'index.html', WEB/'vite.config.ts', WEB/'tsconfig.json',
    WEB/'src'/'main.tsx', WEB/'src'/'App.tsx', WEB/'src'/'components'/'AtlasMap.tsx',
    PUBLIC/'registry.json'
]
missing=[str(p.relative_to(ROOT)) for p in required if not p.exists()]
if missing:
    raise SystemExit('web scaffold missing: ' + ', '.join(missing))

pkg=load(WEB/'package.json')
for dep in ['react','react-dom','maplibre-gl','zod']:
    if dep not in pkg.get('dependencies',{}):
        raise SystemExit(f'web dependency missing: {dep}')
for dep in ['vite','@vitejs/plugin-react','typescript','vitest']:
    if dep not in pkg.get('devDependencies',{}):
        raise SystemExit(f'web devDependency missing: {dep}')

registry=load(PUBLIC/'registry.json')
locale=registry['app']['locale']
catalog=load(PUBLIC/'locales'/f'{locale}.json')
keys=[registry['app']['titleKey'],registry['app']['subtitleKey'],registry['territory']['labelKey'],registry['module']['labelKey'],registry['metric']['labelKey']]
keys += [d['labelKey'] for d in registry['datasets']]
missing_keys=sorted({k for k in keys if k not in catalog})
if missing_keys:
    raise SystemExit('missing i18n keys: '+', '.join(missing_keys))

geometry=load(PUBLIC/'data'/'territory.geojson')
geom_field=registry['territory']['geometryLabelField']
geometry_labels={norm(f.get('properties',{}).get(geom_field)) for f in geometry.get('features',[])}

audit=[]
for ref in registry['datasets']:
    descriptor_path=PUBLIC/ref['descriptorUri'].removeprefix('./')
    data_path=PUBLIC/ref['dataUri'].removeprefix('./')
    descriptor=load(descriptor_path)
    dataset=load(data_path)
    if descriptor['id'] != ref['id']:
        raise SystemExit(f"descriptor id mismatch: {ref['id']}")
    if ref.get('candidateCatalogUri'):
        candidate_path=PUBLIC/ref['candidateCatalogUri'].removeprefix('./')
        load(candidate_path)
    dataset_field=registry['join']['datasetField']
    rows=dataset.get('rows',[])
    source_labels={norm(row.get(dataset_field)) for row in rows}
    matched=geometry_labels & source_labels
    audit.append({
        'datasetId': ref['id'],
        'revision': descriptor['revision'],
        'status': descriptor['status'],
        'geometryFeatures': len(geometry_labels),
        'sourceRows': len(source_labels),
        'matchedLabels': len(matched),
        'geometryCoveragePct': round((len(matched)/len(geometry_labels)*100) if geometry_labels else 0,4),
        'sourceCoveragePct': round((len(matched)/len(source_labels)*100) if source_labels else 0,4),
        'joinStrategy': registry['join']['strategy'],
        'prototype': registry['join']['prototype'],
    })

out=ROOT/'docs'/'web-fixture-audit.json'
out.write_text(json.dumps({'datasets':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'web scaffold: OK ({len(audit)} datasets; audit={out.relative_to(ROOT)})')
for row in audit:
    print(f"  {row['datasetId']}: {row['matchedLabels']}/{row['geometryFeatures']} geometry labels")
