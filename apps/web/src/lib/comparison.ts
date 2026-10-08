import type { DatasetDescriptor, ElectionDataset } from '../types';

export interface MunicipalComparisonPolicy {
  id: string;
  aggregationScope: 'municipality';
  requiresSameTerritory: boolean;
  requiresSameDomain: boolean;
  requiresSameRound: boolean;
  requiresSameTerritoryVintage: boolean;
  requiresSameAnalysisUnit: boolean;
  allowAbsoluteDelta: boolean;
  allowRelativeDelta: boolean;
  onIncompatible: 'reject' | 'warn' | 'aggregate-common-unit';
  messageKey: string;
}

export interface MunicipalMeasure {
  validVotes: number;
  turnout: number;
  eligible: number;
  turnoutRate: number;
  abstentionRate: number;
}
export interface ComparisonResult {
  compatible: boolean;
  issues: string[];
  left: MunicipalMeasure | null;
  right: MunicipalMeasure | null;
  validVotesDelta: number | null;
  turnoutRateDeltaPp: number | null;
}

const readCount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

export function extractMunicipalMeasure(data: ElectionDataset): MunicipalMeasure | null {
  const s = data.summary;
  const validVotes = readCount(s.validVotes ?? s.valid);
  const turnout = readCount(s.turnout);
  const eligible = readCount(s.eligible ?? s.apt);
  if (validVotes === null || turnout === null || eligible === null ||
      eligible === 0 || turnout > eligible || validVotes > turnout) return null;
  const turnoutRate = 100 * turnout / eligible;
  return { validVotes, turnout, eligible, turnoutRate, abstentionRate: 100 - turnoutRate };
}

/** Delta is allowed only for municipality-wide totals, never the prototype neighborhood join. */
export function assessMunicipalComparison(
  leftDescriptor: DatasetDescriptor,
  rightDescriptor: DatasetDescriptor,
  leftDataset: ElectionDataset,
  rightDataset: ElectionDataset,
  policy: MunicipalComparisonPolicy | null
): ComparisonResult {
  const issues: string[] = [];
  const left = extractMunicipalMeasure(leftDataset);
  const right = extractMunicipalMeasure(rightDataset);
  if (!policy || policy.aggregationScope !== 'municipality' || policy.onIncompatible !== 'reject') {
    issues.push('Política de comparação municipal indisponível.');
  } else {
    if (policy.requiresSameTerritory && leftDescriptor.territoryId !== rightDescriptor.territoryId) issues.push('Municípios diferentes.');
    if (policy.requiresSameDomain && (leftDescriptor.moduleId !== rightDescriptor.moduleId ||
        leftDescriptor.domainId !== rightDescriptor.domainId)) issues.push('Cargos ou domínios diferentes.');
    if (policy.requiresSameRound && leftDescriptor.roundId !== rightDescriptor.roundId) issues.push('Turnos diferentes.');
    if (policy.requiresSameTerritoryVintage && leftDescriptor.territoryVintage !== rightDescriptor.territoryVintage) issues.push('Malhas territoriais diferentes.');
    if (policy.requiresSameAnalysisUnit && leftDescriptor.analysisUnit !== rightDescriptor.analysisUnit) issues.push('Unidades de análise diferentes.');
    if (!policy.allowAbsoluteDelta || !policy.allowRelativeDelta) issues.push('A política não autoriza cálculo de variações.');
  }
  if (leftDescriptor.id === rightDescriptor.id) issues.push('Selecione dois períodos diferentes.');
  if (leftDescriptor.sourceGrain !== rightDescriptor.sourceGrain) issues.push('Granularidades de origem diferentes.');
  if (!leftDescriptor.quality.reconciled || !rightDescriptor.quality.reconciled) issues.push('Dados não reconciliados.');
  if (leftDescriptor.quality.coveragePct !== 100 || rightDescriptor.quality.coveragePct !== 100) issues.push('Cobertura municipal incompleta.');
  if (!['totalized', 'official'].includes(leftDescriptor.status) ||
      !['totalized', 'official'].includes(rightDescriptor.status)) issues.push('Consolidação insuficiente.');
  if (!left || !right) issues.push('Totais municipais inválidos ou ausentes.');

  const compatible = issues.length === 0;
  return {
    compatible,
    issues,
    left,
    right,
    validVotesDelta: compatible ? right!.validVotes - left!.validVotes : null,
    turnoutRateDeltaPp: compatible ? right!.turnoutRate - left!.turnoutRate : null
  };
}
