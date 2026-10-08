import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MlMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);
import type { ElectionDataset } from '../types';

interface Props {
  geometry: FeatureCollection;
  geometryLabelField: string;
  dataset: ElectionDataset;
  datasetField: string;
  metricField: string;
  metricLabel: string;
  prototype: boolean;
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
  const [selectedLabel, setSelectedLabel] = useState('');
  const [mapError, setMapError] = useState(false);
  const host = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!host.current) return;
    setMapError(false);
    setSelectedLabel('');
    const rowByLabel = new Map(props.dataset.rows.map(row => [normalize(row[props.datasetField as keyof typeof row]), row]));
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
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      map.addSource('territory', { type: 'geojson', data: fc } as never);
      map.addLayer({ id: 'territory-fill', type: 'fill', source: 'territory', paint: {
        'fill-color': ['case', ['!=', ['get', '__atlasMetric'], null], ['interpolate', ['linear'], ['get', '__atlasMetric'], min, '#162536', middle, '#315e89', upper, '#9fc4ff'], '#26313a'],
        'fill-opacity': 0.9
      }});
      map.addLayer({ id: 'territory-line', type: 'line', source: 'territory', paint: { 'line-color': 'rgba(238,244,248,.55)', 'line-width': 1 }});
      map.addLayer({ id: 'territory-selected', type: 'line', source: 'territory', filter: ['==', ['get', '__atlasLabel'], '__none__'], paint: { 'line-color': '#fff', 'line-width': 3 }});
      map.fitBounds(bounds, { padding: window.innerWidth < 760 ? { top: 90, right: 20, bottom: Math.min(260, window.innerHeight * .38), left: 20 } : 48, duration: 0 });

      map.on('click', 'territory-fill', event => {
        const feature = event.features?.[0]; if (!feature) return;
        const label = String(feature.properties?.__atlasLabel ?? '');
        const raw = feature.properties?.__atlasMetric;
        const value = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
        map.setFilter('territory-selected', ['==', ['get', '__atlasLabel'], label]);
        setSelectedLabel(label);
        props.onSelect({ label, value: Number.isFinite(value) ? value : null });
      });

      map.on('mouseenter', 'territory-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'territory-fill', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [props.geometry, props.dataset, props.geometryLabelField, props.datasetField, props.metricField, props.metricLabel, props.prototype, props.onSelect]);

  return <><div className="atlas-map" ref={host} aria-label="Mapa territorial exploratório" />
    {mapError && <p className="map-unavailable" role="status">O mapa não está disponível neste navegador. Os dados municipais e a seleção territorial continuam acessíveis.</p>}
    <div className="territory-selector"><label htmlFor="territory-selection">Selecionar território</label>
      <select id="territory-selection" value={selectedLabel} onChange={event => {
        const label = event.target.value;
        setSelectedLabel(label);
        setSelectedLabel(label);
        props.onSelect({ label, value: null });
        const map = mapRef.current;
        if (map?.getLayer('territory-selected')) map.setFilter('territory-selected', ['==', ['get', '__atlasLabel'], label]);
      }}><option value="">Nenhum território selecionado</option>{props.geometry.features.map((feature, i) => {
        const label = String(feature.properties?.[props.geometryLabelField] ?? '');
        return <option key={i} value={label}>{label}</option>;
      })}</select></div></>;
}
