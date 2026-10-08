import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('BU extraction reconciles sections and rejects duplicate candidates and conflicting electorate',()=>{
 const script=`import importlib.util
spec=importlib.util.spec_from_file_location('ingest','pipelines/elections/ingest_verified_bu.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base=dict(CD_MUNICIPIO='test',ANO_ELEICAO='year',NR_TURNO='turn',CD_CARGO_PERGUNTA='1',NR_ZONA='1',NR_SECAO='1',NR_LOCAL_VOTACAO='place',QT_APTOS='10',QT_COMPARECIMENTO='8',QT_ABSTENCOES='2',CD_TIPO_VOTAVEL='1',NR_VOTAVEL='candidate',NM_VOTAVEL='Fixture',QT_VOTOS='5',SG_PARTIDO='P')
rows=[base,{**base,'CD_TIPO_VOTAVEL':'2','QT_VOTOS':'1'},{**base,'CD_TIPO_VOTAVEL':'3','QT_VOTOS':'2'}]
p,c=m.extract(rows,'test','year','turn');assert p['summary']['validVotes']==5;assert p['summary']['sections']==1;assert p['validVotesMeaning']=='nominal-bu'
for bad in [rows+[base],[base,{**base,'QT_APTOS':'11'}],[base]]:
 try:m.extract(bad,'test','year','turn')
 except ValueError:pass
 else:raise AssertionError('Invalid source accepted')
`;
 const result=spawnSync('python',['-c',script],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});

test('durable municipal CSV reproduces the committed BU payload and catalog',()=>{
 const code=`import csv,hashlib,io,json,importlib.util,gzip
from pathlib import Path
spec=importlib.util.spec_from_file_location('ingest','pipelines/elections/ingest_verified_bu.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=Path('data/raw/tse/2026-sc-r1-81752-president.csv.gz');compressed=p.read_bytes();raw=gzip.decompress(compressed);manifest=json.loads(p.with_suffix('').with_suffix('.provenance.json').read_text());assert hashlib.sha256(compressed).hexdigest()==manifest['compressedSha256'];assert hashlib.sha256(raw).hexdigest()==manifest['subsetSha256']
payload,catalog=m.extract(csv.DictReader(io.StringIO(raw.decode('utf-8')),delimiter=';'),'81752','2026','1')
base=Path('data/territories/br/sc/jaragua-do-sul/elections/presidential-2026-r1-bu-7b347d87beb7')
assert payload==json.loads(base.with_suffix('.json').read_text());assert catalog==json.loads(base.with_suffix('.candidates.json').read_text())
assert payload['summary']['validVotes']==108638
`;
 const result=spawnSync('python',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});

test('both captured 2022 turns reproduce payloads and candidate catalogs without neighborhood inference',()=>{
 const code=`import csv,gzip,hashlib,io,json,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('ingest','pipelines/elections/ingest_verified_bu.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
for turn,revision,total in [('1','bu-b96488de00f0',102563),('2','bu-250b633bdcf3',104007)]:
 p=Path(f'data/raw/tse/2022-sc-r{turn}-81752-president.csv.gz');compressed=p.read_bytes();raw=gzip.decompress(compressed);manifest=json.loads(p.with_suffix('').with_suffix('.provenance.json').read_text());assert hashlib.sha256(raw).hexdigest()==manifest['subsetSha256'];assert hashlib.sha256(compressed).hexdigest()==manifest['compressedSha256']
 data,catalog=m.extract(csv.DictReader(io.StringIO(raw.decode('utf-8')),delimiter=';'),'81752','2022',turn)
 base=Path(f'data/territories/br/sc/jaragua-do-sul/elections/presidential-2022-r{turn}-{revision}')
 assert data==json.loads(base.with_suffix('.json').read_text());assert catalog==json.loads(base.with_suffix('.candidates.json').read_text());assert data['summary']['validVotes']==total
 assert data['analysisUnit']=='polling-section';assert json.loads(base.with_suffix('.dataset.json').read_text())['crosswalkId'] is None
`;
 const result=spawnSync('python',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
