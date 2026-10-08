export type SlotId = string;
export type SlotRenderer<TContext = unknown> = (context: TContext) => unknown;

export class SlotRegistry<TContext = unknown> {
  private readonly renderers = new Map<SlotId, SlotRenderer<TContext>>();

  register(slotId: SlotId, renderer: SlotRenderer<TContext>): void {
    this.renderers.set(slotId, renderer);
  }

  unregister(slotId: SlotId): void { this.renderers.delete(slotId); }

  has(slotId: SlotId): boolean { return this.renderers.has(slotId); }

  render(slotId: SlotId, context: TContext): unknown {
    const renderer = this.renderers.get(slotId);
    if (!renderer) return null;
    return renderer(context);
  }
}
