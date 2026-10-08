import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
const folder = new URL('../../public/data/', import.meta.url);
describe('published data integrity', () => {
 for (const name of readdirSync(folder).filter(name => name.endsWith('.dataset.json'))) {
  it(name + ' preserves checksum, totals and provenance', () => {
   const descriptor = JSON.parse(readFileSync(new URL(name, folder), 'utf8'));
   const bytes = readFileSync(new URL(name.replace('.dataset.json', '.json'), folder));
   const data = JSON.parse(bytes.toString());
   const s = data.summary;
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(descriptor.checksum);
   expect(data.rows.reduce((sum, row) => sum + row.validVotes, 0)).toBe(s.validVotes ?? s.valid);
   expect((s.validVotes ?? s.valid) + (s.blankVotes ?? s.blank) + s.nullVotes).toBe(s.turnout);
   expect(s.turnout + s.abstention).toBe(s.eligible ?? s.apt);
   expect(descriptor.provenance.sourceUrl).toMatch(/^https:/);
   expect(descriptor.sourceStatus).toBe('unverified-legacy');
   expect(descriptor.status).not.toBe('official');
   expect(descriptor.crosswalkId).toBeNull();
  });
 }
});
