import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.13.0/+esm';

const fmt = new Intl.NumberFormat('pt-BR');
const config = await fetch('./slice-config.json', {cache:'no-cache'}).then(r => r.json());
const [geo, dataset] = await Promise.all([
  fetch(config.geometry.uri, {cache:'no-cache'}).then(r => r.json()),
  fetch(config.dataset.uri, {cache:'no-cache'}).then(r => r.json())
]);

const $ = (s) => document.querySelector(s);
$('#app-title').textContent = config.app.title;
$('#app-subtitle').textContent = config.app.subtitle;
$('#module-button').textContent = config.module.label;
$('#period-label').textContent = config.module.periodLabel;
$('#dataset-status').textContent = `${config.dataset.sourceLabel} · ${config.dataset.statusLabel} · ${config.dataset.revision}`;
$('#quality-copy').textContent = `${config.quality.matched}/${config.quality.geometryFeatures} áreas com associação nominal no slice. ${config.quality.note}`;

const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
$('#kpis').innerHTML = config.kpis.map(kpi => {
  const value = getPath(dataset, kpi.path);
  return `<article class="kpi"><span>${kpi.label}</span><strong>${fmt.format(value ?? 0)}</strong></article>`;
}).join('');

function flatten(node, out=[]) {
  if (!Array.isArray(node)) return out;
  if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') { out.push(node); return out; }
  node.forEach(child => flatten(child, out));
  return out;
}
const coords = geo.features.flatMap(f => flatten(f.geometry.coordinates));
const xs = coords.map(c => c[0]), ys = coords.map(c => c[1]);
const bounds = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
const values = geo.features.map(f => Number(f.properties?.[config.metric.featureField])).filter(Number.isFinite);
const min = Math.min(...values), max = Math.max(...values), mid=(min+max)/2;

const map = new maplibregl.Map({
  container:'map',
  style:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#071018'}}]},
  center:[(bounds[0][0]+bounds[1][0])/2,(bounds[0][1]+bounds[1][1])/2],
  zoom:10,
  attributionControl:false
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
map.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:config.dataset.sourceLabel}),'bottom-right');

function colorExpression(){
  const p=config.metric.palette;
  return ['case',['has',config.metric.featureField],['interpolate',['linear'],['get',config.metric.featureField],min,p.low,mid,p.mid,max,p.high],p.noData];
}

function selectFeature(feature){
  const name=feature.properties?.[config.geometry.labelField] ?? 'Área';
  const value=Number(feature.properties?.[config.metric.featureField]);
  $('#selection-name').textContent=name;
  $('#selection-value').textContent=Number.isFinite(value) ? `${config.metric.label}: ${fmt.format(value)}` : 'Sem correspondência no slice';
  map.setFilter('selected',['==',['get','featureKey'],feature.properties?.featureKey ?? '__none__']);
}

map.on('load',()=>{
  map.addSource('areas',{type:'geojson',data:geo});
  map.addLayer({id:'areas-fill',type:'fill',source:'areas',paint:{'fill-color':colorExpression(),'fill-opacity':.87}});
  map.addLayer({id:'areas-line',type:'line',source:'areas',paint:{'line-color':'rgba(235,242,248,.55)','line-width':['interpolate',['linear'],['zoom'],9,.7,14,1.8]}});
  map.addLayer({id:'selected',type:'line',source:'areas',filter:['==',['get','featureKey'],'__none__'],paint:{'line-color':'#fff','line-width':3}});
  map.fitBounds(bounds,{padding:window.innerWidth<760?{top:70,bottom:180,left:24,right:24}:{top:60,bottom:150,left:280,right:60},duration:0});

  const hover=$('#hover-card');
  map.on('mousemove','areas-fill',(e)=>{
    if (window.matchMedia('(hover: none)').matches) return;
    const f=e.features?.[0]; if(!f) return;
    const value=Number(f.properties?.[config.metric.featureField]);
    hover.hidden=false;
    hover.style.left=`${e.point.x+12}px`; hover.style.top=`${e.point.y+12}px`;
    hover.innerHTML=`<strong>${f.properties?.[config.geometry.labelField] ?? 'Área'}</strong><span>${Number.isFinite(value)?`${config.metric.label}: ${fmt.format(value)}`:'Sem dado no slice'}</span>`;
  });
  map.on('mouseleave','areas-fill',()=>{ hover.hidden=true; });
  map.on('click','areas-fill',(e)=>{ const f=e.features?.[0]; if(f) selectFeature(f); });
});

$('#sidebar-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('closed'));
$('#sheet-handle').addEventListener('click',()=>$('#bottom-panel').classList.toggle('expanded'));
