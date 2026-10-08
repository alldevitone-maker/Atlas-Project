import { z } from 'zod';
import { DataLoader } from '../../../../packages/data-loader/src/index';
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
  const valid=data.summary.validVotes ?? data.summary.valid;
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
