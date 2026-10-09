import { z } from 'zod';
import { DataLoader } from '../../../../packages/data-loader/src/index';
import type {MetricExpression} from '../../../../packages/contracts/src/index';
import type { DatasetDescriptor } from '../types';

const count = z.number().int().nonnegative();
export const electionSchema = z.object({
  schemaVersion: z.literal('election-results-v1'),
  validVotesMeaning:z.string().optional(),
  rows: z.array(z.object({ sourceUnitId: z.string(), label: z.string(), validVotes: count,
    pollingPlaceId:z.string().optional(),blankVotes:count.optional(),nullVotes:count.optional(),
    candidateVotes: z.record(z.string(), count) }).passthrough()),
  summary: z.record(z.string(), z.unknown()),
  semantics: z.string().nullable().optional()
}).passthrough().superRefine((data,ctx) => {
  const ids = new Set<string>();
  for (const row of data.rows) {
    if (ids.has(row.sourceUnitId)) ctx.addIssue({code:'custom',message:'Duplicate source unit'});
    ids.add(row.sourceUnitId);
    if (Object.values(row.candidateVotes).reduce((sum,value)=>sum+value,0) !== row.validVotes)
      ctx.addIssue({code:'custom',message:'Candidate votes do not reconcile'});
  }
  for(const field of ['eligible','apt','turnout','abstention','blankVotes','blank','nullVotes']) {
    const value=data.summary[field];
    if(value != null && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0))ctx.addIssue({code:'custom',message:`Invalid municipal count: ${field}`});
  }
  const valid=data.summary.validVotes ?? data.summary.valid;
  const candidates=data.summary.candidateVotes;
  if(candidates != null){
    const parsed=z.record(z.string(),count).safeParse(candidates);
    if(!parsed.success || (valid != null && Object.values(parsed.data).reduce((sum,value)=>sum+value,0)!==valid))ctx.addIssue({code:'custom',message:'Municipal candidate totals do not reconcile'});
  }
  if (valid != null && (!Number.isSafeInteger(valid) || valid !== data.rows.reduce((sum,row)=>sum+row.validVotes,0)))
    ctx.addIssue({code:'custom',message:'Municipal votes do not reconcile'});
});
export async function loadElection(descriptor: DatasetDescriptor, uri: string) {
  const payload = await new DataLoader().load({...descriptor,uri});
  return electionSchema.parse(payload);
}

const status = z.enum(['draft','provisional','totalized','official']);
export const descriptorSchema = z.object({
 id:z.string().min(1),revision:z.string().min(1),moduleId:z.string(),domainId:z.string().nullable().optional(),periodId:z.string(),roundId:z.string().nullable().optional(),status,
 sourceStatus:z.enum(['unverified-legacy','draft','provisional','totalized','official']).optional(),derivedStatus:status.optional(),
 territoryId:z.string(),territoryVintage:z.string(),sourceGrain:z.string(),analysisUnit:z.string(),asOf:z.string(),publishedAt:z.string(),
 format:z.enum(['json','geojson','flatgeobuf','pmtiles','geoparquet']),uri:z.string(),schemaRef:z.string(),checksum:z.string().regex(/^[a-f0-9]{64}$/),
 provenance:z.object({sourceId:z.string(),sourceUrl:z.string().url(),collectedAt:z.string(),sourceSnapshotUri:z.string().optional(),sourceChecksum:z.string().regex(/^[a-f0-9]{64}$/).optional()}).passthrough(),
 quality:z.object({coveragePct:z.number().min(0).max(100),reconciled:z.boolean(),notes:z.array(z.string())})
}).passthrough().refine(d => d.status !== 'official' || (d.sourceStatus === 'official' && d.derivedStatus === 'official' && d.quality.reconciled && Boolean(d.provenance.sourceSnapshotUri && d.provenance.sourceChecksum)), {message:'Official status requires source and derivation evidence'});

