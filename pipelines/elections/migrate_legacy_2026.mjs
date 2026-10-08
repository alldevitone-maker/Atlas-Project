import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '../..');
const legacyPath = process.env.ATLAS_LEGACY_INPUT || path.join(root, 'data/raw/legacy-baseline/jaragua-atlas/data/elections.js');
const outDir = process.env.ATLAS_OUTPUT_DIR || path.join(root, 'data/territories/br/sc/jaragua-do-sul/elections');
if (!fs.existsSync(legacyPath)) throw new Error(`Missing legacy input: ${legacyPath}`);
fs.mkdirSync(outDir, { recursive: true });
const mod = await import(pathToFileURL(legacyPath).href + `?snapshot=${Date.now()}`);
const city = mod.CITY_2026;
const local = mod.LOCAL_2026;

const candidateCatalog = city.candidates.map((candidate) => ({
  id: `ballot-${candidate.number}`,
  officialName: candidate.name,
  ballotNumber: candidate.number,
  partyId: null,
  display: { shortLabelKey: null, fullLabelKey: null }
}));
const catalogBytes = Buffer.from(JSON.stringify(candidateCatalog, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'presidential-2026-candidates.json'), catalogBytes);

const payload = {
  schemaVersion: 'election-results-v1',
  sourceGrain: 'polling-place-neighborhood-label',
  analysisUnit: 'polling-place-neighborhood-label',
  roundId: '1',
  rows: local.map(row => ({
    sourceUnitId: row.name,
    label: row.name,
    validVotes: row.valid,
    eligible: row.electorate,
    abstentionPct: row.abstentionPct,
    blankVotes: row.blank,
    nullVotes: row.nullVotes,
    candidateVotes: row.candidateVotes
  })),
  summary: {
    eligible: city.electorate,
    turnout: city.turnout,
    turnoutPct: city.turnoutPct,
    abstention: city.abstention,
    abstentionPct: city.abstentionPct,
    validVotes: city.valid,
    blankVotes: city.blank,
    nullVotes: city.nullVotes,
    sections: city.sections,
    totalSections: city.totalSections
  },
  quality: {
    sections: city.sections,
    totalSections: city.totalSections,
    coveragePct: city.totalSections ? city.sections / city.totalSections * 100 : 0,
    legacyReconciled: true
  }
};
const payloadText = JSON.stringify(payload, Object.keys(payload).sort(), 0); // checksum source only; file below pretty is separate
const pretty = JSON.stringify(payload, null, 2) + '\n';
const checksum = crypto.createHash('sha256').update(pretty).digest('hex');
const revisionDir=path.join(outDir,'revisions');fs.mkdirSync(revisionDir,{recursive:true});
function immutable(file,bytes){if(fs.existsSync(file)&&!fs.readFileSync(file).equals(Buffer.from(bytes)))throw new Error('Immutable revision collision');fs.writeFileSync(file,bytes);}
const revisionName=`presidential-2026-r1-legacy-${checksum.slice(0,12)}`;
immutable(path.join(revisionDir,revisionName+'.json'),pretty);
fs.writeFileSync(path.join(outDir, 'presidential-2026-r1.json'), pretty);

const descriptor = {
  id: 'elections-presidential-2026-r1',
  revision: `legacy-${checksum.slice(0,12)}`,
  supersedes: null,
  moduleId: 'elections',
  domainId: 'presidential',
  periodId: '2026',
  roundId: '1',
  status: 'totalized',
  sourceStatus: 'unverified-legacy',
  derivedStatus: 'totalized',
  asOf: '2026-10-04T23:59:59-03:00',
  publishedAt: '2026-10-07T09:06:25Z',
  sourceGrain: 'polling-place-neighborhood-label',
  analysisUnit: 'polling-place-neighborhood-label',
  territoryId: 'br-sc-jaragua-do-sul',
  territoryVintage: 'legacy-locality-labels-v1',
  crosswalkId: null,
  format: 'json',
  uri: './presidential-2026-r1.json',
  schemaRef: 'election-results-v1',
  candidateCatalogUri: './presidential-2026-candidates.json',
  comparisonPolicyId: 'same-source-grain-v1',
  provenance: {
    sourceId: 'legacy-2026-reconciled-report',
    sourceUrl: 'https://github.com/alldevitone-maker/api-lab-faculdade',
    collectedAt: '2026-10-07T09:06:25Z',
    license: null,
    methodDoc: '../../../docs/methodology.md'
  },
  quality: {
    coveragePct: payload.quality.coveragePct,
    reconciled: true,
    notes: [
      'Migrated from the validated legacy deploy artifact.',
      'Marked totalized rather than official until raw TSE 2026 source and lifecycle are independently archived and verified.'
    ]
  },
  checksum
};
immutable(path.join(revisionDir,revisionName+'.dataset.json'),JSON.stringify({...descriptor,uri:'./'+revisionName+'.json'},null,2)+'\n');
fs.writeFileSync(path.join(outDir, 'presidential-2026-r1.dataset.json'), JSON.stringify(descriptor, null, 2) + '\n');
console.log('presidential-2026-r1.json', checksum);
