from pathlib import Path
import json, hashlib, datetime, argparse
parser=argparse.ArgumentParser()
parser.add_argument("--input", type=Path)
parser.add_argument("--output", type=Path)
args=parser.parse_args()

ROOT = Path(__file__).resolve().parents[2]
LEGACY = args.input or ROOT/'data/raw/legacy-baseline/jaragua-atlas/data/election-2022-local.json'
OUTDIR = args.output or ROOT/'data/territories/br/sc/jaragua-do-sul/elections'
if not LEGACY.is_file():
    raise SystemExit(f"Missing legacy input: {LEGACY}")
OUTDIR.mkdir(parents=True, exist_ok=True)

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def stable_json_bytes(obj) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',',':'))+'\n').encode('utf-8')

legacy = json.loads(LEGACY.read_text(encoding='utf-8'))

for round_key, round_id in [('round1','1'),('round2','2')]:
    src = legacy[round_key]
    rows=[]
    for item in src['localities']:
        rows.append({
            'sourceUnitId': item['name'],
            'label': item['name'],
            'sections': item['sections'],
            'pollingPlaces': item['locations'],
            'eligible': item['apt'],
            'turnout': item['turnout'],
            'abstention': item['abstention'],
            'validVotes': item['valid'],
            'blankVotes': item['blank'],
            'nullVotes': item['nullVotes'],
            'candidateVotes': item['candidateVotes'],
        })
    payload={
        'schemaVersion':'election-results-v1',
        'sourceGrain':'polling-place-neighborhood-label',
        'analysisUnit':'polling-place-neighborhood-label',
        'roundId': round_id,
        'municipality': legacy['municipality'],
        'municipalityCodeTSE': legacy['municipalityCodeTSE'],
        'rows': rows,
        'summary': src['city'],
        'quality': src['quality'],
        'semantics': legacy.get('semantics'),
        'sources': legacy.get('sources'),
    }
    data=stable_json_bytes(payload)
    checksum=sha256_bytes(data)
    name=f'presidential-2022-r{round_id}.json'
    revision_dir=OUTDIR/'revisions'
    revision_dir.mkdir(exist_ok=True)
    immutable=revision_dir/f'presidential-2022-r{round_id}-legacy-{checksum[:12]}.json'
    if immutable.exists() and immutable.read_bytes()!=data: raise ValueError('Immutable revision collision')
    immutable.write_bytes(data)
    (OUTDIR/name).write_bytes(data)
    descriptor={
        'id':f'elections-presidential-2022-r{round_id}',
        'revision':f'legacy-{checksum[:12]}',
        'supersedes':None,
        'moduleId':'elections',
        'domainId':'presidential',
        'periodId':'2022',
        'roundId':round_id,
        'status':'totalized',
        'sourceStatus':'unverified-legacy',
        'derivedStatus':'totalized',
        'asOf':'2022-10-30T23:59:59Z' if round_id=='2' else '2022-10-02T23:59:59Z',
        'publishedAt':'2026-10-07T09:06:25Z',
        'sourceGrain':'polling-place-neighborhood-label',
        'analysisUnit':'polling-place-neighborhood-label',
        'territoryId':'br-sc-jaragua-do-sul',
        'territoryVintage':'tse-2022-labels-v1',
        'crosswalkId':None,
        'format':'json',
        'uri':f'./{name}',
        'schemaRef':'election-results-v1',
        'candidateCatalogUri':None,
        'comparisonPolicyId':'same-source-grain-v1',
        'provenance':{
            'sourceId':'legacy-2022-unverified',
            'sourceUrl':'https://dadosabertos.tse.jus.br/dataset/resultados-2022-boletim-de-urna',
            'collectedAt':legacy.get('generatedAt','2026-10-07T09:05:34Z'),
            'license':None,
            'methodDoc':'../../../docs/methodology.md'
        },
        'quality':{
            'coveragePct':src['quality']['mappingCoveragePct'],
            'reconciled':bool(src['quality']['reconciledExactly']),
            'notes':['Legacy extraction only; internal reconciliation does not establish official provenance or spatial accuracy.']
        },
        'checksum':checksum
    }
    archived_descriptor=revision_dir/(immutable.stem+'.dataset.json')
    archived={**descriptor,'uri':'./'+immutable.name}
    archived_bytes=(json.dumps(archived,indent=2,ensure_ascii=False)+'\n').encode('utf-8')
    if archived_descriptor.exists() and archived_descriptor.read_bytes()!=archived_bytes: raise ValueError('Immutable descriptor collision')
    archived_descriptor.write_bytes(archived_bytes)
    (OUTDIR/f'presidential-2022-r{round_id}.dataset.json').write_text(json.dumps(descriptor, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(name, checksum)
