export interface CandidateResult {
  candidateId: string;
  votes: number;
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
