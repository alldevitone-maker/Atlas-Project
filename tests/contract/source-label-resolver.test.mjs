import test from 'node:test';
import assert from 'node:assert/strict';
import {ElectionSourceLabelResolver,sourceUnitCandidates} from '../../dist/packages/domain-elections/src/index.js';
import {SourceLabelResolver} from '../../dist/packages/map-engine/src/source-label-resolver.js';
test('source lookup inherits generic normalization and fails closed for ambiguity or missing labels',()=>{
 const resolver=new ElectionSourceLabelResolver();
 assert.ok(resolver instanceof SourceLabelResolver);
 const rows=[{sourceUnitId:'ÁREA',candidateVotes:{x:3},validVotes:3}];
 assert.equal(resolver.resolve(rows,' área ').row,rows[0]);
 assert.equal(resolver.resolve(rows,'missing').status,'missing');
 assert.equal(resolver.resolve([...rows,{...rows[0],sourceUnitId:'area'}],'ÁREA').status,'ambiguous');
 const results=sourceUnitCandidates(rows[0],[{id:'arbitrary',ballotNumber:'x',officialName:'Fixture'}]);
 assert.equal(results[0].votes,3);assert.equal(results[0].share,1);
 assert.equal(sourceUnitCandidates(rows[0],[{id:'absent',ballotNumber:'not-recorded',officialName:'Missing'}]).some(item=>item.id==='absent'),false);
});
