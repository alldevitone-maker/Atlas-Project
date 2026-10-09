import {PairPresentation,type PairPalette} from '../../map-engine/src/presentation.js';

export interface CandidateResult {
  candidateId: string;
  votes: number;
}

/** Presentation of legacy labels only. This is not a spatial crosswalk or residence estimate. */
interface LegacyVoteRow {sourceUnitId:string;candidateVotes:Record<string,number>}
export class ElectionPairPresentation extends PairPresentation<LegacyVoteRow> {
 protected labelFor(row:LegacyVoteRow){return row.sourceUnitId;}
 protected valuesFor(row:LegacyVoteRow,first:string,second:string):readonly [number|undefined,number|undefined]{
  const valid=(value:number|undefined)=>typeof value==='number' && Number.isSafeInteger(value) && value>=0 ? value : undefined;
  return [valid(row.candidateVotes[first]),valid(row.candidateVotes[second])];
 }
}
export function legacyPairPresentation(rows:LegacyVoteRow[],first:string,second:string,palette:PairPalette) {
 return new ElectionPairPresentation().render(rows,first,second,palette);
}

export function rankCandidates(results: CandidateResult[]): CandidateResult[] {
  return [...results].sort((a, b) => b.votes - a.votes || a.candidateId.localeCompare(b.candidateId));
}

export function topTwoMargin(results: CandidateResult[], validVotes: number): number | null {
  if (validVotes <= 0) return null;
  const ranked = rankCandidates(results);
  if (ranked.length < 2) return null;
  const first = ranked[0]!;
  const second = ranked[1]!;
  return (first.votes - second.votes) / validVotes;
}

export interface CandidateCatalogEntry {
  id: string;
  officialName: string;
  ballotNumber: string | number;
}

/** Municipal aggregates only; missing catalogs yield ballot identifiers, never inferred names. */
export function municipalCandidates(data: {
  rows: { candidateVotes: Record<string, number> }[];
  summary: Record<string, unknown>;
}, catalog: CandidateCatalogEntry[]) {
  const votes = (data.summary.candidateVotes as Record<string, number> | undefined) ??
    data.rows.reduce<Record<string, number>>((out,row) => {
      for (const [key,value] of Object.entries(row.candidateVotes)) out[key]=(out[key] ?? 0)+value;
      return out;
    }, {});
  const valid = data.summary.validVotes ?? data.summary.valid;
  const known=new Set(catalog.map(item=>String(item.ballotNumber)));
  const entries = [...catalog,...Object.keys(votes).filter(number=>!known.has(number)).map(ballotNumber => ({id:`ballot-${ballotNumber}`,ballotNumber,officialName:''}))];
  const ranked=rankCandidates(entries.map(entry=>({candidateId:entry.id,votes:votes[String(entry.ballotNumber)] ?? 0})));
  return ranked.map(result=>({ ...entries.find(entry=>entry.id === result.candidateId)!, votes:result.votes,
    share:typeof valid === 'number' && valid > 0 ? result.votes/valid : null }));
}
