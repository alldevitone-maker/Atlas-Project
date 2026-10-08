import test from 'node:test';
import assert from 'node:assert/strict';
import { DataLoader } from '../../dist/packages/data-loader/src/index.js';
import { MapEngine } from '../../dist/packages/map-engine/src/index.js';
import { LayerManager } from '../../dist/packages/layer-manager/src/index.js';
import { InteractionManager } from '../../dist/packages/interaction-manager/src/index.js';
import { I18n } from '../../dist/packages/i18n/src/index.js';
import { SlotRegistry } from '../../dist/packages/ui-shell/src/index.js';
import { Registry } from '../../dist/packages/registry/src/index.js';
import { AtlasStore } from '../../dist/packages/state/src/index.js';
import { AtlasRuntime } from '../../dist/packages/runtime/src/index.js';

const descriptor = {
  id:'dataset-alpha', revision:'rev-a', supersedes:null, moduleId:'module-alpha', domainId:null,
  periodId:'period-alpha', roundId:null, status:'official', asOf:'2000-01-01T00:00:00Z',
  publishedAt:'2000-01-01T00:00:00Z', sourceGrain:'unit-a', analysisUnit:'unit-a',
  territoryId:'territory-alpha', territoryVintage:'v1', crosswalkId:null, format:'json', uri:'/data.json',
  schemaRef:'test', candidateCatalogUri:null, comparisonPolicyId:null,
  provenance:{sourceId:'source-alpha',sourceUrl:'https://example.invalid',collectedAt:'2000-01-01T00:00:00Z'},
  quality:{coveragePct:100,reconciled:true,notes:[]}, checksum:'a'.repeat(64)
};

test('generic DataLoader uses adapter by descriptor format', async () => {
  const fetcher = async () => new Response(JSON.stringify({value:17}), {status:200, headers:{'content-type':'application/json'}});
  const loader = new DataLoader(undefined, fetcher);
  assert.deepEqual(await loader.load(descriptor), {value:17});
});

test('MapEngine + LayerManager remain domain agnostic', () => {
  const calls=[];
  const port={
    addSource:(id,spec)=>calls.push(['source',id,spec]),
    addLayer:(spec)=>calls.push(['layer',spec.id,spec.source]),
    setFilter:(id,filter)=>calls.push(['filter',id,filter])
  };
  const engine=new MapEngine(port);
  new LayerManager(engine).mount({
    sources:[{id:'source-a',spec:{type:'geojson',data:{type:'FeatureCollection',features:[]}}}],
    layers:[{id:'layer-a',sourceId:'source-a',spec:{type:'fill'}}]
  });
  engine.setFilter('layer-a',['==',['get','key'],'x']);
  assert.equal(engine.hasSource('source-a'), true);
  assert.equal(engine.hasLayer('layer-a'), true);
  assert.equal(calls.length,3);
});

test('InteractionManager publishes selection without domain concepts', () => {
  const manager=new InteractionManager();
  let seen=null;
  manager.subscribe(value=>seen=value);
  manager.select({sourceId:'source-a',featureId:'f-1',properties:{value:4}});
  assert.equal(seen.featureId,'f-1');
  manager.clear();
  assert.equal(seen,null);
});

test('i18n and UI slots are runtime-configurable', () => {
  const i18n=new I18n({alpha:{'label.value':'Valor {n}'}},'alpha');
  const slots=new SlotRegistry();
  slots.register('slot-a',ctx=>i18n.t('label.value',{n:ctx.n}));
  assert.equal(slots.render('slot-a',{n:9}),'Valor 9');
});

test('AtlasRuntime preserves explicit immutable revision in permalink', async () => {
  const module={id:'module-alpha',labelKey:'module.alpha',status:'active',children:[]};
  const registry=new Registry({modules:[module],datasets:[descriptor]});
  const fetcher=async()=>new Response(JSON.stringify({ok:true}),{status:200});
  const runtime=new AtlasRuntime({registry,store:new AtlasStore(),loader:new DataLoader(undefined,fetcher)});
  runtime.hydrateFromSearch('?module=module-alpha&dataset=dataset-alpha&revision=rev-a');
  assert.equal(runtime.resolveDataset().revision,'rev-a');
  assert.match(runtime.permalink(),/revision=rev-a/);
  assert.deepEqual(await runtime.loadResolved(),{ok:true});
});
