import type { LayerDefinition, MapEngine, SourceDefinition } from '../../map-engine/src/index.js';

export interface LayerBundle {
  sources: SourceDefinition[];
  layers: LayerDefinition[];
}

export class LayerManager {
  constructor(private readonly engine: MapEngine) {}

  mount(bundle: LayerBundle): void {
    for (const source of bundle.sources) this.engine.mountSource(source);
    for (const layer of bundle.layers) this.engine.mountLayer(layer);
  }
}
