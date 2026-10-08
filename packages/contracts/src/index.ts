export type DatasetStatus = 'draft' | 'provisional' | 'totalized' | 'official';
export type DatasetFormat = 'json' | 'geojson' | 'flatgeobuf' | 'pmtiles' | 'geoparquet';
export type ModuleStatus = 'active' | 'coming-soon' | 'disabled';

export interface Attribution {
  id: string;
  label: string;
  url: string;
  license?: string | null;
  licenseUrl?: string | null;
  required: boolean;
}

export interface TerritoryUnit {
  id: string;
  label: string;
  vintage: string;
  sourceId: string;
  licenseId?: string | null;
  uri: string;
  geometryType: string;
}

export interface Territory {
  id: string;
  label: string;
  country: string;
  state: string;
  officialCode: string;
  units: TerritoryUnit[];
}

export interface AtlasModule {
  id: string;
  labelKey: string;
  status: ModuleStatus;
  domainPackage?: string | null;
  children: string[];
}


export interface AtlasDomain {
  id: string;
  moduleId: string;
  labelKey: string;
  status: ModuleStatus;
  datasetIds: string[];
}

export interface Candidate {
  id: string;
  officialName: string;
  ballotNumber: string | number;
  partyId?: string | null;
  display: { shortLabelKey?: string | null; fullLabelKey?: string | null };
}

export interface CrosswalkAssociation {
  sourceId: string;
  targetId: string;
  method: 'official-field' | 'geocode' | 'spatial-join' | 'reviewed-alias' | 'manual-review';
  confidence: number;
  reviewed: boolean;
  weight?: number | null;
}

export interface Crosswalk {
  id: string;
  version: string;
  sourceUnit: string;
  targetUnit: string;
  territoryVintage: string;
  generatedAt: string;
  checksum: string;
  coverage: { matched: number; total: number; pct: number };
  associations: CrosswalkAssociation[];
}

export type MetricExpression =
  | { op: 'field'; field: string }
  | { op: 'literal'; value: number }
  | { op: 'ratio'; numerator: MetricExpression; denominator: MetricExpression }
  | { op: 'difference'; left: MetricExpression; right: MetricExpression }
  | { op: 'sum'; items: MetricExpression[] }
  | { op: 'coalesce'; items: MetricExpression[] };

export interface MetricDefinition {
  id: string;
  labelKey: string;
  expression: MetricExpression;
  format: 'percent' | 'integer' | 'decimal' | 'percentage-points';
  comparisonPolicyId?: string | null;
  minReliableObservations?: number | null;
  palette: { type: 'sequential' | 'diverging' | 'categorical'; ref: string; center?: number | null };
  classification: 'continuous' | 'quantile' | 'jenks' | 'manual';
}

export interface ComparisonPolicy {
  id: string;
  requiresSameTerritoryVintage: boolean;
  requiresSameAnalysisUnit: boolean;
  allowAbsoluteDelta: boolean;
  allowRelativeDelta: boolean;
  onIncompatible: 'reject' | 'warn' | 'aggregate-common-unit';
  messageKey: string;
}

export interface DatasetDescriptor {
  id: string;
  revision: string;
  supersedes?: string | null;
  moduleId: string;
  domainId?: string | null;
  periodId: string;
  roundId?: string | null;
  status: DatasetStatus;
  asOf: string;
  publishedAt: string;
  sourceGrain: string;
  analysisUnit: string;
  territoryId: string;
  territoryVintage: string;
  crosswalkId?: string | null;
  format: DatasetFormat;
  uri: string;
  schemaRef: string;
  candidateCatalogUri?: string | null;
  comparisonPolicyId?: string | null;
  provenance: {
    sourceId: string;
    sourceUrl: string;
    collectedAt: string;
    license?: string | null;
    methodDoc?: string | null;
  };
  quality: { coveragePct: number; reconciled: boolean; notes: string[] };
  checksum: string;
}

export interface Basemap {
  id: string;
  type: 'style' | 'xyz' | 'raster' | 'pmtiles';
  labelKey: string;
  uri: string;
  attributionIds: string[];
  minZoom: number;
  maxZoom: number;
}
