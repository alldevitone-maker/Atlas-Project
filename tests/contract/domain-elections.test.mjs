import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates, topTwoMargin } from '../../dist/packages/domain-elections/src/index.js';

test('election ranking stays outside generic MetricEngine', () => {
  const rows = [
    { candidateId: 'c', votes: 10 },
    { candidateId: 'a', votes: 30 },
    { candidateId: 'b', votes: 20 }
  ];
  assert.deepEqual(rankCandidates(rows).map(x => x.candidateId), ['a','b','c']);
  assert.equal(topTwoMargin(rows, 100), 0.1);
});

test('municipal candidate adapter preserves ballot identifiers when catalog is absent', async()=>{
 const {municipalCandidates}=await import('../../dist/packages/domain-elections/src/index.js');
 const results=municipalCandidates({rows:[{candidateVotes:{a:3,b:1}}],summary:{validVotes:4}},[]);
 assert.equal(results[0].ballotNumber,'a');assert.equal(results[0].officialName,'');assert.equal(results[0].share,.75);
 assert.equal(municipalCandidates({rows:[{candidateVotes:{a:0}}],summary:{validVotes:0}},[])[0].share,null);
});
