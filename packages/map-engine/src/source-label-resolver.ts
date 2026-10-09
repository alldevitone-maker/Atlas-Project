/** Resolves a source label without claiming a spatial crosswalk. */
export abstract class SourceLabelResolver<Row> {
 protected abstract labelFor(row:Row):string;
 protected normalize(label:string){return label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
 resolve(rows:Row[],label:string):{status:'matched';row:Row}|{status:'missing'|'ambiguous';row?:never}{
  const key=this.normalize(label);
  const matches=key ? rows.filter(row=>this.normalize(this.labelFor(row))===key) : [];
  return matches.length===1 ? {status:'matched',row:matches[0]!} : {status:matches.length ? 'ambiguous' : 'missing'};
 }
}
