import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('legacy migration cannot recreate an official seal or mutate output on missing input', () => {
 const tmp=mkdtempSync(join(tmpdir(),'atlas-migration-'));
 try {
  const input=join(tmp,'legacy.json'),out=join(tmp,'out');
  const round={localities:[],city:{valid:0},quality:{mappingCoveragePct:0,reconciledExactly:true}};
  writeFileSync(input,JSON.stringify({round1:round,round2:round,municipality:'fixture',municipalityCodeTSE:'test'}));
  const run=spawnSync('python',['pipelines/elections/migrate_legacy_2022.py','--input',input,'--output',out],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const d=JSON.parse(readFileSync(join(out,'presidential-2022-r1.dataset.json')));
  assert.equal(d.sourceStatus,'unverified-legacy');assert.notEqual(d.status,'official');
  const missing=join(tmp,'missing-output');
  assert.notEqual(spawnSync('python',['pipelines/elections/migrate_legacy_2022.py','--input',join(tmp,'absent'),'--output',missing]).status,0);
  assert.equal(existsSync(missing),false);
 } finally {rmSync(tmp,{recursive:true,force:true});}
});

test('JS legacy migration keeps unverified provenance and immutable archived bytes',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'atlas-js-migration-'));
 try {
  const input=join(tmp,'legacy.mjs'),out=join(tmp,'out');
  const city={electorate:10,turnout:8,turnoutPct:80,abstention:2,abstentionPct:20,valid:5,blank:1,nullVotes:2,sections:1,totalSections:1,candidates:[{number:'a',name:'Fixture'}]};
  const rows=[{name:'Fixture',valid:5,electorate:10,abstentionPct:20,blank:1,nullVotes:2,candidateVotes:{a:5}}];
  writeFileSync(input,`export const CITY_2026=${JSON.stringify(city)};export const LOCAL_2026=${JSON.stringify(rows)};`);
  const env={...process.env,ATLAS_LEGACY_INPUT:input,ATLAS_OUTPUT_DIR:out};
  const run=()=>spawnSync('node',['pipelines/elections/migrate_legacy_2026.mjs'],{env,encoding:'utf8'});
  const first=run();assert.equal(first.status,0,first.stderr);
  const descriptor=JSON.parse(readFileSync(join(out,'presidential-2026-r1.dataset.json')));
  assert.equal(descriptor.sourceStatus,'unverified-legacy');assert.notEqual(descriptor.status,'official');
  const archive=join(out,'revisions',`presidential-2026-r1-${descriptor.revision}.json`);const before=readFileSync(archive);
  assert.equal(run().status,0);assert.deepEqual(readFileSync(archive),before);
 } finally {rmSync(tmp,{recursive:true,force:true});}
});
