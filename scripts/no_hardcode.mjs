import {parse} from '@babel/parser';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative,matchesGlob,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function lintSource(source,file,exceptions=[]){
 const ast=parse(source,{sourceType:'module',plugins:file.endsWith('tsx')?['typescript','jsx']:['typescript']});
 const errors=[];
 const visit=(node,parent)=>{
  if(!node || typeof node!=='object')return;
  let literal;
  if(node.type==='StringLiteral')literal=node.value;
  if(node.type==='TemplateLiteral' && node.expressions.length===0)literal=node.quasis.map(part=>part.value.cooked).join('');
  let rule;
  if(typeof literal==='string'){
   if(/^20[1-3][0-9]$/.test(literal))rule='election-year-literal';
   if(/jaragua[-_ ]do[-_ ]sul/i.test(literal))rule='municipality-slug';
   if(/\b(?:Lula|Bolsonaro)\b/i.test(literal))rule='political-name';
  }
  if(node.type==='NumericLiteral' && parent?.type==='ObjectProperty' && /^(?:ballotNumber|candidateNumber|partyNumber)$/.test(parent.key?.name ?? parent.key?.value ?? ''))rule='ballot-number-literal';
  if(rule && !exceptions.some(item=>item.reason && matchesGlob(file,item.path) && String(literal ?? node.value).includes(item.pattern)))errors.push({file,line:node.loc.start.line,rule});
  for(const [key,value] of Object.entries(node)){
   if(['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments'].includes(key))continue;
   if(Array.isArray(value))for(const child of value)visit(child,node);else if(value && typeof value==='object')visit(value,node);
  }
 };
 visit(ast,null);return errors;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const exceptions=JSON.parse(readFileSync('config/atlas/no-hardcode-allowlist.json','utf8')).exceptions;
 const errors=[];
 const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(['node_modules','dist','e2e','test-results','playwright-report'].includes(entry.name))continue;
  const file=join(dir,entry.name);
  if(entry.isDirectory())walk(file);else if(/\.[cm]?[jt]sx?$/.test(file) && !file.includes('.test.'))errors.push(...lintSource(readFileSync(file,'utf8'),relative('.',file),exceptions));
 }};
 for(const dir of ['packages','apps'])walk(dir);
 for(const error of errors)console.error(`${error.file}:${error.line} [${error.rule}]`);
 if(errors.length)process.exitCode=1;else console.log('no-hardcode AST: OK');
}
