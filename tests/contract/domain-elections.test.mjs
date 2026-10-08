import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates, topTwoMargin } from '../../dist/packages/domain-elections/src/index.js';

test('election ranking stays outside generic MetricEngine', () => {
  const rows = [
    { candidateId: 'c', votes: 10 },
    { candidateId: 'a', votes: 30 },
    { candidateId: 'b', votes: 20 }
  ];
  assert.deepEqual(rankCandidates(rows).map(x => x.candidateId), ['a','b','c']);
  assert.equal(topTwoMargin(rows, 100), 0.1);
});
