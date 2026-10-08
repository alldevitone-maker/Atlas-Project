import test from 'node:test';
import assert from 'node:assert/strict';
import { assessComparison } from '../../dist/packages/comparison/src/index.js';

const base = {
  id:'d',revision:'r',moduleId:'m',periodId:'p',status:'official',asOf:'x',publishedAt:'x',
  sourceGrain:'unit',analysisUnit:'unit',territoryId:'t',territoryVintage:'v1',format:'json',uri:'x',schemaRef:'x',
  provenance:{sourceId:'s',sourceUrl:'https://example.invalid',collectedAt:'x'},quality:{coveragePct:100,reconciled:true,notes:[]},checksum:'0'.repeat(64)
};
const policy={id:'p',requiresSameTerritoryVintage:true,requiresSameAnalysisUnit:true,allowAbsoluteDelta:false,allowRelativeDelta:true,onIncompatible:'reject',messageKey:'x'};

test('comparison policy rejects incompatible territory vintage',()=>{
  const result=assessComparison(base,{...base,id:'d2',territoryVintage:'v2'},policy);
  assert.equal(result.compatible,false);
  assert.deepEqual(result.issues,['territory-vintage-mismatch']);
});
