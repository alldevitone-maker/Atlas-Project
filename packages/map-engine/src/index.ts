export type GenericGeoJson = Record<string, unknown>;

export interface MapPort {
  addSource(id: string, source: Record<string, unknown>): void;
  removeSource?(id: string): void;
  addLayer(layer: Record<string, unknown>, beforeId?: string): void;
  removeLayer?(id: string): void;
  setFilter?(layerId: string, filter: unknown): void;
  setPaintProperty?(layerId: string, property: string, value: unknown): void;
  setFeatureState?(target: { source: string; id: string | number }, state: Record<string, unknown>): void;
  fitBounds?(bounds: [[number, number], [number, number]], options?: Record<string, unknown>): void;
}

export interface SourceDefinition {
  id: string;
  spec: Record<string, unknown>;
}

export interface LayerDefinition {
  id: string;
  sourceId: string;
  spec: Record<string, unknown>;
  beforeId?: string;
}

export class MapEngine {
  private readonly sourceIds = new Set<string>();
  private readonly layerIds = new Set<string>();

  constructor(private readonly map: MapPort) {}

  mountSource(source: SourceDefinition): void {
    if (this.sourceIds.has(source.id)) return;
    this.map.addSource(source.id, source.spec);
    this.sourceIds.add(source.id);
  }

  mountLayer(layer: LayerDefinition): void {
    if (this.layerIds.has(layer.id)) return;
    if (!this.sourceIds.has(layer.sourceId)) throw new Error(`layer-source-missing:${layer.sourceId}`);
    const spec = { ...layer.spec, id: layer.id, source: layer.sourceId };
    this.map.addLayer(spec, layer.beforeId);
    this.layerIds.add(layer.id);
  }

  setFilter(layerId: string, filter: unknown): void {
    if (!this.layerIds.has(layerId)) throw new Error(`layer-not-mounted:${layerId}`);
    this.map.setFilter?.(layerId, filter);
  }

  setPaint(layerId: string, property: string, value: unknown): void {
    if (!this.layerIds.has(layerId)) throw new Error(`layer-not-mounted:${layerId}`);
    this.map.setPaintProperty?.(layerId, property, value);
  }

  setFeatureState(sourceId: string, featureId: string | number, state: Record<string, unknown>): void {
    if (!this.sourceIds.has(sourceId)) throw new Error(`source-not-mounted:${sourceId}`);
    this.map.setFeatureState?.({ source: sourceId, id: featureId }, state);
  }

  hasSource(id: string): boolean { return this.sourceIds.has(id); }
  hasLayer(id: string): boolean { return this.layerIds.has(id); }
}
