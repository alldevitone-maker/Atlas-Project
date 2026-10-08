export type DatasetStatus = 'draft' | 'provisional' | 'totalized' | 'official';

export interface DatasetRef {
  id: string;
  labelKey: string;
  periodId: string;
  roundId?: string | null;
  descriptorUri: string;
  dataUri: string;
  candidateCatalogUri?: string | null;
}

export interface WebRegistry {
  app: { titleKey: string; subtitleKey: string; locale: string };
  territory: { id: string; labelKey: string; geometryUri: string; geometryLabelField: string };
  module: { id: string; labelKey: string; domainId: string };
  datasets: DatasetRef[];
  defaultDatasetId: string;
  comparisonPolicyId: string;
  metric: { id: string; labelKey: string; rowField: string; format: 'integer' | 'percent' };
  join: { strategy: string; datasetField: string; prototype: boolean };
}

export interface DatasetDescriptor {
  id: string;
  revision: string;
  status: DatasetStatus;
  territoryId: string;
  territoryVintage: string;
  sourceGrain: string;
  analysisUnit: string;
  moduleId: string;
  domainId?: string | null;
  roundId?: string | null;
  asOf: string;
  quality: { coveragePct: number; reconciled: boolean; notes: string[] };
  provenance: { sourceId: string; sourceUrl: string; collectedAt: string };
}

export interface ElectionRow {
  sourceUnitId: string;
  label: string;
  validVotes: number;
  turnout: number;
  abstention: number;
  candidateVotes: Record<string, number>;
}

export interface ElectionDataset {
  rows: ElectionRow[];
  summary: Record<string, unknown>;
  semantics?: string;
}

export interface Candidate {
  id: string;
  officialName: string;
  ballotNumber: string | number;
}
