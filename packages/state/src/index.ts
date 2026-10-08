export type AtlasState = Readonly<Record<string, string | boolean | null | undefined>>;
export type StateListener = (next: AtlasState, previous: AtlasState) => void;

export class AtlasStore {
  private current: AtlasState;
  private readonly listeners = new Set<StateListener>();

  constructor(initial: AtlasState = {}) { this.current = Object.freeze({ ...initial }); }
  get(): AtlasState { return this.current; }
  set(patch: Partial<AtlasState>): AtlasState {
    const previous = this.current;
    const next = Object.freeze({ ...previous, ...patch });
    this.current = next;
    for (const listener of this.listeners) listener(next, previous);
    return next;
  }
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
