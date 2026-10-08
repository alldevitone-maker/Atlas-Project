import { describe, expect, it } from 'vitest';
import { assessMunicipalComparison, extractMunicipalMeasure, type MunicipalComparisonPolicy } from './comparison';
import type { DatasetDescriptor, ElectionDataset } from '../types';

const policy: MunicipalComparisonPolicy = {
  id:'municipality-aggregate-v1', aggregationScope:'municipality',
  requiresSameTerritory:true, requiresSameDomain:true, requiresSameRound:true,
  requiresSameTerritoryVintage:false, requiresSameAnalysisUnit:false,
  allowAbsoluteDelta:true, allowRelativeDelta:true, onIncompatible:'reject',
  messageKey:'comparison.policy.municipality'
};
function descriptor(id:string, year:string, round='1'):DatasetDescriptor {
  return {
    publishedAt:'2026-10-08T00:00:00Z', format:'json', uri:'/fixture.json', schemaRef:'election-results-v1', checksum:'a'.repeat(64),
    id, periodId:year, revision:'immutable-'+year, status:'totalized', asOf:year+'-10-04T00:00:00Z',
    territoryId:'territory-alpha', territoryVintage:year+'-map',
    moduleId:'elections', domainId:'presidential', sourceGrain:'polling-place-neighborhood-label',
    analysisUnit:'polling-place-neighborhood-label', roundId:round, quality:{coveragePct:100,reconciled:true,notes:[]},
    provenance:{sourceId:'test',sourceUrl:'https://example.org',collectedAt:'2026-10-08T00:00:00Z'}
  };
}
const a:ElectionDataset={rows:[],summary:{apt:1000,turnout:850,valid:800}};
const b:ElectionDataset={rows:[],summary:{eligible:1100,turnout:990,validVotes:950}};
describe('comparação municipal com políticas auditáveis',()=>{
  it('suporta formatos legados de totais mantendo período de origem',()=>{
    expect(extractMunicipalMeasure(a)?.validVotes).toBe(800);
    expect(extractMunicipalMeasure(b)?.turnoutRate).toBe(90);
  });
  it('compara município apesar da safra diferente sem alegar comparação por bairro',()=>{
    const result=assessMunicipalComparison(descriptor('period-alpha','period-alpha'),descriptor('period-beta','period-beta'),a,b,policy);
    expect(result.compatible).toBe(true);
    expect(result.validVotesDelta).toBe(150);
    expect(result.turnoutRateDeltaPp).toBe(5);
  });
  it('bloqueia turnos, domínios e cidades incompatíveis',()=>{
    const second=descriptor('period-beta','period-beta','2');
    second.territoryId='other-city'; second.domainId='other-domain';
    const r=assessMunicipalComparison(descriptor('period-alpha','period-alpha'),second,a,b,policy);
    expect(r.compatible).toBe(false);
    expect(r.validVotesDelta).toBeNull();
    expect(r.issues.length).toBeGreaterThanOrEqual(3);
  });
  it('rejeita totais inválidos, cobertura insuficiente e origem sem reconciliação',()=>{
    const second=descriptor('period-beta','period-beta'); second.quality.reconciled=false;
    second.quality.coveragePct=94;
    const r=assessMunicipalComparison(descriptor('period-alpha','period-alpha'),second,a,{rows:[],summary:{validVotes:1500,turnout:990,eligible:1100}},policy);
    expect(r.compatible).toBe(false);
    expect(r.issues).toContain('Totais municipais inválidos ou ausentes.');
  });
  it('não calcula valores sem política explícita',()=>{
    expect(assessMunicipalComparison(descriptor('period-alpha','period-alpha'),descriptor('period-beta','period-beta'),a,b,null).compatible).toBe(false);
  });
});
