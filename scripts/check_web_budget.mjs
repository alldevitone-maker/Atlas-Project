import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join,basename } from 'node:path';
const dir='apps/web/dist/assets';
const html=readFileSync('apps/web/dist/index.html','utf8');
const initial=[...new Set([...html.matchAll(/(?:src|href)="([^"\n]+\.js)"/g)].map(match=>basename(match[1])))];
if(!initial.length)throw new Error('Missing entrypoint');
const initialSize=initial.reduce((sum,name)=>sum+gzipSync(readFileSync(join(dir,name))).length,0);
console.log(`initial JS gzip: ${initialSize}/110000`);if(initialSize>110000)throw new Error('budget-exceeded:initial-js');
for(const [pattern,limit,label] of [[/^AtlasMap-.*\.js$/,300000,'map JS gzip'],[/^maplibre-gl-worker-.*\.js$/,520000,'worker bytes']]){
 const files=readdirSync(dir).filter(name=>pattern.test(name));
 if(files.length!==1)throw new Error(`${label}: expected one asset`);
 const p=join(dir,files[0]);const size=label.includes('gzip')?gzipSync(readFileSync(p)).length:statSync(p).size;
 console.log(`${label}: ${size}/${limit}`);if(size>limit)throw new Error(`budget-exceeded:${label}`);
}