const expressionSchema:z.ZodType<MetricExpression> = z.lazy(()=>z.discriminatedUnion('op',[
 z.object({op:z.literal('field'),field:z.string()}),z.object({op:z.literal('literal'),value:z.number()}),
 z.object({op:z.literal('ratio'),numerator:expressionSchema,denominator:expressionSchema}),
 z.object({op:z.literal('difference'),left:expressionSchema,right:expressionSchema}),
 z.object({op:z.literal('sum'),items:z.array(expressionSchema)}),z.object({op:z.literal('coalesce'),items:z.array(expressionSchema)})
]));
export const candidateCatalogSchema=z.array(z.object({id:z.string().min(1),officialName:z.string().min(1),ballotNumber:z.union([z.string().min(1),z.number().int()])}).passthrough()).refine(items=>new Set(items.map(item=>item.id)).size===items.length && new Set(items.map(item=>String(item.ballotNumber))).size===items.length,{message:'Duplicate candidate catalog entry'});

export const webRegistrySchema = z.object({
 app:z.object({titleKey:z.string(),subtitleKey:z.string(),locale:z.string()}),
 territory:z.object({id:z.string(),labelKey:z.string(),geometryUri:z.string(),geometryLabelField:z.string()}),
 module:z.object({id:z.string(),labelKey:z.string(),domainId:z.string()}),
 datasets:z.array(z.object({id:z.string(),labelKey:z.string(),periodId:z.string(),roundId:z.string().nullable().optional(),descriptorUri:z.string(),dataUri:z.string(),candidateCatalogUri:z.string().nullable().optional(),candidateCatalogSourceUri:z.string().optional(),candidateCatalogChecksum:z.string().regex(/^[a-f0-9]{64}$/).optional(),measureKind:z.string().optional()})).min(1),
 revisions:z.array(z.object({id:z.string(),revision:z.string(),labelKey:z.string(),periodId:z.string(),roundId:z.string().nullable().optional(),descriptorUri:z.string(),dataUri:z.string(),candidateCatalogUri:z.string().nullable().optional(),candidateCatalogSourceUri:z.string().optional(),candidateCatalogChecksum:z.string().regex(/^[a-f0-9]{64}$/).optional(),measureKind:z.string().optional()})).optional(),
 defaultDatasetId:z.string(),comparisonPolicyId:z.string(),
 candidateMapPresentation:z.object({palette:z.object({a:z.string().regex(/^#[a-fA-F0-9]{6}$/),b:z.string().regex(/^#[a-fA-F0-9]{6}$/),neutral:z.string().regex(/^#[a-fA-F0-9]{6}$/)}).refine(p=>new Set(Object.values(p).map(c=>c.toLowerCase())).size===3,{message:'Distinct map colors required'}),defaultPair:z.object({a:z.string(),b:z.string()}).refine(p=>p.a!==p.b),labels:z.object({toggle:z.string(),a:z.string(),b:z.string(),neutral:z.string(),advantage:z.string(),swap:z.string()}),messages:z.object({ambiguous:z.string(),missing:z.string(),tie:z.string(),zero:z.string(),higher:z.string()}),eligibleDatasets:z.array(z.string()),sourceRef:z.string().url()}).optional(),
 metric:z.object({id:z.string(),labelKey:z.string(),rowField:z.string(),format:z.enum(['integer','percent'])}),
 metrics:z.array(z.object({id:z.string(),labelKey:z.string(),expression:expressionSchema,format:z.enum(['integer','percent'])})).optional(),
 basemaps:z.array(z.object({id:z.string(),labelKey:z.string(),background:z.string().regex(/^#[a-fA-F0-9]{6}$/),fill:z.string().regex(/^#[a-fA-F0-9]{6}$/),line:z.string().regex(/^#[a-fA-F0-9]{6}$/),highlight:z.string().regex(/^#[a-fA-F0-9]{6}$/)})).optional(),
 join:z.object({strategy:z.string(),datasetField:z.string(),prototype:z.boolean()})
}).refine(config=>config.datasets.some(item=>item.id===config.defaultDatasetId),{message:'Default dataset missing from registry'}).refine(config=>[...config.datasets,...(config.revisions ?? [])].every(item=>!item.candidateCatalogUri || item.candidateCatalogChecksum),{message:'Candidate catalog requires checksum'});
