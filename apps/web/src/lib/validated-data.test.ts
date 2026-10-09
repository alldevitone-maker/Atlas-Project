import registry from '../../public/registry.json';
import { describe, it, expect } from 'vitest';
import { electionSchema, descriptorSchema, webRegistrySchema, candidateCatalogSchema } from './validated-data';

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

it('rejects malformed municipal candidate totals and electorate counts',()=>{
 const row={sourceUnitId:'x',label:'x',validVotes:3,candidateVotes:{a:3}};
 expect(()=>electionSchema.parse({schemaVersion:'election-results-v1',rows:[row],summary:{validVotes:3,candidateVotes:{a:4}}})).toThrow(/reconcile/);
 expect(()=>electionSchema.parse({schemaVersion:'election-results-v1',rows:[row],summary:{validVotes:3,eligible:'5'}})).toThrow(/Invalid municipal/);
});

it('registry preserves generic metric expressions and requires catalog integrity',()=>{
 const config=structuredClone(registry) as any;config.metrics[0].expression={op:'ratio',numerator:{op:'field',field:'a'},denominator:{op:'field',field:'b'}};
 expect(webRegistrySchema.parse(config).metrics?.[0].expression.op).toBe('ratio');
 delete config.datasets[0].candidateCatalogChecksum;expect(()=>webRegistrySchema.parse(config)).toThrow(/checksum/);
});
it('candidate catalog rejects duplicate ballot identifiers',()=>{
 expect(()=>candidateCatalogSchema.parse([{id:'a',officialName:'Fixture',ballotNumber:'x'},{id:'b',officialName:'Other fixture',ballotNumber:'x'}])).toThrow(/Duplicate/);
});
it('map presentation rejects indistinguishable colors and duplicate default roles',()=>{
 const colors=structuredClone(registry);colors.candidateMapPresentation.palette.b=colors.candidateMapPresentation.palette.a.toUpperCase();
 expect(()=>webRegistrySchema.parse(colors)).toThrow(/Distinct map colors/);
 const roles=structuredClone(registry);roles.candidateMapPresentation.defaultPair.b=roles.candidateMapPresentation.defaultPair.a;
 expect(()=>webRegistrySchema.parse(roles)).toThrow();
});
