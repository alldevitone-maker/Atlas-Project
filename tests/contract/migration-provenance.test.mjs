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
