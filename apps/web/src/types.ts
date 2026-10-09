export type DatasetStatus = 'draft' | 'provisional' | 'totalized' | 'official';

export interface DatasetRef {
  revision?: string;
  measureKind?: string;
  candidateCatalogSourceUri?: string;
  candidateCatalogChecksum?: string;
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
  revisions?: DatasetRef[];
  defaultDatasetId: string;
  comparisonPolicyId: string;
  candidateMapPresentation?:{palette:{a:string;b:string;neutral:string};defaultPair:{a:string;b:string};labels:{toggle:string;a:string;b:string;neutral:string;advantage:string;swap:string};messages:Record<import("../../../packages/map-engine/src/presentation").PairReason,string>;eligibleDatasets:string[];sourceRef:string};
  basemaps?:{id:string;labelKey:string;background:string;fill:string;line:string;highlight:string}[];
  metrics?: {id:string;labelKey:string;expression:import('../../../packages/contracts/src/index').MetricExpression;format:'integer' | 'percent'}[];
  metric: { id: string; labelKey: string; rowField: string; format: 'integer' | 'percent' };
  join: { strategy: string; datasetField: string; prototype: boolean };
}

export type { DatasetDescriptor } from '../../../packages/contracts/src/index';

export interface ElectionRow {
  sourceUnitId: string;
  label: string;
  validVotes: number;
  turnout?: number;
  abstention?: number;
  candidateVotes: Record<string, number>;
  pollingPlaceId?: string;
  blankVotes?: number;
  nullVotes?: number;
}

export interface ElectionDataset {
  validVotesMeaning?: string;
  rows: ElectionRow[];
  summary: Record<string, unknown>;
  semantics?: string | null;
}

export interface Candidate {
  id: string;
  officialName: string;
  ballotNumber: string | number;
}
