import type { DatasetDescriptor } from '../../contracts/src/index.js';
import { DataLoader } from '../../data-loader/src/index.js';
import { Registry } from '../../registry/src/index.js';
import { AtlasStore } from '../../state/src/index.js';
import { parseUrlState, serializeUrlState } from '../../router/src/index.js';

export interface RuntimeOptions {
  registry: Registry;
  store?: AtlasStore;
  loader?: DataLoader;
}

export class AtlasRuntime {
  readonly registry: Registry;
  readonly store: AtlasStore;
  readonly loader: DataLoader;

  constructor(options: RuntimeOptions) {
    this.registry = options.registry;
    this.store = options.store ?? new AtlasStore();
    this.loader = options.loader ?? new DataLoader();
  }

  hydrateFromSearch(search: string): void {
    this.store.set(parseUrlState(search));
  }

  permalink(): string {
    const state = this.store.get();
    const serializable: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === 'string') serializable[key] = value;
    }
    return serializeUrlState(serializable);
  }

  resolveDataset(): DatasetDescriptor {
    const state = this.store.get();
    const explicitId = typeof state.dataset === 'string' ? state.dataset : undefined;
    if (explicitId) {
      const descriptor = this.registry.getDataset(explicitId);
      if (!descriptor) throw new Error(`dataset-not-found:${explicitId}`);
      if (typeof state.revision === 'string' && descriptor.revision !== state.revision) {
        throw new Error(`dataset-revision-mismatch:${state.revision}`);
      }
      return descriptor;
    }

    const moduleId = typeof state.module === 'string' ? state.module : undefined;
    if (!moduleId) throw new Error('module-not-selected');
    const descriptor = this.registry.resolveLatestDataset({ moduleId });
    if (!descriptor) throw new Error(`dataset-not-found-for-module:${moduleId}`);
    return descriptor;
  }

  async loadResolved<T = unknown>(): Promise<T> {
    return this.loader.load<T>(this.resolveDataset());
  }
}
