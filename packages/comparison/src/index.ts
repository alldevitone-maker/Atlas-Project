import type { ComparisonPolicy, DatasetDescriptor } from '../../contracts/src/index.js';

export interface ComparisonAssessment {
  compatible: boolean;
  issues: string[];
  action: ComparisonPolicy['onIncompatible'] | 'allow';
}

export function assessComparison(
  left: DatasetDescriptor,
  right: DatasetDescriptor,
  policy: ComparisonPolicy
): ComparisonAssessment {
  const issues: string[] = [];
  if (policy.requiresSameTerritoryVintage && left.territoryVintage !== right.territoryVintage) {
    issues.push('territory-vintage-mismatch');
  }
  if (policy.requiresSameAnalysisUnit && left.analysisUnit !== right.analysisUnit) {
    issues.push('analysis-unit-mismatch');
  }
  return {
    compatible: issues.length === 0 || policy.onIncompatible === 'warn',
    issues,
    action: issues.length === 0 ? 'allow' : policy.onIncompatible
  };
}
