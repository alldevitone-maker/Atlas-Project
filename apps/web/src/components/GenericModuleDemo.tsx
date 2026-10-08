import {lazy,Suspense,useCallback,useEffect,useState} from 'react';
import type {FeatureCollection} from 'geojson';
import {AtlasRuntime} from '../../../../packages/runtime/src/index';
import {Registry} from '../../../../packages/registry/src/index';
import {evaluateExpression} from '../../../../packages/metrics/src/index';
import {I18n} from '../../../../packages/i18n/src/index';
const AtlasMap=lazy(()=>import('./AtlasMap').then(module=>({default:module.AtlasMap})));

export default function GenericModuleDemo(){
 const [loaded,setLoaded]=useState<{runtime:AtlasRuntime;geometry:FeatureCollection;data:{rows:{sourceUnitId:string;label:string;value:number}[]};i18n:I18n}|null>(null);
 const [selection,setSelection]=useState({label:new URLSearchParams(location.search).get('feature') || '',value:null as number|null});
 const [error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{try{
  const fixture=await fetch('./fixtures/synthetic/registry.json').then(r=>r.json());
  const runtime=new AtlasRuntime({registry:new Registry(fixture)});runtime.hydrateFromSearch(location.search);
  runtime.store.set({module:fixture.modules[0].id,dataset:fixture.datasets[0].id,revision:fixture.datasets[0].revision,metric:fixture.metrics[0].id});
  const data=await runtime.loadResolved<{rows:{sourceUnitId:string;label:string;value:number}[]}>();
  const geometry=await fetch('./fixtures/synthetic/geometry.geojson').then(r=>r.json()) as FeatureCollection;
  if(live)setLoaded({runtime,data,geometry,i18n:new I18n({active:fixture.catalog},'active')});
 }catch(cause){if(live)setError(String(cause));}})();return()=>{live=false;};},[]);
 const select=useCallback((next:{label:string;value:number|null})=>setSelection(next),[]);
 useEffect(()=>{if(!loaded)return;loaded.runtime.store.set({feature:selection.label});history.replaceState(null,'',location.pathname+loaded.runtime.permalink());},[loaded,selection.label]);
 if(error)return <main className="fatal" role="alert">{error}</main>;
 if(!loaded)return <main className="loading">Carregando módulo sintético…</main>;
 const metric=loaded.runtime.registry.getMetric(String(loaded.runtime.store.get().metric))!;
 const values=loaded.data.rows.map(row=>evaluateExpression(metric.expression,row));
 return <main className="shell" style={{gridTemplateColumns:'1fr'}}><header className="topbar"><h1 style={{fontSize:18}}>{loaded.i18n.t('modules.synthetic')}</h1><p>Fixture artificial para teste. Não são dados oficiais ou eleitorais.</p></header><section className="map-stage"><Suspense fallback={<p>Carregando mapa…</p>}><AtlasMap geometry={loaded.geometry} geometryLabelField="name" dataset={loaded.data} datasetField="sourceUnitId" metricField="value" metricLabel={loaded.i18n.t(metric.labelKey)} prototype={false} selectedLabel={selection.label} onSelect={select}/></Suspense></section><section className="bottom-sheet"><h2>{loaded.i18n.t(metric.labelKey)}</h2><p>Valores: {values.join(', ')} · Total: {values.reduce<number>((sum,value)=>sum+(value??0),0)}</p><p>Selecionado: {selection.label || 'nenhum'} · Valor: {selection.value ?? loaded.data.rows.find(row=>row.label===selection.label)?.value ?? '—'}</p></section></main>;
}
