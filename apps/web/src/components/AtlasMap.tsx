import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MlMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);
import { MapEngine } from '../../../../packages/map-engine/src/index';
import { LayerManager } from '../../../../packages/layer-manager/src/index';
import { InteractionManager } from '../../../../packages/interaction-manager/src/index';

interface Props {
  geometry: FeatureCollection;
  geometryLabelField: string;
  dataset: {rows:object[]};
  datasetField: string;
  metricField: string;
  metricLabel: string;
  prototype: boolean;
  selectedLabel: string;
  onSelect: (selection: { label: string; value: number | null }) => void;
}

const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

function boundsFor(fc: FeatureCollection): [[number, number], [number, number]] {
  const points: [number, number][] = [];
  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      points.push([node[0], node[1]]); return;
    }
    for (const child of node) walk(child);
  };
  for (const feature of fc.features) walk(feature.geometry && 'coordinates' in feature.geometry ? feature.geometry.coordinates : []);
  const xs = points.map(p => p[0]); const ys = points.map(p => p[1]);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}

export function AtlasMap(props: Props) {
  const [selectedLabel, setSelectedLabel] = useState(props.selectedLabel);
  const [mapError, setMapError] = useState(false);
  const engineRef = useRef<MapEngine | null>(null);
  const [interaction] = useState(() => new InteractionManager());
  useEffect(() => interaction.subscribe(selection => {
    if (selection) props.onSelect({label:String(selection.properties.label),value:typeof selection.properties.value === 'number' ? selection.properties.value : null});
    else props.onSelect({label:'',value:null});
  }), [interaction,props.onSelect]);
  const host = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!host.current) return;
    setMapError(false);
    setSelectedLabel(props.selectedLabel);
    const rowByLabel = new Map(props.dataset.rows.map(row => [normalize((row as Record<string,unknown>)[props.datasetField]), row]));
    const features = props.geometry.features.map((feature, index) => {
      const label = String(feature.properties?.[props.geometryLabelField] ?? '');
      const row = props.prototype ? undefined : rowByLabel.get(normalize(label));
      const value = row ? Number((row as unknown as Record<string, unknown>)[props.metricField]) : NaN;
      return {
        ...feature,
        id: feature.id ?? index,
        properties: { ...(feature.properties ?? {}), __atlasLabel: label, __atlasMetric: value !== null && Number.isFinite(value) ? value : null }
      };
    });
    const fc: FeatureCollection = { type: 'FeatureCollection', features };
    const numeric = features.map(f => f.properties?.__atlasMetric).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const min = numeric.length ? Math.min(...numeric) : 0;
    const max = numeric.length ? Math.max(...numeric) : 1;
    const upper = max > min ? max : min + 1;
    const middle = min + (upper - min) / 2;
    const bounds = boundsFor(fc);

    let map: MlMap;
    try { map = new maplibregl.Map({
      container: host.current,
      style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#081018' } }] },
      center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
      zoom: 10,
      attributionControl: false
    });
    } catch { setMapError(true); return; }
    map.on("error", () => setMapError(true));
    mapRef.current = map;
    const engine = new MapEngine({
      addSource:(id,spec)=>map.addSource(id,spec as unknown as maplibregl.SourceSpecification),
      addLayer:(spec,before)=>map.addLayer(spec as unknown as maplibregl.LayerSpecification,before),
      setFilter:(id,filter)=>map.setFilter(id,filter as maplibregl.FilterSpecification)
    });
    engineRef.current=engine;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      new LayerManager(engine).mount({sources:[{id:'territory',spec:{type:'geojson',data:fc}}],layers:[
        {id:'territory-fill',sourceId:'territory',spec:{type:'fill',paint:{
          'fill-color':['case',['!=',['get','__atlasMetric'],null],['interpolate',['linear'],['get','__atlasMetric'],min,'#162536',middle,'#315e89',upper,'#9fc4ff'],'#26313a'],'fill-opacity':0.9
        }}},
        {id:'territory-line',sourceId:'territory',spec:{type:'line',paint:{'line-color':'rgba(238,244,248,.55)','line-width':1}}},
        {id:'territory-selected',sourceId:'territory',spec:{type:'line',filter:['==',['get','__atlasLabel'],props.selectedLabel || '__none__'],paint:{'line-color':'#fff','line-width':3}}}
      ]});
      map.fitBounds(bounds, { padding: window.innerWidth < 760 ? { top: 90, right: 20, bottom: Math.min(260, window.innerHeight * .38), left: 20 } : 48, duration: 0 });

      map.on('click', 'territory-fill', event => {
        const feature = event.features?.[0]; if (!feature) return;
        const label = String(feature.properties?.__atlasLabel ?? '');
        const raw = feature.properties?.__atlasMetric;
        const value = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
        engineRef.current?.setFilter('territory-selected', ['==', ['get', '__atlasLabel'], label]);
        setSelectedLabel(label);
        interaction.select({sourceId:'territory',featureId:feature.id ?? label,properties:{label,value:Number.isFinite(value) ? value : null}});
      });

      map.on('mouseenter', 'territory-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'territory-fill', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => { map.remove(); mapRef.current = null; engineRef.current=null; };
  }, [props.geometry, props.dataset, props.geometryLabelField, props.datasetField, props.metricField, props.metricLabel, props.prototype, props.onSelect]);

  useEffect(() => {
    setSelectedLabel(props.selectedLabel);
    const map = mapRef.current;
    if (map?.getLayer('territory-selected')) engineRef.current?.setFilter('territory-selected', ['==', ['get', '__atlasLabel'], props.selectedLabel]);
  }, [props.selectedLabel]);

  return <><div className="atlas-map" ref={host} aria-label="Mapa territorial exploratório" />
    {mapError && <p className="map-unavailable" role="status">O mapa não está disponível neste navegador. Os dados municipais e a seleção territorial continuam acessíveis.</p>}
    <div className="territory-selector"><label htmlFor="territory-selection">Selecionar território</label>
      <select id="territory-selection" value={selectedLabel} onChange={event => {
        const label = event.target.value;
        setSelectedLabel(label);
        if (label) interaction.select({sourceId:'territory',featureId:label,properties:{label,value:null}}); else interaction.clear();
        const map = mapRef.current;
        if (map?.getLayer('territory-selected')) engineRef.current?.setFilter('territory-selected', ['==', ['get', '__atlasLabel'], label]);
      }}><option value="">Nenhum território selecionado</option>{props.geometry.features.map((feature, i) => {
        const label = String(feature.properties?.[props.geometryLabelField] ?? '');
        return <option key={i} value={label}>{label}</option>;
      })}</select></div></>;
}
