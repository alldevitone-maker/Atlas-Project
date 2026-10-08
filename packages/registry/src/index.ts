import type { AtlasModule, DatasetDescriptor, MetricDefinition, ComparisonPolicy } from '../../contracts/src/index.js';

export class Registry {
  private readonly modules = new Map<string, AtlasModule>();
  private readonly datasets = new Map<string, DatasetDescriptor>();
  private readonly metrics = new Map<string, MetricDefinition>();
  private readonly policies = new Map<string, ComparisonPolicy>();

  constructor(input: {
    modules?: AtlasModule[];
    datasets?: DatasetDescriptor[];
    metrics?: MetricDefinition[];
    policies?: ComparisonPolicy[];
  } = {}) {
    for (const item of input.modules ?? []) this.modules.set(item.id, item);
    for (const item of input.datasets ?? []) {
      const key = `${item.id}@${item.revision}`;
      const previous = this.datasets.get(key);
      if (previous && previous.checksum !== item.checksum) throw new Error(`dataset-revision-collision:${key}`);
      if (!previous) this.datasets.set(key, item);
    }
    for (const item of input.metrics ?? []) this.metrics.set(item.id, item);
    for (const item of input.policies ?? []) this.policies.set(item.id, item);
  }

  getModule(id: string): AtlasModule | undefined { return this.modules.get(id); }
  getDataset(id: string, revision?: string): DatasetDescriptor | undefined {
    if (revision) return this.datasets.get(`${id}@${revision}`);
    return this.listRevisions(id)[0];
  }

  listRevisions(id: string): DatasetDescriptor[] {
    return [...this.datasets.values()].filter(item => item.id === id)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.revision.localeCompare(a.revision));
  }
  getMetric(id: string): MetricDefinition | undefined { return this.metrics.get(id); }
  getPolicy(id: string): ComparisonPolicy | undefined { return this.policies.get(id); }

  activeModules(): AtlasModule[] {
    return [...this.modules.values()].filter(module => module.status === 'active');
  }

  resolveLatestDataset(query: { moduleId: string; periodId?: string; roundId?: string | null; territoryId?: string; domainId?: string }): DatasetDescriptor | undefined {
    const candidates = [...this.datasets.values()].filter(dataset =>
      dataset.moduleId === query.moduleId &&
      (query.territoryId == null || dataset.territoryId === query.territoryId) &&
      (query.domainId == null || dataset.domainId === query.domainId) &&
      (query.periodId == null || dataset.periodId === query.periodId) &&
      (query.roundId === undefined || dataset.roundId === query.roundId)
    );
    candidates.sort((a, b) => b.asOf.localeCompare(a.asOf) || b.publishedAt.localeCompare(a.publishedAt));
    return candidates[0];
  }
}
