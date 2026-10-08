import { describe, it, expect } from 'vitest';
import { electionSchema, descriptorSchema } from './validated-data';

describe('contrato eleitoral em runtime',()=>{
 it('rejeita votos negativos e payload sem linhas',()=>{
  expect(()=>electionSchema.parse({schemaVersion:'election-results-v1',summary:{}})).toThrow();
  expect(()=>electionSchema.parse({schemaVersion:'election-results-v1',summary:{},rows:[{sourceUnitId:'x',label:'x',validVotes:-1,candidateVotes:{}}]})).toThrow();
 });
 it('preserva ausência e não inventa comparecimento zero',()=>{
  const d=electionSchema.parse({schemaVersion:'election-results-v1',summary:{},rows:[{sourceUnitId:'x',label:'x',validVotes:0,candidateVotes:{}}]});
  expect(d.rows[0].turnout).toBeUndefined();
 });
});

it('rejects an official seal without source evidence',()=>{
 expect(()=>descriptorSchema.parse({id:'fixture',revision:'rev',status:'official',moduleId:'m',periodId:'p',territoryId:'t',territoryVintage:'v',sourceGrain:'section',analysisUnit:'section',asOf:'date',publishedAt:'date',format:'json',uri:'data.json',schemaRef:'schema',checksum:'a'.repeat(64),provenance:{sourceId:'s',sourceUrl:'https://example.org',collectedAt:'date'},quality:{coveragePct:100,reconciled:true,notes:[]}})).toThrow(/requires source/);
});
it('rejects internally inconsistent electoral rows',()=>{
 expect(()=>electionSchema.parse({schemaVersion:'election-results-v1',summary:{validVotes:3},rows:[{sourceUnitId:'x',label:'x',validVotes:3,candidateVotes:{a:2}}]})).toThrow(/reconcile/);
});
