export type MessageCatalog = Record<string, string>;

export class I18n {
  constructor(
    private readonly catalogs: Record<string, MessageCatalog>,
    private locale: string,
    private readonly fallbackLocale?: string
  ) {}

  setLocale(locale: string): void { this.locale = locale; }
  getLocale(): string { return this.locale; }

  t(key: string, vars: Record<string, string | number> = {}): string {
    const raw = this.catalogs[this.locale]?.[key]
      ?? (this.fallbackLocale ? this.catalogs[this.fallbackLocale]?.[key] : undefined)
      ?? key;
    return raw.replace(/\{([A-Za-z0-9_.-]+)\}/g, (_match, name: string) => String(vars[name] ?? `{${name}}`));
  }
}
