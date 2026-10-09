import test from 'node:test';
import assert from 'node:assert/strict';
import {PairPresentation} from '../../dist/packages/map-engine/src/presentation.js';
import {ElectionPairPresentation} from '../../dist/packages/domain-elections/src/index.js';

const palette={a:'#112233',b:'#445566',neutral:'#778899'};
test('inherited presentation accepts non-electoral measures and arbitrary palette without candidate tags',()=>{
 class SensorPresentation extends PairPresentation {
  labelFor(row){return row.unit;}
  valuesFor(row,a,b){return [row[a],row[b]];}
 }
 const out=new SensorPresentation().render([{unit:'Unit A',temperature:20,humidity:10},{unit:'Unit B',temperature:2,humidity:8}],'temperature','humidity',palette);
 assert.equal(out['UNIT A'].fill,palette.a);assert.equal(out['UNIT B'].fill,palette.b);
});
test('election inheritance fails closed for ambiguity, invalid or missing counts and ties',()=>{
 const renderer=new ElectionPairPresentation();
 const row=(sourceUnitId,a,b)=>({sourceUnitId,candidateVotes:{arbitraryA:a,arbitraryB:b}});
 const out=renderer.render([row('Água',9,3),row('Other',1,8),row('Tie',4,4),row('Zero',0,0),row('Missing',2,undefined),row('Invalid',-1,4),row('ÁREA',2,1),row('AREA',8,1)],'arbitraryA','arbitraryB',palette);
 assert.equal(out.AGUA.fill,palette.a);assert.equal(out.OTHER.fill,palette.b);
 for(const label of ['TIE','ZERO','MISSING','INVALID','AREA'])assert.equal(out[label].fill,palette.neutral);
 assert.equal(out.AREA.reason,'ambiguous');assert.equal(out.TIE.reason,'tie');
 assert.equal(renderer.render([row('Same',4,5)],'arbitraryA','arbitraryA',palette).SAME.category,'neutral');
 assert.equal(out.UNKNOWN,undefined);
});
