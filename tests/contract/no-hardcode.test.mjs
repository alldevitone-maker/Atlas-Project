import test from 'node:test';
import assert from 'node:assert/strict';
import {lintSource} from '../../scripts/no_hardcode.mjs';

test('AST guard ignores comments and enforces documented allowlist',()=>{
 assert.equal(lintSource('// Bolsonaro in a comment\nconst value=2;','packages/example.ts').length,0);
 assert.equal(lintSource('const year="2026";','packages/example.ts')[0].rule,'election-year-literal');
 assert.equal(lintSource('const c={ballotNumber:22};','packages/example.ts')[0].rule,'ballot-number-literal');
 assert.equal(lintSource('const name="Bolsonaro";','packages/example.ts',[{path:'packages/**',pattern:'Bolsonaro',reason:'Synthetic test exception'}]).length,0);
 assert.equal(lintSource('const name="Bolsonaro";','packages/example.ts',[{path:'packages/**',pattern:'Bolsonaro'}]).length,1);
});
