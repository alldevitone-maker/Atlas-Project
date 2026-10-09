export interface PairPalette {a:string;b:string;neutral:string}
export type PairReason='ambiguous'|'missing'|'tie'|'zero'|'higher';
export interface PairStyle {fill:string;category:'a'|'b'|'neutral';reason:PairReason}

/** Template method: a domain supplies labels and measures, never renderer-specific candidate tags. */
export abstract class PairPresentation<Row> {
 protected abstract labelFor(row:Row):string;
 protected abstract valuesFor(row:Row,first:string,second:string):readonly [number|undefined,number|undefined];
 protected normalize(label:string){return label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
 render(rows:Row[],first:string,second:string,palette:PairPalette):Record<string,PairStyle>{
  const groups=new Map<string,Row[]>();
  for(const row of rows){const label=this.normalize(this.labelFor(row));groups.set(label,[...(groups.get(label) ?? []),row]);}
  const styles:Record<string,PairStyle>=Object.create(null);
  const neutral=(reason:PairReason):PairStyle=>({fill:palette.neutral,category:'neutral',reason});
  for(const [label,group] of groups){
   if(!label || group.length!==1){styles[label]=neutral('ambiguous');continue;}
   const [a,b]=this.valuesFor(group[0]!,first,second);
   if(first===second || typeof a!=='number' || typeof b!=='number' || !Number.isFinite(a) || !Number.isFinite(b)){styles[label]=neutral('missing');continue;}
   if(a===b){styles[label]=neutral(a===0 ? 'zero' : 'tie');continue;}
   styles[label]={fill:a>b ? palette.a : palette.b,category:a>b ? 'a' : 'b',reason:'higher'};
  }
  return styles;
 }
}
