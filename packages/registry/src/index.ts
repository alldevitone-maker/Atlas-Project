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
    for (const item of input.datasets ?? []) this.datasets.set(item.id, item);
    for (const item of input.metrics ?? []) this.metrics.set(item.id, item);
    for (const item of input.policies ?? []) this.policies.set(item.id, item);
  }

  getModule(id: string): AtlasModule | undefined { return this.modules.get(id); }
  getDataset(id: string): DatasetDescriptor | undefined { return this.datasets.get(id); }
  getMetric(id: string): MetricDefinition | undefined { return this.metrics.get(id); }
  getPolicy(id: string): ComparisonPolicy | undefined { return this.policies.get(id); }

  activeModules(): AtlasModule[] {
    return [...this.modules.values()].filter(module => module.status === 'active');
  }

  resolveLatestDataset(query: { moduleId: string; periodId?: string; roundId?: string | null }): DatasetDescriptor | undefined {
    const candidates = [...this.datasets.values()].filter(dataset =>
      dataset.moduleId === query.moduleId &&
      (query.periodId == null || dataset.periodId === query.periodId) &&
      (query.roundId === undefined || dataset.roundId === query.roundId)
    );
    candidates.sort((a, b) => b.asOf.localeCompare(a.asOf));
    return candidates[0];
  }
}
