import type { DatasetDescriptor, DatasetFormat } from '../../contracts/src/index.js';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface DataAdapter<T = unknown> {
  readonly format: DatasetFormat;
  load(descriptor: DatasetDescriptor, fetcher: FetchLike): Promise<T>;
}

export async function verifiedJson(descriptor: DatasetDescriptor, fetcher: FetchLike): Promise<unknown> {
  const response = await fetcher(descriptor.uri, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`dataset-load-failed:${response.status}`);
  const bytes = await response.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const checksum = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  if (checksum !== descriptor.checksum) throw new Error('dataset-checksum-mismatch');
  return JSON.parse(new TextDecoder().decode(bytes));
}

export class JsonAdapter implements DataAdapter<unknown> {
  readonly format: DatasetFormat = 'json';
  async load(descriptor: DatasetDescriptor, fetcher: FetchLike): Promise<unknown> {
    return verifiedJson(descriptor, fetcher);
  }
}

export class GeoJsonAdapter implements DataAdapter<unknown> {
  readonly format: DatasetFormat = 'geojson';
  async load(descriptor: DatasetDescriptor, fetcher: FetchLike): Promise<unknown> {
    const payload = await verifiedJson(descriptor, fetcher) as { type?: unknown };
    if (payload == null || (payload.type !== 'FeatureCollection' && payload.type !== 'Feature')) {
      throw new Error('dataset-invalid-geojson');
    }
    return payload;
  }
}

export class DataLoader {
  private readonly adapters = new Map<DatasetFormat, DataAdapter>();
  constructor(
    adapters: DataAdapter[] = [new JsonAdapter(), new GeoJsonAdapter()],
    private readonly fetcher: FetchLike = globalThis.fetch.bind(globalThis)
  ) {
    for (const adapter of adapters) this.adapters.set(adapter.format, adapter);
  }

  register(adapter: DataAdapter): void { this.adapters.set(adapter.format, adapter); }

  async load<T = unknown>(descriptor: DatasetDescriptor): Promise<T> {
    const adapter = this.adapters.get(descriptor.format);
    if (!adapter) throw new Error(`dataset-format-not-supported:${descriptor.format}`);
    return adapter.load(descriptor, this.fetcher) as Promise<T>;
  }
}
