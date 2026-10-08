export interface FeatureSelection {
  sourceId: string;
  featureId: string | number;
  properties: Record<string, unknown>;
}

export type SelectionListener = (selection: FeatureSelection | null) => void;

export class InteractionManager {
  private current: FeatureSelection | null = null;
  private readonly listeners = new Set<SelectionListener>();

  getSelection(): FeatureSelection | null { return this.current; }

  select(next: FeatureSelection): void {
    this.current = Object.freeze({ ...next, properties: Object.freeze({ ...next.properties }) });
    for (const listener of this.listeners) listener(this.current);
  }

  clear(): void {
    this.current = null;
    for (const listener of this.listeners) listener(null);
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
